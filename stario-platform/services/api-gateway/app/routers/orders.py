"""Order management endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user, require_role, Roles
from stario_common.models import OrderStatus

router = APIRouter()


class OrderItem(BaseModel):
    id: str
    product_type: str  # video, poster, voice, merch
    product_id: str
    artist_id: str
    quantity: int = 1
    unit_price_uzs: int
    customization: Optional[dict] = None


class Order(BaseModel):
    id: str
    user_id: str
    items: list[OrderItem]
    status: str
    subtotal_uzs: int
    discount_uzs: int = 0
    shipping_uzs: int = 0
    total_uzs: int
    payment_provider: Optional[str]
    payment_id: Optional[str]
    shipping_address: Optional[dict]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]


class CreateOrderRequest(BaseModel):
    items: list[dict]  # [{"product_type": "video", "product_id": "...", ...}]
    promo_code: Optional[str] = None


class OrderSummary(BaseModel):
    total_orders: int
    total_revenue_uzs: int
    pending_orders: int
    completed_orders: int


@router.post("", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    request: CreateOrderRequest,
    user: User = Depends(get_current_user),
):
    """Create a new order."""
    import uuid

    order_id = str(uuid.uuid4())

    # Calculate totals
    subtotal = sum(item.get("unit_price_uzs", 0) * item.get("quantity", 1) for item in request.items)
    discount = 0
    shipping = 0

    # Apply promo code if provided
    if request.promo_code:
        # Validate and apply promo code
        pass

    return Order(
        id=order_id,
        user_id=user.id,
        items=[
            OrderItem(
                id=str(uuid.uuid4()),
                product_type=item.get("product_type"),
                product_id=item.get("product_id"),
                artist_id=item.get("artist_id", ""),
                quantity=item.get("quantity", 1),
                unit_price_uzs=item.get("unit_price_uzs", 0),
                customization=item.get("customization"),
            )
            for item in request.items
        ],
        status=OrderStatus.CREATED,
        subtotal_uzs=subtotal,
        discount_uzs=discount,
        shipping_uzs=shipping,
        total_uzs=subtotal - discount + shipping,
        payment_provider=None,
        payment_id=None,
        shipping_address=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        completed_at=None,
    )


@router.get("", response_model=list[Order])
async def list_orders(
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
):
    """List user's orders."""
    return []


@router.get("/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
):
    """Get order details."""
    # Mock order
    return Order(
        id=order_id,
        user_id=user.id,
        items=[],
        status=OrderStatus.PENDING_PAYMENT,
        subtotal_uzs=100000,
        discount_uzs=0,
        shipping_uzs=0,
        total_uzs=100000,
        payment_provider=None,
        payment_id=None,
        shipping_address=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        completed_at=None,
    )


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    reason: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    """Cancel an order."""
    return {
        "order_id": order_id,
        "status": OrderStatus.CANCELLED,
        "cancelled_at": datetime.utcnow().isoformat(),
        "reason": reason,
    }


@router.post("/{order_id}/shipping")
async def update_shipping(
    order_id: str,
    shipping_address: dict,
    user: User = Depends(get_current_user),
):
    """Update order shipping address."""
    return {
        "order_id": order_id,
        "shipping_address": shipping_address,
        "updated_at": datetime.utcnow().isoformat(),
    }


# Admin endpoints
@router.get("/admin/all", response_model=list[Order])
async def list_all_orders(
    status_filter: Optional[str] = None,
    user_id: Optional[str] = None,
    artist_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
    admin: User = Depends(require_role([Roles.ADMIN, Roles.OPERATOR])),
):
    """List all orders (admin)."""
    return []


@router.get("/admin/summary", response_model=OrderSummary)
async def get_orders_summary(
    period: str = "today",  # today, week, month, year
    admin: User = Depends(require_role([Roles.ADMIN, Roles.OPERATOR])),
):
    """Get orders summary."""
    return OrderSummary(
        total_orders=1500,
        total_revenue_uzs=150000000,
        pending_orders=25,
        completed_orders=1400,
    )


@router.patch("/admin/{order_id}/status")
async def update_order_status(
    order_id: str,
    new_status: str,
    notes: Optional[str] = None,
    admin: User = Depends(require_role([Roles.ADMIN, Roles.OPERATOR])),
):
    """Update order status (admin)."""
    return {
        "order_id": order_id,
        "status": new_status,
        "updated_by": admin.id,
        "updated_at": datetime.utcnow().isoformat(),
        "notes": notes,
    }


@router.post("/admin/{order_id}/refund")
async def process_refund(
    order_id: str,
    amount_uzs: Optional[int] = None,  # Partial refund if specified
    reason: str = "",
    admin: User = Depends(require_role([Roles.ADMIN])),
):
    """Process order refund (admin)."""
    return {
        "order_id": order_id,
        "refund_id": "ref_" + order_id[:8],
        "amount_uzs": amount_uzs or 100000,
        "status": "processing",
        "reason": reason,
        "processed_by": admin.id,
        "processed_at": datetime.utcnow().isoformat(),
    }
