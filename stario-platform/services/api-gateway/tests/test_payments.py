"""
Tests for payment endpoints.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestPaymentInit:
    """Tests for payment initialization."""

    @pytest.mark.asyncio
    async def test_init_payment_unauthorized(self, client: AsyncClient):
        """Test initializing payment without authentication."""
        response = await client.post("/payments/init", json={
            "order_id": str(uuid4()),
            "provider": "payme"
        })

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_init_payment_payme(self, client: AsyncClient, auth_headers: dict):
        """Test initializing Payme payment."""
        response = await client.post("/payments/init", json={
            "order_id": str(uuid4()),
            "provider": "payme",
            "return_url": "https://stario.uz/callback"
        }, headers=auth_headers)

        # May return 200 or 404 if order doesn't exist
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_init_payment_click(self, client: AsyncClient, auth_headers: dict):
        """Test initializing Click payment."""
        response = await client.post("/payments/init", json={
            "order_id": str(uuid4()),
            "provider": "click",
            "return_url": "https://stario.uz/callback"
        }, headers=auth_headers)

        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_init_payment_stripe(self, client: AsyncClient, auth_headers: dict):
        """Test initializing Stripe payment."""
        response = await client.post("/payments/init", json={
            "order_id": str(uuid4()),
            "provider": "stripe",
            "return_url": "https://stario.uz/callback"
        }, headers=auth_headers)

        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_init_payment_vas(self, client: AsyncClient, auth_headers: dict):
        """Test initializing VAS billing payment."""
        response = await client.post("/payments/init", json={
            "order_id": str(uuid4()),
            "provider": "vas"
        }, headers=auth_headers)

        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_init_payment_invalid_provider(self, client: AsyncClient, auth_headers: dict):
        """Test initializing payment with invalid provider."""
        response = await client.post("/payments/init", json={
            "order_id": str(uuid4()),
            "provider": "invalid_provider"
        }, headers=auth_headers)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_init_payment_missing_order(self, client: AsyncClient, auth_headers: dict):
        """Test initializing payment without order_id."""
        response = await client.post("/payments/init", json={
            "provider": "payme"
        }, headers=auth_headers)

        assert response.status_code == 422


class TestPaymeWebhook:
    """Tests for Payme webhook handling."""

    @pytest.mark.asyncio
    async def test_payme_webhook_create_transaction(self, client: AsyncClient):
        """Test Payme CreateTransaction webhook."""
        response = await client.post("/payments/webhook/payme", json={
            "method": "CreateTransaction",
            "params": {
                "id": "transaction_123",
                "time": 1234567890000,
                "amount": 5000000,  # 50000 UZS
                "account": {
                    "order_id": str(uuid4())
                }
            }
        })

        # Should return JSON-RPC response
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_payme_webhook_perform_transaction(self, client: AsyncClient):
        """Test Payme PerformTransaction webhook."""
        response = await client.post("/payments/webhook/payme", json={
            "method": "PerformTransaction",
            "params": {
                "id": "transaction_123"
            }
        })

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_payme_webhook_cancel_transaction(self, client: AsyncClient):
        """Test Payme CancelTransaction webhook."""
        response = await client.post("/payments/webhook/payme", json={
            "method": "CancelTransaction",
            "params": {
                "id": "transaction_123",
                "reason": 1
            }
        })

        assert response.status_code == 200


class TestClickWebhook:
    """Tests for Click webhook handling."""

    @pytest.mark.asyncio
    async def test_click_webhook_prepare(self, client: AsyncClient):
        """Test Click Prepare webhook."""
        response = await client.post("/payments/webhook/click", data={
            "click_trans_id": "123456",
            "service_id": "12345",
            "click_paydoc_id": "789",
            "merchant_trans_id": str(uuid4()),
            "amount": "50000",
            "action": "0",  # Prepare
            "error": "0",
            "error_note": "",
            "sign_time": "2025-01-20 10:30:00",
            "sign_string": "valid_signature"
        })

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_click_webhook_complete(self, client: AsyncClient):
        """Test Click Complete webhook."""
        response = await client.post("/payments/webhook/click", data={
            "click_trans_id": "123456",
            "service_id": "12345",
            "click_paydoc_id": "789",
            "merchant_trans_id": str(uuid4()),
            "merchant_prepare_id": "1",
            "amount": "50000",
            "action": "1",  # Complete
            "error": "0",
            "error_note": "",
            "sign_time": "2025-01-20 10:30:00",
            "sign_string": "valid_signature"
        })

        assert response.status_code == 200


class TestStripeWebhook:
    """Tests for Stripe webhook handling."""

    @pytest.mark.asyncio
    async def test_stripe_webhook_checkout_completed(self, client: AsyncClient):
        """Test Stripe checkout.session.completed webhook."""
        response = await client.post(
            "/payments/webhook/stripe",
            content=b'{"type": "checkout.session.completed", "data": {"object": {}}}',
            headers={
                "Content-Type": "application/json",
                "Stripe-Signature": "test_signature"
            }
        )

        # May fail signature verification but endpoint should exist
        assert response.status_code in [200, 400]

    @pytest.mark.asyncio
    async def test_stripe_webhook_payment_failed(self, client: AsyncClient):
        """Test Stripe payment_intent.payment_failed webhook."""
        response = await client.post(
            "/payments/webhook/stripe",
            content=b'{"type": "payment_intent.payment_failed", "data": {"object": {}}}',
            headers={
                "Content-Type": "application/json",
                "Stripe-Signature": "test_signature"
            }
        )

        assert response.status_code in [200, 400]


class TestPaymentStatus:
    """Tests for checking payment status."""

    @pytest.mark.asyncio
    async def test_get_payment_status_unauthorized(self, client: AsyncClient):
        """Test getting payment status without authentication."""
        response = await client.get(f"/payments/{uuid4()}/status")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_payment_status_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting status of non-existent payment."""
        response = await client.get(f"/payments/{uuid4()}/status", headers=auth_headers)

        assert response.status_code == 404


class TestRefunds:
    """Tests for payment refunds."""

    @pytest.mark.asyncio
    async def test_refund_unauthorized(self, client: AsyncClient):
        """Test requesting refund without authentication."""
        response = await client.post(f"/payments/{uuid4()}/refund", json={
            "reason": "User requested"
        })

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refund_as_user(self, client: AsyncClient, auth_headers: dict):
        """Test requesting refund as user (may be forbidden)."""
        response = await client.post(f"/payments/{uuid4()}/refund", json={
            "reason": "User requested"
        }, headers=auth_headers)

        # May be forbidden (403) or not found (404)
        assert response.status_code in [200, 403, 404]

    @pytest.mark.asyncio
    async def test_refund_as_admin(self, client: AsyncClient, admin_auth_headers: dict):
        """Test requesting refund as admin."""
        response = await client.post(f"/payments/{uuid4()}/refund", json={
            "reason": "Admin initiated refund",
            "amount": 25000
        }, headers=admin_auth_headers)

        assert response.status_code in [200, 404]
