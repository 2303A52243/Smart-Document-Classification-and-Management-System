"""
Document routes — upload, list, search, detail, download, preview, delete, reclassify, update category.
"""
import logging
import math
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from bson import ObjectId

from app.core.dependencies import get_current_user
from app.database.connection import get_documents_collection
from app.nlp.extractor import extract_text
from app.nlp.classifier import classifier
from app.nlp.preprocessor import get_text_preview, count_words
from app.services.storage import save_file, get_file_path, delete_file, StorageError
from app.services.activity import log_activity
from app.core.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)


def _doc_to_response(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable response dict."""
    effective = doc.get("manually_corrected_category") or doc.get("predicted_category", "other")
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "original_filename": doc.get("original_filename", ""),
        "file_type": doc.get("file_type", ""),
        "file_size": doc.get("file_size", 0),
        "predicted_category": doc.get("predicted_category", "other"),
        "manually_corrected_category": doc.get("manually_corrected_category"),
        "effective_category": effective,
        "classification_score": doc.get("classification_score"),
        "needs_review": doc.get("needs_review", False),
        "processing_status": doc.get("processing_status", "complete"),
        "extraction_status": doc.get("extraction_status", "unknown"),
        "word_count": doc.get("word_count", 0),
        "uploaded_at": doc.get("uploaded_at", datetime.now(timezone.utc)).isoformat(),
        "updated_at": doc.get("updated_at", datetime.now(timezone.utc)).isoformat(),
        "model_version": doc.get("model_version", "unknown"),
        "text_preview": doc.get("text_preview", ""),
    }


async def _process_single_file(file: UploadFile, current_user: dict, col) -> dict:
    file_bytes = await file.read()
    stored_name, file_hash, file_size = save_file(file_bytes, file.filename)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "unknown"
    extracted_text, extraction_status, extraction_error = extract_text(file_bytes, file.filename)

    try:
        result = classifier.predict(extracted_text, extraction_status)
    except RuntimeError:
        result = None

    word_count = count_words(extracted_text)
    text_preview = get_text_preview(extracted_text)
    now = datetime.now(timezone.utc)

    document = {
        "user_id": str(current_user["_id"]),
        "original_filename": file.filename,
        "stored_filename": stored_name,
        "file_hash": file_hash,
        "file_type": ext,
        "file_size": file_size,
        "word_count": word_count,
        "extracted_text": extracted_text,
        "text_preview": text_preview,
        "extraction_status": extraction_status,
        "extraction_error": extraction_error,
        "predicted_category": str(result.predicted_category) if result else "pending",
        "manually_corrected_category": None,
        "classification_score": float(result.confidence_score) if (result and result.confidence_score is not None) else None,
        "needs_review": bool(result.needs_review) if result else True,
        "alternatives": [[str(c), float(s)] for c, s in result.alternatives] if result else [],
        "model_version": str(result.model_version) if result else "not-loaded",
        "processing_status": "complete" if result else "pending",
        "uploaded_at": now,
        "updated_at": now,
    }

    insert_result = await col.insert_one(document)
    document["_id"] = insert_result.inserted_id

    await log_activity(
        str(current_user["_id"]),
        str(insert_result.inserted_id),
        "upload",
        {"category": document["predicted_category"], "filename": file.filename},
    )
    return _doc_to_response(document)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload, extract text, classify, and store a document."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    try:
        return await _process_single_file(file, current_user, col)
    except StorageError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/upload-multiple", status_code=status.HTTP_201_CREATED)
async def upload_multiple_documents(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload multiple documents in a single request."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    results = []
    errors = []
    for f in files:
        try:
            doc = await _process_single_file(f, current_user, col)
            results.append(doc)
        except Exception as e:
            errors.append({"filename": f.filename, "error": str(e)})

    return {"uploaded": results, "errors": errors, "total_processed": len(files)}


@router.get("/search")
async def search_documents(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Dedicated search endpoint across filenames and extracted content."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    user_id = str(current_user["_id"])
    query = {
        "user_id": user_id,
        "$or": [
            {"original_filename": {"$regex": q, "$options": "i"}},
            {"extracted_text": {"$regex": q, "$options": "i"}},
            {"predicted_category": {"$regex": q, "$options": "i"}},
            {"manually_corrected_category": {"$regex": q, "$options": "i"}},
        ]
    }

    cursor = col.find(query, {"extracted_text": 0}).sort("uploaded_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_doc_to_response(d) for d in docs]


@router.get("")
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("uploaded_at"),
    sort_order: str = Query("desc"),
    current_user: dict = Depends(get_current_user),
):
    """List documents for the current user with pagination, filtering and search."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    query = {"user_id": str(current_user["_id"])}

    if category and category != "all":
        query["$or"] = [
            {"predicted_category": category},
            {"manually_corrected_category": category},
        ]

    if search:
        query["$or"] = [
            {"original_filename": {"$regex": search, "$options": "i"}},
            {"extracted_text": {"$regex": search, "$options": "i"}},
        ]

    sort_direction = -1 if sort_order == "desc" else 1
    total = await col.count_documents(query)
    skip = (page - 1) * page_size

    cursor = col.find(query, {"extracted_text": 0}).sort(sort_by, sort_direction).skip(skip).limit(page_size)
    docs = await cursor.to_list(length=page_size)

    return {
        "items": [_doc_to_response(d) for d in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@router.get("/{doc_id}")
async def get_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Get full document details including extracted text."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    try:
        doc = await col.find_one({"_id": ObjectId(doc_id), "user_id": str(current_user["_id"])})
    except Exception:
        raise HTTPException(400, "Invalid document ID.")

    if not doc:
        raise HTTPException(404, "Document not found.")

    response = _doc_to_response(doc)
    response["extracted_text"] = doc.get("extracted_text", "")
    response["alternatives"] = doc.get("alternatives", [])
    return response


@router.get("/{doc_id}/download")
async def download_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Stream the original stored file for download."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    try:
        doc = await col.find_one({"_id": ObjectId(doc_id), "user_id": str(current_user["_id"])})
    except Exception:
        raise HTTPException(400, "Invalid document ID.")

    if not doc:
        raise HTTPException(404, "Document not found.")

    try:
        file_path = get_file_path(doc["stored_filename"])
    except (FileNotFoundError, StorageError) as e:
        raise HTTPException(404, f"File not found on disk: {str(e)}")

    return FileResponse(
        path=str(file_path),
        filename=doc["original_filename"],
        media_type="application/octet-stream",
    )


@router.get("/{doc_id}/preview")
async def preview_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Serve the document inline for in-browser preview."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    try:
        doc = await col.find_one({"_id": ObjectId(doc_id), "user_id": str(current_user["_id"])})
    except Exception:
        raise HTTPException(400, "Invalid document ID.")

    if not doc:
        raise HTTPException(404, "Document not found.")

    try:
        file_path = get_file_path(doc["stored_filename"])
    except (FileNotFoundError, StorageError) as e:
        raise HTTPException(404, f"File not found: {str(e)}")

    content_type_map = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    ft = doc.get("file_type", "bin")
    media_type = content_type_map.get(ft, "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        headers={"Content-Disposition": f"inline; filename=\"{doc['original_filename']}\""}
    )


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Delete document record and stored file."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    try:
        doc = await col.find_one({"_id": ObjectId(doc_id), "user_id": str(current_user["_id"])})
    except Exception:
        raise HTTPException(400, "Invalid document ID.")

    if not doc:
        raise HTTPException(404, "Document not found.")

    delete_file(doc.get("stored_filename", ""))
    await col.delete_one({"_id": ObjectId(doc_id)})
    await log_activity(str(current_user["_id"]), doc_id, "delete")


@router.patch("/{doc_id}/category")
async def update_category(
    doc_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Manually correct the predicted document category."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    new_category = payload.get("category", "").strip().lower()
    if not new_category or new_category not in settings.CATEGORIES:
        raise HTTPException(400, f"Invalid category. Must be one of: {settings.CATEGORIES}")

    try:
        doc = await col.find_one({"_id": ObjectId(doc_id), "user_id": str(current_user["_id"])})
    except Exception:
        raise HTTPException(400, "Invalid document ID.")

    if not doc:
        raise HTTPException(404, "Document not found.")

    await col.update_one(
        {"_id": ObjectId(doc_id)},
        {
            "$set": {
                "manually_corrected_category": new_category,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    await log_activity(
        str(current_user["_id"]),
        doc_id,
        "category_correction",
        {"old": doc.get("predicted_category"), "new": new_category},
    )

    return {"message": "Category updated.", "new_category": new_category}


@router.post("/{doc_id}/reclassify")
async def reclassify_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Re-run the NLP classifier on an existing document's extracted text."""
    col = get_documents_collection()
    if col is None:
        raise HTTPException(503, "Database unavailable.")

    if not classifier.is_loaded():
        raise HTTPException(503, "NLP model is not loaded. Train it first.")

    try:
        doc = await col.find_one({"_id": ObjectId(doc_id), "user_id": str(current_user["_id"])})
    except Exception:
        raise HTTPException(400, "Invalid document ID.")

    if not doc:
        raise HTTPException(404, "Document not found.")

    text = doc.get("extracted_text", "")
    result = classifier.predict(text, doc.get("extraction_status", "unknown"))
    old_cat = doc.get("predicted_category", "other")

    await col.update_one(
        {"_id": ObjectId(doc_id)},
        {
            "$set": {
                "predicted_category": str(result.predicted_category),
                "classification_score": float(result.confidence_score) if result.confidence_score is not None else None,
                "needs_review": bool(result.needs_review),
                "model_version": str(result.model_version),
                "alternatives": [[str(c), float(s)] for c, s in result.alternatives],
                "manually_corrected_category": None,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    await log_activity(str(current_user["_id"]), doc_id, "reclassify")

    return {
        "document_id": doc_id,
        "old_category": old_cat,
        "new_category": result.predicted_category,
        "confidence_score": result.confidence_score,
        "needs_review": result.needs_review,
        "alternatives": result.alternatives,
    }
