"""Payment processing endpoints - Stripe, Payme, Click, VAS."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user, require_role, Roles
from stario_common.config import get_settings
from stario_common.logging import get_logger
from stario_common.models import PaymentStatus

router = APIRouter()
logger = get_logger(__name__)


class PaymentInitRequest(BaseModel):
    order_id: str
    provider: str  # stripe, payme, click, vas
    return_url: Optional[str] = None


class PaymentInitResponse(BaseModel):
    payment_id: str
    provider: str
    checkout_url: Optional[str]  # For redirect-based providers
    client_secret: Optional[str]  # For Stripe Elements
    status: str


class PaymentStatus(BaseModel):
    payment_id: str
    order_id: str
    provider: str
    amount_uzs: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]


class RefundRequest(BaseModel):
    payment_id: str
    amount_uzs: Optional[int] = None  # Partial refund
    reason: str


class RefundResponse(BaseModel):
    refund_id: str
    payment_id: str
    amount_uzs: int
    status: str
    created_at: datetime


class PaymeWebhookPayload(BaseModel):
    method: str
    params: dict


class ClickWebhookPayload(BaseModel):
    click_trans_id: str
    service_id: int
    merchant_trans_id: str
    amount: float
    action: int
    error: int
    error_note: str
    sign_time: str
    sign_string: str


# Payment initialization
@router.post("/init", response_model=PaymentInitResponse)
async def init_payment(
    request: PaymentInitRequest,
    user: User = Depends(get_current_user),
):
    """Initialize payment for an order."""
    import uuid

    settings = get_settings()
    payment_id = str(uuid.uuid4())

    if request.provider == "stripe":
        # Initialize Stripe payment
        checkout_url = f"https://checkout.stripe.com/pay/{payment_id}"
        client_secret = f"pi_{payment_id}_secret"
        return PaymentInitResponse(
            payment_id=payment_id,
            provider="stripe",
            checkout_url=checkout_url,
            client_secret=client_secret,
            status="pending",
        )

    elif request.provider == "payme":
        # Initialize Payme payment
        checkout_url = f"https://checkout.paycom.uz/{payment_id}"
        return PaymentInitResponse(
            payment_id=payment_id,
            provider="payme",
            checkout_url=checkout_url,
            client_secret=None,
            status="pending",
        )

    elif request.provider == "click":
        # Initialize Click payment
        checkout_url = f"https://my.click.uz/services/pay?service_id=xxx&merchant_id=xxx&amount=100000&transaction_param={payment_id}"
        return PaymentInitResponse(
            payment_id=payment_id,
            provider="click",
            checkout_url=checkout_url,
            client_secret=None,
            status="pending",
        )

    elif request.provider == "vas":
        # Initialize VAS (mobile operator) billing
        return PaymentInitResponse(
            payment_id=payment_id,
            provider="vas",
            checkout_url=None,
            client_secret=None,
            status="pending",
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported payment provider: {request.provider}",
        )


@router.get("/{payment_id}", response_model=PaymentStatus)
async def get_payment_status(
    payment_id: str,
    user: User = Depends(get_current_user),
):
    """Get payment status."""
    return PaymentStatus(
        payment_id=payment_id,
        order_id="ord_001",
        provider="payme",
        amount_uzs=100000,
        status="completed",
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        error_message=None,
    )


# Webhook handlers
@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
):
    """Handle Stripe webhooks."""
    settings = get_settings()
    body = await request.body()

    # Verify webhook signature (in production)
    # stripe.Webhook.construct_event(body, stripe_signature, settings.stripe_webhook_secret)

    payload = await request.json()
    event_type = payload.get("type")

    logger.info("stripe_webhook_received", event_type=event_type)

    if event_type == "payment_intent.succeeded":
        # Handle successful payment
        payment_intent = payload["data"]["object"]
        payment_id = payment_intent["id"]
        logger.info("stripe_payment_succeeded", payment_id=payment_id)

    elif event_type == "payment_intent.payment_failed":
        # Handle failed payment
        payment_intent = payload["data"]["object"]
        payment_id = payment_intent["id"]
        error = payment_intent.get("last_payment_error", {}).get("message")
        logger.error("stripe_payment_failed", payment_id=payment_id, error=error)

    return {"received": True}


@router.post("/webhooks/payme")
async def payme_webhook(payload: PaymeWebhookPayload):
    """
    Handle Payme webhooks.

    Payme uses JSON-RPC style requests.
    """
    logger.info("payme_webhook_received", method=payload.method)

    method = payload.method
    params = payload.params

    if method == "CheckPerformTransaction":
        # Verify transaction can be performed
        return {
            "result": {
                "allow": True,
            }
        }

    elif method == "CreateTransaction":
        # Create pending transaction
        return {
            "result": {
                "create_time": int(datetime.utcnow().timestamp() * 1000),
                "transaction": params.get("id"),
                "state": 1,
            }
        }

    elif method == "PerformTransaction":
        # Complete transaction
        return {
            "result": {
                "transaction": params.get("id"),
                "perform_time": int(datetime.utcnow().timestamp() * 1000),
                "state": 2,
            }
        }

    elif method == "CancelTransaction":
        # Cancel transaction
        return {
            "result": {
                "transaction": params.get("id"),
                "cancel_time": int(datetime.utcnow().timestamp() * 1000),
                "state": -1,
            }
        }

    elif method == "CheckTransaction":
        # Check transaction status
        return {
            "result": {
                "create_time": int(datetime.utcnow().timestamp() * 1000),
                "perform_time": int(datetime.utcnow().timestamp() * 1000),
                "cancel_time": 0,
                "transaction": params.get("id"),
                "state": 2,
                "reason": None,
            }
        }

    return {"error": {"code": -32601, "message": "Method not found"}}


@router.post("/webhooks/click")
async def click_webhook(payload: ClickWebhookPayload):
    """Handle Click webhooks."""
    logger.info(
        "click_webhook_received",
        action=payload.action,
        trans_id=payload.click_trans_id,
    )

    # Verify signature (in production)
    # sign_string should be: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)

    if payload.action == 0:
        # Prepare - check if order exists and can be paid
        return {
            "click_trans_id": payload.click_trans_id,
            "merchant_trans_id": payload.merchant_trans_id,
            "merchant_prepare_id": 1,
            "error": 0,
            "error_note": "Success",
        }

    elif payload.action == 1:
        # Complete - finalize payment
        return {
            "click_trans_id": payload.click_trans_id,
            "merchant_trans_id": payload.merchant_trans_id,
            "merchant_confirm_id": 1,
            "error": 0,
            "error_note": "Success",
        }

    return {"error": -1, "error_note": "Unknown action"}


# Refunds
@router.post("/refund", response_model=RefundResponse)
async def create_refund(
    request: RefundRequest,
    admin: User = Depends(require_role([Roles.ADMIN])),
):
    """Process refund for a payment."""
    import uuid

    logger.info(
        "refund_initiated",
        payment_id=request.payment_id,
        amount_uzs=request.amount_uzs,
        reason=request.reason,
        initiated_by=admin.id,
    )

    return RefundResponse(
        refund_id=str(uuid.uuid4()),
        payment_id=request.payment_id,
        amount_uzs=request.amount_uzs or 100000,
        status="processing",
        created_at=datetime.utcnow(),
    )


# Admin endpoints
@router.get("/admin/transactions")
async def list_transactions(
    provider: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
    admin: User = Depends(require_role([Roles.ADMIN, Roles.OPERATOR])),
):
    """List all transactions (admin)."""
    return {
        "items": [],
        "total": 0,
        "page": page,
        "page_size": page_size,
    }


@router.get("/admin/revenue")
async def get_revenue_dashboard(
    period: str = "month",  # day, week, month, year
    group_by: str = "day",  # day, week, month
    admin: User = Depends(require_role([Roles.ADMIN])),
):
    """Get revenue dashboard data."""
    return {
        "period": period,
        "total_revenue_uzs": 150000000,
        "total_orders": 1500,
        "average_order_uzs": 100000,
        "by_provider": {
            "payme": 80000000,
            "click": 50000000,
            "stripe": 15000000,
            "vas": 5000000,
        },
        "by_product_type": {
            "video": 100000000,
            "merch": 30000000,
            "poster": 15000000,
            "voice": 5000000,
        },
        "by_artist": [
            {"artist_id": "art_001", "name": "Шахзода", "revenue_uzs": 75000000},
            {"artist_id": "art_002", "name": "Лола Юлдашева", "revenue_uzs": 45000000},
        ],
        "time_series": [],
    }


@router.get("/admin/reconciliation")
async def get_reconciliation_report(
    provider: str,
    date_from: datetime,
    date_to: datetime,
    admin: User = Depends(require_role([Roles.ADMIN])),
):
    """Get payment reconciliation report."""
    return {
        "provider": provider,
        "period": {
            "from": date_from.isoformat(),
            "to": date_to.isoformat(),
        },
        "our_records": {
            "total_transactions": 500,
            "total_amount_uzs": 50000000,
        },
        "provider_records": {
            "total_transactions": 500,
            "total_amount_uzs": 50000000,
        },
        "discrepancies": [],
        "status": "matched",
    }
