"""Merchandise (MerchVerse) endpoints."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user, require_role, Roles

router = APIRouter()


class ProductCategory(BaseModel):
    id: str
    name: str
    description: str
    icon_url: str


class Product(BaseModel):
    id: str
    name: str
    description: str
    category_id: str
    artist_id: Optional[str]
    base_price_uzs: int
    images: list[str]
    customization_options: list[dict]
    is_available: bool = True
    is_premium: bool = False


class ProductCustomization(BaseModel):
    product_id: str
    color: Optional[str] = None
    size: Optional[str] = None
    text: Optional[str] = None
    image_url: Optional[str] = None  # Custom design/poster
    ai_design_prompt: Optional[str] = None  # Generate design with AI


class CustomizationPreview(BaseModel):
    preview_id: str
    preview_url: str
    product_id: str
    customization: ProductCustomization
    estimated_price_uzs: int


class CartItem(BaseModel):
    product_id: str
    customization: ProductCustomization
    quantity: int = 1


class Cart(BaseModel):
    items: list[CartItem]
    subtotal_uzs: int
    shipping_uzs: int
    total_uzs: int
    artist_share_uzs: int  # 50/50 split


class MerchOrder(BaseModel):
    id: str
    user_id: str
    items: list[dict]
    status: str
    subtotal_uzs: int
    shipping_uzs: int
    total_uzs: int
    shipping_address: dict
    tracking_number: Optional[str]
    created_at: datetime
    estimated_delivery: Optional[datetime]


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    city: str
    district: str
    street: str
    building: str
    apartment: Optional[str]
    postal_code: Optional[str]
    instructions: Optional[str]


class STLGenerationRequest(BaseModel):
    product_id: str
    design_prompt: str
    artist_id: Optional[str]


class STLGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_duration_seconds: int


@router.get("/categories", response_model=list[ProductCategory])
async def list_categories():
    """List merchandise categories."""
    return [
        ProductCategory(
            id="cat_001",
            name="T-Shirts",
            description="Custom printed t-shirts",
            icon_url="https://storage.stario.uz/icons/tshirt.svg",
        ),
        ProductCategory(
            id="cat_002",
            name="Posters & Prints",
            description="High-quality art prints",
            icon_url="https://storage.stario.uz/icons/poster.svg",
        ),
        ProductCategory(
            id="cat_003",
            name="Phone Cases",
            description="Personalized phone cases",
            icon_url="https://storage.stario.uz/icons/phone.svg",
        ),
        ProductCategory(
            id="cat_004",
            name="Mugs",
            description="Custom printed mugs",
            icon_url="https://storage.stario.uz/icons/mug.svg",
        ),
        ProductCategory(
            id="cat_005",
            name="3D Figurines",
            description="AI-generated 3D collectibles",
            icon_url="https://storage.stario.uz/icons/figurine.svg",
        ),
    ]


@router.get("/products", response_model=list[Product])
async def list_products(
    category_id: Optional[str] = None,
    artist_id: Optional[str] = None,
    is_premium: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
):
    """List available products."""
    return [
        Product(
            id="prod_001",
            name="Artist T-Shirt",
            description="Premium cotton t-shirt with artist design",
            category_id="cat_001",
            artist_id="art_001",
            base_price_uzs=150000,
            images=[
                "https://storage.stario.uz/products/tshirt_001_front.jpg",
                "https://storage.stario.uz/products/tshirt_001_back.jpg",
            ],
            customization_options=[
                {"type": "size", "options": ["S", "M", "L", "XL", "XXL"]},
                {"type": "color", "options": ["black", "white", "navy"]},
            ],
            is_available=True,
            is_premium=False,
        ),
        Product(
            id="prod_002",
            name="Limited Edition Figurine",
            description="AI-generated 3D printed collectible",
            category_id="cat_005",
            artist_id="art_001",
            base_price_uzs=500000,
            images=[
                "https://storage.stario.uz/products/figurine_001.jpg",
            ],
            customization_options=[],
            is_available=True,
            is_premium=True,
        ),
    ]


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get product details."""
    return Product(
        id=product_id,
        name="Artist T-Shirt",
        description="Premium cotton t-shirt with artist design",
        category_id="cat_001",
        artist_id="art_001",
        base_price_uzs=150000,
        images=[
            "https://storage.stario.uz/products/tshirt_001_front.jpg",
        ],
        customization_options=[
            {"type": "size", "options": ["S", "M", "L", "XL", "XXL"]},
            {"type": "color", "options": ["black", "white", "navy"]},
        ],
        is_available=True,
        is_premium=False,
    )


@router.post("/preview", response_model=CustomizationPreview)
async def generate_preview(
    customization: ProductCustomization,
    user: User = Depends(get_current_user),
):
    """Generate preview of customized product."""
    import uuid

    return CustomizationPreview(
        preview_id=str(uuid.uuid4()),
        preview_url="https://storage.stario.uz/previews/preview_001.jpg",
        product_id=customization.product_id,
        customization=customization,
        estimated_price_uzs=165000,
    )


@router.post("/stl/generate", response_model=STLGenerationResponse)
async def generate_stl(
    request: STLGenerationRequest,
    user: User = Depends(get_current_user),
):
    """
    Generate 3D STL file for figurines.

    Uses AI to create 3D model placeholders for print-on-demand.
    """
    import uuid

    job_id = str(uuid.uuid4())

    return STLGenerationResponse(
        job_id=job_id,
        status="queued",
        estimated_duration_seconds=120,
    )


@router.get("/cart", response_model=Cart)
async def get_cart(user: User = Depends(get_current_user)):
    """Get user's shopping cart."""
    return Cart(
        items=[],
        subtotal_uzs=0,
        shipping_uzs=0,
        total_uzs=0,
        artist_share_uzs=0,
    )


@router.post("/cart/add")
async def add_to_cart(
    item: CartItem,
    user: User = Depends(get_current_user),
):
    """Add item to cart."""
    return {"message": "Item added to cart", "cart_count": 1}


@router.delete("/cart/{item_id}")
async def remove_from_cart(
    item_id: str,
    user: User = Depends(get_current_user),
):
    """Remove item from cart."""
    return {"message": "Item removed from cart", "cart_count": 0}


@router.post("/checkout")
async def checkout(
    shipping_address: ShippingAddress,
    user: User = Depends(get_current_user),
):
    """
    Checkout cart and create order.

    Returns payment options and order ID.
    """
    import uuid

    order_id = str(uuid.uuid4())

    return {
        "order_id": order_id,
        "total_uzs": 165000,
        "payment_options": [
            {"provider": "payme", "enabled": True},
            {"provider": "click", "enabled": True},
            {"provider": "stripe", "enabled": True},
        ],
        "redirect_url": f"https://app.stario.uz/checkout/{order_id}",
    }


@router.get("/orders", response_model=list[MerchOrder])
async def list_orders(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
):
    """List user's merchandise orders."""
    return []


@router.get("/orders/{order_id}", response_model=MerchOrder)
async def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
):
    """Get order details."""
    return MerchOrder(
        id=order_id,
        user_id=user.id,
        items=[],
        status="processing",
        subtotal_uzs=150000,
        shipping_uzs=15000,
        total_uzs=165000,
        shipping_address={},
        tracking_number=None,
        created_at=datetime.utcnow(),
        estimated_delivery=None,
    )


# Admin endpoints
@router.get("/admin/pricing")
async def get_pricing_config(
    admin: User = Depends(require_role([Roles.ADMIN])),
):
    """Get pricing configuration."""
    return {
        "artist_share_percent": 50,
        "platform_share_percent": 50,
        "production_costs": {
            "tshirt": 50000,
            "mug": 30000,
            "poster_a4": 15000,
            "figurine": 200000,
        },
        "shipping_zones": {
            "tashkent": 15000,
            "regional": 25000,
            "international": 100000,
        },
    }


@router.put("/admin/pricing")
async def update_pricing_config(
    pricing: dict,
    admin: User = Depends(require_role([Roles.ADMIN])),
):
    """Update pricing configuration."""
    return {"message": "Pricing updated", "pricing": pricing}
