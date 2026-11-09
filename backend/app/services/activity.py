"""
Activity logging service — records user actions for the analytics dashboard.
"""
import logging
from datetime import datetime, timezone

from app.database.connection import get_activity_logs_collection

logger = logging.getLogger(__name__)


async def log_activity(user_id: str, document_id: str, action: str, details: dict = None):
    """Insert an activity log entry."""
    col = get_activity_logs_collection()
    if col is None:
        return  # Silently skip if DB not available

    try:
        await col.insert_one({
            "user_id": user_id,
            "document_id": document_id,
            "action": action,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc),
        })
    except Exception as e:
        logger.warning(f"Activity log error: {e}")

