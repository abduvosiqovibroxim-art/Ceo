"""Artist management endpoints - adapted to existing database schema."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from stario_common.database import get_session

router = APIRouter()


# Pydantic Schemas - frontend-compatible
class ArtistCreate(BaseModel):
    """Schema for creating artists - accepts frontend fields."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None  # Maps to bio
    image: Optional[str] = None  # Maps to avatar_url
    category: str = "pop"
    gender: str = "male"
    price: int = 50000
    followers: str = "0"
    is_verified: bool = False  # Maps to verification_status
    is_popular: bool = False  # Maps to total_orders
    status: str = "pending"  # Maps to is_active
    email: Optional[str] = None
    phone: Optional[str] = None


class ArtistUpdate(BaseModel):
    """Schema for updating artists - accepts frontend fields."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    price: Optional[int] = None
    followers: Optional[str] = None
    is_verified: Optional[bool] = None
    is_popular: Optional[bool] = None
    status: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class ArtistResponse(BaseModel):
    id: str
    name: str
    stage_name: Optional[str]
    bio: Optional[str]
    category: str
    country: Optional[str]
    avatar_url: Optional[str]
    cover_url: Optional[str]
    source_image_url: Optional[str]
    voice_model_id: Optional[str]
    verification_status: str
    is_active: bool
    total_videos: int
    total_orders: int
    rating: float
    created_at: datetime
    updated_at: datetime

    # Frontend compatibility fields
    image: Optional[str] = None
    description: Optional[str] = None
    gender: str = "male"
    price: int = 50000
    followers: str = "0"
    is_verified: bool = False
    is_popular: bool = False
    status: str = "pending"
    email: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class ArtistListResponse(BaseModel):
    items: list[ArtistResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ArtistStats(BaseModel):
    total: int
    active: int
    pending: int
    suspended: int
    verified: int
    popular: int


def row_to_artist_response(row) -> ArtistResponse:
    """Convert database row to ArtistResponse."""
    return ArtistResponse(
        id=str(row.id),
        name=row.name,
        stage_name=row.stage_name,
        bio=row.bio,
        category=row.category,
        country=row.country,
        avatar_url=row.avatar_url,
        cover_url=row.cover_url,
        source_image_url=row.source_image_url,
        voice_model_id=row.voice_model_id,
        verification_status=row.verification_status,
        is_active=row.is_active,
        total_videos=row.total_videos or 0,
        total_orders=row.total_orders or 0,
        rating=float(row.rating) if row.rating else 0.0,
        created_at=row.created_at,
        updated_at=row.updated_at,
        # Frontend compatibility
        image=row.avatar_url,
        description=row.bio,
        is_verified=row.verification_status == "approved",
        is_popular=row.total_orders > 100 if row.total_orders else False,
        status="active" if row.is_active else "pending",
    )


@router.get("/stats", response_model=ArtistStats)
async def get_artists_stats(
    session: AsyncSession = Depends(get_session),
):
    """Get artist statistics."""
    # Total count
    total_result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL")
    )
    total = total_result.scalar() or 0

    # Active count
    active_result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL AND is_active = true")
    )
    active = active_result.scalar() or 0

    # Pending count
    pending_result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL AND verification_status = 'pending'")
    )
    pending = pending_result.scalar() or 0

    # Suspended count (inactive)
    suspended_result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL AND is_active = false AND verification_status != 'pending'")
    )
    suspended = suspended_result.scalar() or 0

    # Verified count
    verified_result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL AND verification_status = 'approved'")
    )
    verified = verified_result.scalar() or 0

    # Popular count (total_orders > 100)
    popular_result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL AND total_orders > 100")
    )
    popular = popular_result.scalar() or 0

    return ArtistStats(
        total=total,
        active=active,
        pending=pending,
        suspended=suspended,
        verified=verified,
        popular=popular,
    )


@router.get("", response_model=ArtistListResponse)
async def list_artists(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (active/pending/suspended)"),
    search: Optional[str] = Query(None, description="Search by name"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_session),
):
    """List all artists with filtering and pagination."""
    # Build query
    where_clauses = ["deleted_at IS NULL"]
    params = {}

    if category:
        where_clauses.append("category = :category")
        params["category"] = category

    if status:
        if status == "active":
            where_clauses.append("is_active = true")
        elif status == "pending":
            where_clauses.append("verification_status = 'pending'")
        elif status == "suspended":
            where_clauses.append("is_active = false AND verification_status != 'pending'")

    if is_verified is not None:
        if is_verified:
            where_clauses.append("verification_status = 'approved'")
        else:
            where_clauses.append("verification_status != 'approved'")

    if search:
        where_clauses.append("(name ILIKE :search OR bio ILIKE :search OR stage_name ILIKE :search)")
        params["search"] = f"%{search}%"

    where_sql = " AND ".join(where_clauses)

    # Count total
    count_query = text(f"SELECT COUNT(*) FROM artists WHERE {where_sql}")
    total_result = await session.execute(count_query, params)
    total = total_result.scalar() or 0

    # Get paginated results
    offset = (page - 1) * page_size
    query = text(f"""
        SELECT * FROM artists
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    params["limit"] = page_size
    params["offset"] = offset

    result = await session.execute(query, params)
    rows = result.fetchall()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ArtistListResponse(
        items=[row_to_artist_response(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{artist_id}", response_model=ArtistResponse)
async def get_artist(
    artist_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get artist by ID."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artist ID format"
        )

    result = await session.execute(
        text("SELECT * FROM artists WHERE id = :id AND deleted_at IS NULL"),
        {"id": str(uuid_id)}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    return row_to_artist_response(row)


@router.post("", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def create_artist(
    request: ArtistCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new artist."""
    # Map frontend fields to database fields
    verification_status = "approved" if request.is_verified else "pending"
    is_active = request.status == "active"
    total_orders = 101 if request.is_popular else 0

    result = await session.execute(
        text("""
            INSERT INTO artists (name, bio, category, avatar_url, verification_status, is_active, total_orders)
            VALUES (:name, :bio, :category, :avatar_url, :verification_status, :is_active, :total_orders)
            RETURNING *
        """),
        {
            "name": request.name,
            "bio": request.description,
            "category": request.category,
            "avatar_url": request.image,
            "verification_status": verification_status,
            "is_active": is_active,
            "total_orders": total_orders,
        }
    )
    row = result.fetchone()
    await session.commit()

    return row_to_artist_response(row)


@router.put("/{artist_id}", response_model=ArtistResponse)
async def update_artist(
    artist_id: str,
    request: ArtistUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update an existing artist."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artist ID format"
        )

    # Check if artist exists
    check_result = await session.execute(
        text("SELECT id FROM artists WHERE id = :id AND deleted_at IS NULL"),
        {"id": str(uuid_id)}
    )
    if not check_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    # Map frontend fields to database fields
    update_fields = []
    params = {"id": str(uuid_id)}
    update_data = request.model_dump(exclude_unset=True)

    # Field mapping from frontend to database
    field_mapping = {
        "name": "name",
        "description": "bio",
        "image": "avatar_url",
        "category": "category",
    }

    for frontend_field, db_field in field_mapping.items():
        if frontend_field in update_data and update_data[frontend_field] is not None:
            update_fields.append(f"{db_field} = :{db_field}")
            params[db_field] = update_data[frontend_field]

    # Handle status -> is_active mapping
    if "status" in update_data and update_data["status"] is not None:
        update_fields.append("is_active = :is_active")
        params["is_active"] = update_data["status"] == "active"

    # Handle is_verified -> verification_status mapping
    if "is_verified" in update_data and update_data["is_verified"] is not None:
        update_fields.append("verification_status = :verification_status")
        params["verification_status"] = "approved" if update_data["is_verified"] else "pending"

    # Handle is_popular -> total_orders mapping
    if "is_popular" in update_data and update_data["is_popular"] is not None:
        update_fields.append("total_orders = :total_orders")
        params["total_orders"] = 101 if update_data["is_popular"] else 0

    if not update_fields:
        # No updates, just return current
        result = await session.execute(
            text("SELECT * FROM artists WHERE id = :id"),
            {"id": str(uuid_id)}
        )
        return row_to_artist_response(result.fetchone())

    update_fields.append("updated_at = NOW()")
    update_sql = ", ".join(update_fields)

    result = await session.execute(
        text(f"UPDATE artists SET {update_sql} WHERE id = :id RETURNING *"),
        params
    )
    row = result.fetchone()
    await session.commit()

    return row_to_artist_response(row)


@router.delete("/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artist(
    artist_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete an artist (soft delete)."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artist ID format"
        )

    result = await session.execute(
        text("UPDATE artists SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL RETURNING id"),
        {"id": str(uuid_id)}
    )
    row = result.fetchone()
    await session.commit()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    return None


@router.patch("/{artist_id}/verify", response_model=ArtistResponse)
async def toggle_verification(
    artist_id: str,
    is_verified: bool = Query(...),
    session: AsyncSession = Depends(get_session),
):
    """Toggle artist verification status."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artist ID format"
        )

    verification_status = "approved" if is_verified else "pending"

    result = await session.execute(
        text("""
            UPDATE artists
            SET verification_status = :status, updated_at = NOW()
            WHERE id = :id AND deleted_at IS NULL
            RETURNING *
        """),
        {"id": str(uuid_id), "status": verification_status}
    )
    row = result.fetchone()
    await session.commit()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    return row_to_artist_response(row)


@router.patch("/{artist_id}/popular", response_model=ArtistResponse)
async def toggle_popular(
    artist_id: str,
    is_popular: bool = Query(...),
    session: AsyncSession = Depends(get_session),
):
    """Toggle artist popular status (sets total_orders > 100)."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artist ID format"
        )

    # Set total_orders to make popular or not
    total_orders = 101 if is_popular else 0

    result = await session.execute(
        text("""
            UPDATE artists
            SET total_orders = :total_orders, updated_at = NOW()
            WHERE id = :id AND deleted_at IS NULL
            RETURNING *
        """),
        {"id": str(uuid_id), "total_orders": total_orders}
    )
    row = result.fetchone()
    await session.commit()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    return row_to_artist_response(row)


@router.patch("/{artist_id}/status", response_model=ArtistResponse)
async def update_status(
    artist_id: str,
    new_status: str = Query(...),
    session: AsyncSession = Depends(get_session),
):
    """Update artist status (active/pending/suspended)."""
    try:
        uuid_id = UUID(artist_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid artist ID format"
        )

    if new_status == "active":
        is_active = True
        verification_status = None  # Keep current
    elif new_status == "pending":
        is_active = False
        verification_status = "pending"
    elif new_status == "suspended":
        is_active = False
        verification_status = None  # Keep current
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be: active, pending, or suspended"
        )

    if verification_status:
        result = await session.execute(
            text("""
                UPDATE artists
                SET is_active = :is_active, verification_status = :verification_status, updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL
                RETURNING *
            """),
            {"id": str(uuid_id), "is_active": is_active, "verification_status": verification_status}
        )
    else:
        result = await session.execute(
            text("""
                UPDATE artists
                SET is_active = :is_active, updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL
                RETURNING *
            """),
            {"id": str(uuid_id), "is_active": is_active}
        )

    row = result.fetchone()
    await session.commit()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

    return row_to_artist_response(row)


@router.post("/seed", response_model=dict)
async def seed_artists(
    session: AsyncSession = Depends(get_session),
):
    """Seed initial artists data (for development)."""
    # Check if artists already exist
    result = await session.execute(
        text("SELECT COUNT(*) FROM artists WHERE deleted_at IS NULL")
    )
    count = result.scalar() or 0

    if count > 0:
        return {"message": f"Database already has {count} artists", "created": 0}

    # Sample artists data
    artists_data = [
        {"name": "Шахзода", "category": "pop", "bio": "Популярная узбекская певица", "is_active": True, "verification_status": "approved"},
        {"name": "Юлдуз Усмонова", "category": "pop", "bio": "Суперзвезда Узбекистана", "is_active": True, "verification_status": "approved", "total_orders": 150},
        {"name": "Шохруххон", "category": "pop", "bio": "Король узбекской эстрады", "is_active": True, "verification_status": "approved"},
        {"name": "Озода Нурсаидова", "category": "pop", "bio": "Красивый голос Узбекистана", "is_active": True, "verification_status": "approved"},
        {"name": "Севара Назархан", "category": "traditional", "bio": "Мировая звезда world music", "is_active": True, "verification_status": "approved"},
        {"name": "Райхон", "category": "pop", "bio": "Популярная узбекская поп-дива", "is_active": True, "verification_status": "approved"},
        {"name": "Лола Юлдашева", "category": "pop", "bio": "Звезда узбекского шоу-бизнеса", "is_active": True, "verification_status": "approved"},
    ]

    # Generate avatar URLs
    colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722']

    created_count = 0
    for i, data in enumerate(artists_data):
        initials = ''.join([n[0] for n in data['name'].split()[:2]])
        color = colors[i % len(colors)]
        avatar_url = f"https://ui-avatars.com/api/?name={initials}&size=200&background={color}&color=fff&bold=true&font-size=0.4"

        await session.execute(
            text("""
                INSERT INTO artists (name, category, bio, avatar_url, is_active, verification_status, total_orders)
                VALUES (:name, :category, :bio, :avatar_url, :is_active, :verification_status, :total_orders)
            """),
            {
                "name": data['name'],
                "category": data['category'],
                "bio": data['bio'],
                "avatar_url": avatar_url,
                "is_active": data.get('is_active', False),
                "verification_status": data.get('verification_status', 'pending'),
                "total_orders": data.get('total_orders', 0),
            }
        )
        created_count += 1

    await session.commit()

    return {"message": f"Successfully seeded {created_count} artists", "created": created_count}
