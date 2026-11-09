"""
Authentication routes — register, login, get current user, update profile, change password.
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from pydantic import BaseModel, Field

from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.database.connection import get_users_collection
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": user.get("created_at", datetime.now(timezone.utc)).isoformat(),
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    """Register a new user account."""
    col = get_users_collection()
    if col is None:
        raise HTTPException(503, "Database is unavailable.")

    # Check duplicate email
    existing = await col.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An account with this email already exists.")

    new_user = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc),
    }
    result = await col.insert_one(new_user)
    new_user["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=_serialize_user(new_user))


@router.post("/login")
async def login(payload: UserLogin):
    """Authenticate and return a JWT token."""
    col = get_users_collection()
    if col is None:
        raise HTTPException(503, "Database is unavailable.")

    user = await col.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=_serialize_user(user))


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return _serialize_user(current_user)


@router.patch("/profile")
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update user's profile display name."""
    col = get_users_collection()
    if col is None:
        raise HTTPException(503, "Database is unavailable.")

    user_id = current_user["_id"]
    await col.update_one(
        {"_id": user_id},
        {"$set": {"name": payload.name.strip()}}
    )
    current_user["name"] = payload.name.strip()
    return {"message": "Profile updated successfully.", "user": _serialize_user(current_user)}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    """Change current user's password."""
    col = get_users_collection()
    if col is None:
        raise HTTPException(503, "Database is unavailable.")

    user_id = current_user["_id"]
    user = await col.find_one({"_id": user_id})
    if not user or not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")

    new_hash = hash_password(payload.new_password)
    await col.update_one(
        {"_id": user_id},
        {"$set": {"password_hash": new_hash}}
    )
    return {"message": "Password changed successfully."}
