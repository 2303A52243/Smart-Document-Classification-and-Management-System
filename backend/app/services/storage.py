"""
Secure file storage service — supports local filesystem and S3-compatible object storage
(e.g., Cloudflare R2, Supabase Storage, AWS S3, MinIO) with UUID-based names to prevent
path traversal and collisions.
"""
import io
import os
import uuid
import hashlib
import logging
from pathlib import Path
from typing import Tuple, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    pass


def _get_s3_client():
    """Lazily initialize and return boto3 S3 client if configured."""
    if settings.STORAGE_BACKEND != "s3":
        return None

    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        logger.error("boto3 is required for S3 storage backend but is not installed.")
        raise StorageError("boto3 library missing for S3 storage.")

    kwargs = {
        "service_name": "s3",
        "region_name": settings.S3_REGION or "auto",
        "aws_access_key_id": settings.S3_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY,
        "config": Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    }
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

    return boto3.client(**kwargs)


def sanitize_filename(filename: str) -> str:
    """Strip path components from user-supplied filenames."""
    return os.path.basename(filename) or "document"


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _get_content_type(ext: str) -> str:
    content_type_map = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    return content_type_map.get(ext.lower(), "application/octet-stream")


def save_file(file_bytes: bytes, original_filename: str) -> Tuple[str, str, int]:
    """
    Persist an uploaded file with a UUID-based name to local storage and/or S3.
    Returns (stored_filename, sha256_hash, file_size_bytes).
    """
    file_size = len(file_bytes)

    if file_size == 0:
        raise StorageError("Cannot save an empty file.")

    if file_size > settings.MAX_FILE_SIZE_BYTES:
        mb = settings.MAX_FILE_SIZE_MB
        raise StorageError(f"File exceeds maximum size of {mb} MB.")

    ext = Path(original_filename).suffix.lower().lstrip(".")
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise StorageError(f"File type '.{ext}' is not permitted. Allowed: {settings.ALLOWED_EXTENSIONS}")

    file_hash = compute_sha256(file_bytes)
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    target = (settings.UPLOAD_DIR / stored_name).resolve()

    # Path traversal guard
    if settings.UPLOAD_DIR.resolve() not in target.parents:
        raise StorageError("Storage path violation detected.")

    # Always write to local storage/cache
    try:
        target.write_bytes(file_bytes)
    except Exception as e:
        logger.error(f"Failed to write local file: {e}")
        if settings.STORAGE_BACKEND != "s3":
            raise StorageError(f"Failed to persist file: {e}")

    # If S3 backend is enabled, upload to object storage
    if settings.STORAGE_BACKEND == "s3":
        try:
            s3 = _get_s3_client()
            if s3:
                s3.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=stored_name,
                    Body=file_bytes,
                    ContentType=_get_content_type(ext),
                    Metadata={
                        "original_filename": original_filename,
                        "sha256": file_hash,
                    },
                )
                logger.info(f"Uploaded to S3 ({settings.S3_BUCKET_NAME}): {stored_name}")
        except Exception as e:
            logger.error(f"S3 upload failed for {stored_name}: {e}")
            if target.exists():
                try:
                    target.unlink()
                except Exception:
                    pass
            raise StorageError(f"Cloud storage upload failed: {e}")

    logger.info(f"Saved file: {stored_name} ({file_size} bytes)")
    return stored_name, file_hash, file_size


def get_file_path(stored_filename: str) -> Path:
    """
    Safely resolve stored file path. If missing locally and S3 is enabled,
    restores the file from object storage to local cache automatically.
    """
    safe_name = os.path.basename(stored_filename)
    path = (settings.UPLOAD_DIR / safe_name).resolve()

    if settings.UPLOAD_DIR.resolve() not in path.parents:
        raise StorageError("Path traversal rejected.")

    # If file exists on local disk, return path
    if path.exists():
        return path

    # If not on local disk, check if S3 is configured to restore it
    if settings.STORAGE_BACKEND == "s3":
        try:
            s3 = _get_s3_client()
            if s3:
                logger.info(f"Restoring {safe_name} from S3 bucket {settings.S3_BUCKET_NAME} to local cache...")
                response = s3.get_object(Bucket=settings.S3_BUCKET_NAME, Key=safe_name)
                data = response["Body"].read()
                path.write_bytes(data)
                return path
        except Exception as e:
            logger.error(f"Failed to fetch {safe_name} from S3: {e}")
            raise FileNotFoundError(f"File not found in cloud storage: {safe_name}")

    raise FileNotFoundError(f"File not found: {safe_name}")


def get_file_bytes(stored_filename: str) -> bytes:
    """Retrieve raw file bytes from local disk or S3."""
    path = get_file_path(stored_filename)
    return path.read_bytes()


def delete_file(stored_filename: str) -> bool:
    """Delete a stored file from local cache and S3 object storage."""
    safe_name = os.path.basename(stored_filename)
    local_deleted = False

    try:
        path = (settings.UPLOAD_DIR / safe_name).resolve()
        if path.exists() and settings.UPLOAD_DIR.resolve() in path.parents:
            path.unlink()
            local_deleted = True
    except Exception as e:
        logger.warning(f"Failed to delete local file {safe_name}: {e}")

    # If S3 backend is enabled, delete from bucket
    s3_deleted = False
    if settings.STORAGE_BACKEND == "s3":
        try:
            s3 = _get_s3_client()
            if s3:
                s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=safe_name)
                s3_deleted = True
                logger.info(f"Deleted from S3: {safe_name}")
        except Exception as e:
            logger.error(f"Failed to delete {safe_name} from S3: {e}")

    return local_deleted or s3_deleted
