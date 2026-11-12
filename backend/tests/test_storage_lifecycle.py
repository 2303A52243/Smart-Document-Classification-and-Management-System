import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from botocore.exceptions import ClientError
from app.services.storage import (
    save_file,
    get_file_path,
    delete_file,
    get_file_bytes,
    StorageError,
)
from app.core.config import settings


def test_s3_upload_download_lifecycle():
    """Verify S3 upload, local caching, and byte integrity."""
    mock_s3 = MagicMock()
    content = b"Production readiness PDF content sample"

    with patch("app.services.storage._get_s3_client", return_value=mock_s3):
        with patch.object(settings, "STORAGE_BACKEND", "s3"):
            stored_name, file_hash, file_size = save_file(content, "report.pdf")
            assert stored_name.endswith(".pdf")
            assert file_size == len(content)

            # S3 put_object called with exact bytes and metadata
            mock_s3.put_object.assert_called_once()
            call_kwargs = mock_s3.put_object.call_args[1]
            assert call_kwargs["Key"] == stored_name
            assert call_kwargs["Body"] == content

            # Verify local cache file exists
            local_path = settings.UPLOAD_DIR / stored_name
            assert local_path.exists()
            assert local_path.read_bytes() == content

            # Clean up
            delete_file(stored_name)
            assert not local_path.exists()


def test_cloud_to_local_cache_restoration_after_restart():
    """Simulate a container wipe on restart and verify auto-restoration from S3."""
    mock_s3 = MagicMock()
    content = b"Document restored from Cloudflare R2 bucket"
    stored_name = "restored_doc.pdf"

    # Ensure local file does NOT exist (simulating fresh container)
    local_path = settings.UPLOAD_DIR / stored_name
    if local_path.exists():
        local_path.unlink()

    # Mock S3 get_object returning the cloud file bytes
    mock_s3.get_object.return_value = {
        "Body": MagicMock(read=lambda: content)
    }

    with patch("app.services.storage._get_s3_client", return_value=mock_s3):
        with patch.object(settings, "STORAGE_BACKEND", "s3"):
            # Request file path — should trigger S3 download to local cache
            resolved_path = get_file_path(stored_name)
            assert resolved_path.exists()
            assert resolved_path.read_bytes() == content
            mock_s3.get_object.assert_called_once_with(
                Bucket=settings.S3_BUCKET_NAME, Key=stored_name
            )

            # Second request should use local cache and NOT call S3 again
            mock_s3.get_object.reset_mock()
            cached_path = get_file_path(stored_name)
            assert cached_path == resolved_path
            mock_s3.get_object.assert_not_called()

            # Clean up
            delete_file(stored_name)


def test_missing_file_in_both_local_and_cloud():
    """Verify missing file raises FileNotFoundError with clear message."""
    mock_s3 = MagicMock()
    # S3 returns NoSuchKey error
    mock_s3.get_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "The specified key does not exist."}},
        "GetObject",
    )

    with patch("app.services.storage._get_s3_client", return_value=mock_s3):
        with patch.object(settings, "STORAGE_BACKEND", "s3"):
            with pytest.raises(FileNotFoundError, match="not found in cloud storage"):
                get_file_path("non_existent_file_999.pdf")


def test_failed_cloud_upload_cleans_up_local_file():
    """Verify that if S3 upload fails, local temporary file is cleaned up."""
    mock_s3 = MagicMock()
    mock_s3.put_object.side_effect = Exception("S3 bucket unavailable / network timeout")
    content = b"Failed upload data"

    with patch("app.services.storage._get_s3_client", return_value=mock_s3):
        with patch.object(settings, "STORAGE_BACKEND", "s3"):
            with pytest.raises(StorageError, match="Cloud storage upload failed"):
                save_file(content, "fail_test.pdf")

            # Verify no orphan files remain in UPLOAD_DIR
            orphan_matches = list(settings.UPLOAD_DIR.glob("*fail_test*"))
            assert len(orphan_matches) == 0


def test_delete_handles_already_missing_cloud_file_gracefully():
    """Verify deletion returns True/False without crashing if file is already gone."""
    mock_s3 = MagicMock()
    # S3 delete on non-existent object succeeds gracefully according to S3 specs
    mock_s3.delete_object.return_value = {}

    with patch("app.services.storage._get_s3_client", return_value=mock_s3):
        with patch.object(settings, "STORAGE_BACKEND", "s3"):
            result = delete_file("already_deleted_123.pdf")
            # Should not raise exception
            assert isinstance(result, bool)

