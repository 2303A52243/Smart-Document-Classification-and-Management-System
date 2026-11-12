"""
Categories and health routes.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.database.connection import get_documents_collection
from app.nlp.classifier import classifier

categories_router = APIRouter(prefix="/categories", tags=["Categories"])
health_router = APIRouter(tags=["Health"])


@categories_router.get("")
async def list_categories(current_user: dict = Depends(get_current_user)):
    """Return all configured categories with document counts for the user."""
    col = get_documents_collection()
    user_id = str(current_user["_id"])

    result = []
    for cat in settings.CATEGORIES:
        count = await col.count_documents({
            "user_id": user_id,
            "$or": [
                {"predicted_category": cat},
                {"manually_corrected_category": cat},
            ],
        })
        result.append({"name": cat, "count": count})

    return result


@categories_router.get("/{category_name}/documents")
async def get_category_documents(
    category_name: str,
    current_user: dict = Depends(get_current_user),
):
    """Get the 10 most recent documents in a category."""
    col = get_documents_collection()
    user_id = str(current_user["_id"])

    cursor = col.find({
        "user_id": user_id,
        "$or": [
            {"predicted_category": category_name},
            {"manually_corrected_category": category_name},
        ],
    }, {"extracted_text": 0}).sort("uploaded_at", -1).limit(10)

    docs = await cursor.to_list(length=10)
    return [
        {
            "id": str(d["_id"]),
            "original_filename": d.get("original_filename", ""),
            "effective_category": d.get("manually_corrected_category") or d.get("predicted_category", "other"),
            "uploaded_at": d.get("uploaded_at", datetime.now(timezone.utc)).isoformat(),
        }
        for d in docs
    ]


@health_router.get("/health")
def health_check():
    """API health and readiness check endpoint."""
    from app.database.connection import db_instance
    db_connected = db_instance.client is not None and db_instance.db is not None
    is_ready = classifier.is_loaded()
    return {
        "status": "ok" if is_ready else "error",
        "database_connected": db_connected,
        "model_loaded": classifier.is_loaded(),
        "model_version": classifier.model_version,
        "storage_backend": settings.STORAGE_BACKEND,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

