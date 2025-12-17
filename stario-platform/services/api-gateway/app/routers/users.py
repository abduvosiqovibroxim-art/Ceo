"""User management endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from stario_common.auth import User, get_current_user, require_role, Roles

router = APIRouter()


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_verified: bool
    created_at: datetime
    preferences: dict


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[dict] = None


class UserPreferences(BaseModel):
    notifications_enabled: bool = True
    email_notifications: bool = True
    push_notifications: bool = True
    language: str = "uz"
    theme: str = "light"
    favorite_artists: list[str] = []


class DataExportRequest(BaseModel):
    format: str = "json"  # json or csv
    include_orders: bool = True
    include_generated_content: bool = True


class DataDeletionRequest(BaseModel):
    confirm_email: EmailStr
    reason: Optional[str] = None


@router.get("/me", response_model=UserProfile)
async def get_profile(user: User = Depends(get_current_user)):
    """Get current user's profile."""
    # Mock data - replace with database query
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name="Test User",
        phone="+998901234567",
        avatar_url=None,
        role=user.role,
        is_verified=user.is_verified,
        created_at=datetime.utcnow(),
        preferences={
            "notifications_enabled": True,
            "language": "uz",
        },
    )


@router.patch("/me", response_model=UserProfile)
async def update_profile(
    request: UpdateProfileRequest,
    user: User = Depends(get_current_user),
):
    """Update current user's profile."""
    # Update user in database
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=request.full_name or "Test User",
        phone=request.phone,
        avatar_url=request.avatar_url,
        role=user.role,
        is_verified=user.is_verified,
        created_at=datetime.utcnow(),
        preferences={},
    )


@router.get("/me/preferences", response_model=UserPreferences)
async def get_preferences(user: User = Depends(get_current_user)):
    """Get user preferences."""
    return UserPreferences()


@router.put("/me/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferences,
    user: User = Depends(get_current_user),
):
    """Update user preferences."""
    return preferences


@router.post("/me/export")
async def request_data_export(
    request: DataExportRequest,
    user: User = Depends(get_current_user),
):
    """Request export of all user data (GDPR/local law compliance)."""
    # Queue data export job
    return {
        "message": "Data export request received",
        "request_id": "exp_" + user.id[:8],
        "estimated_completion": "24 hours",
        "format": request.format,
    }


@router.post("/me/delete")
async def request_account_deletion(
    request: DataDeletionRequest,
    user: User = Depends(get_current_user),
):
    """Request account and data deletion (GDPR/local law compliance)."""
    if request.confirm_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email confirmation does not match",
        )

    # Queue deletion job (soft delete with 30-day grace period)
    return {
        "message": "Deletion request received",
        "request_id": "del_" + user.id[:8],
        "grace_period_days": 30,
        "final_deletion_date": (datetime.utcnow()).isoformat(),
    }


@router.get("/{user_id}", response_model=UserProfile)
async def get_user_by_id(
    user_id: str,
    admin: User = Depends(require_role([Roles.ADMIN, Roles.OPERATOR])),
):
    """Get user by ID (admin only)."""
    # Mock data
    return UserProfile(
        id=user_id,
        email="user@example.com",
        full_name="Test User",
        phone="+998901234567",
        avatar_url=None,
        role="user",
        is_verified=True,
        created_at=datetime.utcnow(),
        preferences={},
    )


@router.get("")
async def list_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    admin: User = Depends(require_role([Roles.ADMIN, Roles.OPERATOR])),
):
    """List all users (admin only)."""
    return {
        "items": [],
        "total": 0,
        "page": page,
        "page_size": page_size,
    }
