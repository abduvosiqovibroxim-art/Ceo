"""Authentication endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from stario_common.auth import (
    User,
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    verify_password,
    verify_token,
)
from stario_common.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_verified: bool
    created_at: datetime


class TelegramAuthRequest(BaseModel):
    init_data: str  # Telegram WebApp init data


# Mock user storage (replace with database in production)
_users_db: dict[str, dict] = {}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user."""
    if request.email in _users_db:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    import uuid
    user_id = str(uuid.uuid4())

    _users_db[request.email] = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "full_name": request.full_name,
        "phone": request.phone,
        "role": "user",
        "is_verified": False,
        "created_at": datetime.utcnow(),
    }

    logger.info("user_registered", user_id=user_id, email=request.email)

    access_token = create_access_token(user_id=user_id, email=request.email)
    refresh_token = create_refresh_token(user_id=user_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with email and password."""
    user = _users_db.get(request.email)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    logger.info("user_logged_in", user_id=user["id"], email=request.email)

    access_token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
    )
    refresh_token = create_refresh_token(user_id=user["id"])

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,
    )


@router.post("/token", response_model=TokenResponse)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible login endpoint."""
    user = _users_db.get(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
    )
    refresh_token = create_refresh_token(user_id=user["id"])

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    token_data = verify_token(request.refresh_token)

    if token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    # Find user
    user = None
    for u in _users_db.values():
        if u["id"] == token_data.user_id:
            user = u
            break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
    )
    new_refresh_token = create_refresh_token(user_id=user["id"])

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=1800,
    )


@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(request: TelegramAuthRequest):
    """Authenticate via Telegram Mini App."""
    # Verify Telegram init data (implement proper validation in production)
    # https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

    import hashlib
    import hmac
    import json
    from urllib.parse import parse_qs

    from stario_common.config import get_settings

    settings = get_settings()

    # Parse init data
    parsed = parse_qs(request.init_data)
    user_data = json.loads(parsed.get("user", ["{}"])[0])

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram auth data",
        )

    telegram_id = str(user_data.get("id"))
    username = user_data.get("username", "")
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name", "")

    # Create or get user
    email = f"{telegram_id}@telegram.stario.uz"
    if email not in _users_db:
        import uuid
        user_id = str(uuid.uuid4())
        _users_db[email] = {
            "id": user_id,
            "email": email,
            "password_hash": "",
            "full_name": f"{first_name} {last_name}".strip(),
            "telegram_id": telegram_id,
            "telegram_username": username,
            "role": "user",
            "is_verified": True,  # Telegram users are auto-verified
            "created_at": datetime.utcnow(),
        }
        logger.info("telegram_user_registered", user_id=user_id, telegram_id=telegram_id)
    else:
        user_id = _users_db[email]["id"]
        logger.info("telegram_user_logged_in", user_id=user_id, telegram_id=telegram_id)

    user = _users_db[email]
    access_token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
    )
    refresh_token = create_refresh_token(user_id=user["id"])

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user profile."""
    # Find full user data
    for u in _users_db.values():
        if u["id"] == user.id:
            return UserResponse(
                id=u["id"],
                email=u["email"],
                full_name=u.get("full_name"),
                role=u["role"],
                is_verified=u["is_verified"],
                created_at=u["created_at"],
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found",
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """Logout current user (invalidate tokens)."""
    # In production, add token to blacklist in Redis
    logger.info("user_logged_out", user_id=user.id)
    return {"message": "Logged out successfully"}
