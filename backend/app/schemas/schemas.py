"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── Auth Schemas ───────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


# ─── Document Schemas ────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    original_filename: str
    file_type: str
    file_size: int
    predicted_category: str
    manually_corrected_category: Optional[str] = None
    effective_category: str
    classification_score: Optional[float] = None
    needs_review: bool = False
    processing_status: str
    extraction_status: str
    word_count: int = 0
    uploaded_at: datetime
    updated_at: datetime
    model_version: str


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CategoryUpdateRequest(BaseModel):
    category: str
    notes: Optional[str] = None


class ReclassifyResponse(BaseModel):
    document_id: str
    old_category: str
    new_category: str
    confidence_score: Optional[float]
    needs_review: bool


# ─── Analytics Schemas ────────────────────────────────────────────────────────

class OverviewStats(BaseModel):
    total_documents: int
    classified_documents: int
    pending_documents: int
    total_categories: int
    needs_review: int
    corrected: int


class CategoryStats(BaseModel):
    category: str
    count: int
    percentage: float


class DailyActivity(BaseModel):
    date: str
    uploads: int


class AnalyticsResponse(BaseModel):
    overview: OverviewStats
    category_distribution: List[CategoryStats]
    daily_activity: List[DailyActivity]
    model_loaded: bool

