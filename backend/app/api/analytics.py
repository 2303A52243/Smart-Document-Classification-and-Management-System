"""
Analytics routes — overview stats, category distribution, activity charts, and model metrics.
"""
import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.dependencies import get_current_user
from app.database.connection import get_documents_collection, get_activity_logs_collection
from app.nlp.classifier import classifier
from app.core.config import settings

router = APIRouter(prefix="/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)


@router.get("/overview")
async def get_overview(current_user: dict = Depends(get_current_user)):
    """Return overview statistics for the authenticated user."""
    col = get_documents_collection()
    user_id = str(current_user["_id"])
    base_query = {"user_id": user_id}

    total = await col.count_documents(base_query)
    classified = await col.count_documents({**base_query, "processing_status": "complete"})
    pending = await col.count_documents({**base_query, "processing_status": "pending"})
    needs_review = await col.count_documents({**base_query, "needs_review": True})
    corrected = await col.count_documents({
        **base_query,
        "manually_corrected_category": {"$ne": None, "$exists": True},
    })

    return {
        "total_documents": total,
        "classified_documents": classified,
        "pending_documents": pending,
        "total_categories": len(settings.CATEGORIES),
        "needs_review": needs_review,
        "corrected": corrected,
        "model_loaded": classifier.is_loaded(),
        "model_version": classifier.model_version,
    }


@router.get("/categories")
async def get_category_distribution(current_user: dict = Depends(get_current_user)):
    """Return document count per effective category."""
    col = get_documents_collection()
    user_id = str(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$addFields": {
                "effective_cat": {
                    "$ifNull": ["$manually_corrected_category", "$predicted_category"]
                }
            }
        },
        {"$group": {"_id": "$effective_cat", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]

    cursor = col.aggregate(pipeline)
    results = await cursor.to_list(length=50)
    total = sum(r["count"] for r in results)

    return [
        {
            "category": r["_id"] or "other",
            "count": r["count"],
            "percentage": round(r["count"] / total * 100, 1) if total > 0 else 0,
        }
        for r in results
    ]


@router.get("/activity")
async def get_activity(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """Return daily upload counts for the last N days."""
    col = get_documents_collection()
    user_id = str(current_user["_id"])
    since = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": user_id, "uploaded_at": {"$gte": since}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$uploaded_at"}
                },
                "uploads": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    cursor = col.aggregate(pipeline)
    results = await cursor.to_list(length=days)

    return [{"date": r["_id"], "uploads": r["uploads"]} for r in results]


@router.get("/recent")
async def get_recent_activity(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
):
    """Return recent document activity logs."""
    col = get_activity_logs_collection()
    user_id = str(current_user["_id"])

    cursor = col.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)

    return [
        {
            "id": str(log["_id"]),
            "document_id": log.get("document_id", ""),
            "action": log.get("action", ""),
            "details": log.get("details", {}),
            "timestamp": log.get("timestamp", datetime.now(timezone.utc)).isoformat(),
        }
        for log in logs
    ]


@router.get("/metrics")
async def get_model_metrics():
    """Return NLP model evaluation metrics (accuracy, precision, recall, confusion matrix)."""
    metrics_path = settings.MODEL_DIR / "model_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="Model metrics report not found. Train the model first.")

    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read metrics: {str(e)}")
