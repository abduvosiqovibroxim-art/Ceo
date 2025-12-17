"""
Authentication utilities - JWT tokens, OAuth2, and user management.
"""

from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from .config import get_settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security schemes
bearer_scheme = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


class TokenData(BaseModel):
    """JWT token payload."""

    user_id: str
    email: Optional[str] = None
    role: str = "user"
    permissions: list[str] = []
    exp: datetime
    iat: datetime
    type: str = "access"  # access or refresh


class User(BaseModel):
    """User model for authentication."""

    id: str
    email: str
    role: str = "user"
    permissions: list[str] = []
    is_active: bool = True
    is_verified: bool = False


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: str,
    email: Optional[str] = None,
    role: str = "user",
    permissions: Optional[list[str]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    settings = get_settings()

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)

    now = datetime.utcnow()
    expire = now + expires_delta

    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "permissions": permissions or [],
        "exp": expire,
        "iat": now,
        "type": "access",
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token."""
    settings = get_settings()

    now = datetime.utcnow()
    expire = now + timedelta(days=settings.jwt_refresh_token_expire_days)

    payload = {
        "user_id": user_id,
        "exp": expire,
        "iat": now,
        "type": "refresh",
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token."""
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return TokenData(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    oauth_token: Optional[str] = Depends(oauth2_scheme),
) -> User:
    """FastAPI dependency to get the current authenticated user."""

    token = None
    if bearer:
        token = bearer.credentials
    elif oauth_token:
        token = oauth_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = verify_token(token)

    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return User(
        id=token_data.user_id,
        email=token_data.email or "",
        role=token_data.role,
        permissions=token_data.permissions,
    )


async def get_current_user_optional(
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    oauth_token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """FastAPI dependency to get the current user if authenticated."""
    try:
        return await get_current_user(bearer, oauth_token)
    except HTTPException:
        return None


def require_role(allowed_roles: list[str]):
    """Dependency factory for role-based access control."""

    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' not authorized. Required: {allowed_roles}",
            )
        return user

    return role_checker


def require_permission(required_permissions: list[str]):
    """Dependency factory for permission-based access control."""

    async def permission_checker(user: User = Depends(get_current_user)) -> User:
        missing = set(required_permissions) - set(user.permissions)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {missing}",
            )
        return user

    return permission_checker


# Role constants
class Roles:
    ADMIN = "admin"
    OPERATOR = "operator"
    VALIDATOR = "validator"
    ARTIST = "artist"
    USER = "user"


# Permission constants
class Permissions:
    # Artists
    MANAGE_ARTISTS = "artists:manage"
    VIEW_ARTISTS = "artists:view"
    VERIFY_ARTISTS = "artists:verify"

    # Content
    MANAGE_CONTENT = "content:manage"
    MODERATE_CONTENT = "content:moderate"
    VIEW_CONTENT = "content:view"

    # Orders
    MANAGE_ORDERS = "orders:manage"
    VIEW_ORDERS = "orders:view"

    # Payments
    MANAGE_PAYMENTS = "payments:manage"
    VIEW_PAYMENTS = "payments:view"
    PROCESS_REFUNDS = "payments:refund"

    # System
    MANAGE_SYSTEM = "system:manage"
    VIEW_LOGS = "system:logs"
    EXPORT_DATA = "system:export"


# Default role permissions
ROLE_PERMISSIONS = {
    Roles.ADMIN: [
        Permissions.MANAGE_ARTISTS,
        Permissions.VIEW_ARTISTS,
        Permissions.VERIFY_ARTISTS,
        Permissions.MANAGE_CONTENT,
        Permissions.MODERATE_CONTENT,
        Permissions.VIEW_CONTENT,
        Permissions.MANAGE_ORDERS,
        Permissions.VIEW_ORDERS,
        Permissions.MANAGE_PAYMENTS,
        Permissions.VIEW_PAYMENTS,
        Permissions.PROCESS_REFUNDS,
        Permissions.MANAGE_SYSTEM,
        Permissions.VIEW_LOGS,
        Permissions.EXPORT_DATA,
    ],
    Roles.OPERATOR: [
        Permissions.VIEW_ARTISTS,
        Permissions.VIEW_CONTENT,
        Permissions.MANAGE_ORDERS,
        Permissions.VIEW_ORDERS,
        Permissions.VIEW_PAYMENTS,
        Permissions.VIEW_LOGS,
    ],
    Roles.VALIDATOR: [
        Permissions.VIEW_ARTISTS,
        Permissions.VERIFY_ARTISTS,
        Permissions.MODERATE_CONTENT,
        Permissions.VIEW_CONTENT,
    ],
    Roles.ARTIST: [
        Permissions.VIEW_CONTENT,
        Permissions.VIEW_ORDERS,
    ],
    Roles.USER: [],
}
