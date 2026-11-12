import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from app.services.storage import (
    save_file,
    get_file_path,
    delete_file,
    get_file_bytes,
    StorageError,
    sanitize_filename,
    compute_sha256,
)
from app.core.config import settings


def test_sanitize_filename():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("normal_file.pdf") == "normal_file.pdf"
    assert sanitize_filename("") == "document"


def test_compute_sha256():
    data = b"Hello Antigravity Storage"
    hash_val = compute_sha256(data)
    assert len(hash_val) == 64
    assert isinstance(hash_val, str)


def test_save_empty_file_fails():
    with pytest.raises(StorageError, match="Cannot save an empty file"):
        save_file(b"", "empty.txt")


def test_save_unpermitted_extension_fails():
    with pytest.raises(StorageError, match="not permitted"):
        save_file(b"malicious data", "hack.exe")


def test_save_and_retrieve_local_file():
    content = b"This is a valid test document content."
    stored_name, file_hash, file_size = save_file(content, "test_doc.txt")

    assert stored_name.endswith(".txt")
    assert file_size == len(content)
    assert file_hash == compute_sha256(content)

    # Retrieve file path
    path = get_file_path(stored_name)
    assert path.exists()
    assert path.read_bytes() == content

    # Retrieve raw bytes
    raw_bytes = get_file_bytes(stored_name)
    assert raw_bytes == content

    # Clean up
    deleted = delete_file(stored_name)
    assert deleted is True
    assert not path.exists()


def test_s3_storage_mocked():
    """Verify that S3 upload, restore and delete are called correctly when STORAGE_BACKEND=s3."""
    content = b"Cloud storage persistent content."
    mock_s3 = MagicMock()

    with patch("app.services.storage._get_s3_client", return_value=mock_s3):
        with patch.object(settings, "STORAGE_BACKEND", "s3"):
            stored_name, file_hash, file_size = save_file(content, "cloud_test.pdf")

            # Verify put_object was called
            mock_s3.put_object.assert_called_once()
            call_kwargs = mock_s3.put_object.call_args[1]
            assert call_kwargs["Key"] == stored_name
            assert call_kwargs["Body"] == content

            # Test S3 restore when local file is missing
            local_path = settings.UPLOAD_DIR / stored_name
            if local_path.exists():
                local_path.unlink()

            # Mock S3 get_object return
            mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: content)}
            restored_path = get_file_path(stored_name)
            assert restored_path.exists()
            assert restored_path.read_bytes() == content

            # Test delete
            delete_file(stored_name)
            mock_s3.delete_object.assert_called_once_with(
                Bucket=settings.S3_BUCKET_NAME, Key=stored_name
            )

