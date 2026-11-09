"""
Secure file storage service — saves uploaded files with UUID names
to prevent path traversal and filename collisions.
"""
import os
import uuid
import hashlib
import logging
from pathlib import Path
from typing import Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    pass


def sanitize_filename(filename: str) -> str:
    """Strip path components from user-supplied filenames."""
    return os.path.basename(filename) or "document"


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save_file(file_bytes: bytes, original_filename: str) -> Tuple[str, str, int]:
    """
    Persist an uploaded file with a UUID-based name.
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

    target.write_bytes(file_bytes)
    logger.info(f"Saved file: {stored_name} ({file_size} bytes)")
    return stored_name, file_hash, file_size


def get_file_path(stored_filename: str) -> Path:
    """Safely resolve stored file path, rejecting traversal attempts."""
    safe_name = os.path.basename(stored_filename)
    path = (settings.UPLOAD_DIR / safe_name).resolve()

    if settings.UPLOAD_DIR.resolve() not in path.parents:
        raise StorageError("Path traversal rejected.")

    if not path.exists():
        raise FileNotFoundError(f"File not found: {safe_name}")

    return path


def delete_file(stored_filename: str) -> bool:
    """Delete a stored file. Returns True on success, False if already missing."""
    try:
        path = get_file_path(stored_filename)
        path.unlink()
        return True
    except (FileNotFoundError, StorageError):
        return False

