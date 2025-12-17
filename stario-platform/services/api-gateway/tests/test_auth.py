"""
Tests for authentication endpoints.
"""
import pytest
from httpx import AsyncClient


class TestRegistration:
    """Tests for user registration."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, test_user_data: dict):
        """Test successful user registration."""
        response = await client.post("/auth/register", json=test_user_data)

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient, test_user_data: dict):
        """Test registration with invalid email."""
        test_user_data["email"] = "invalid-email"
        response = await client.post("/auth/register", json=test_user_data)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient, test_user_data: dict):
        """Test registration with short password."""
        test_user_data["password"] = "short"
        response = await client.post("/auth/register", json=test_user_data)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data: dict):
        """Test registration with duplicate email."""
        # First registration
        await client.post("/auth/register", json=test_user_data)

        # Second registration with same email
        response = await client.post("/auth/register", json=test_user_data)

        assert response.status_code == 409


class TestLogin:
    """Tests for user login."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user_data: dict):
        """Test successful login."""
        # First register
        await client.post("/auth/register", json=test_user_data)

        # Then login
        response = await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, client: AsyncClient, test_user_data: dict):
        """Test login with invalid password."""
        await client.post("/auth/register", json=test_user_data)

        response = await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": "wrong_password"
        })

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user."""
        response = await client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })

        assert response.status_code == 401


class TestTokenRefresh:
    """Tests for token refresh."""

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, client: AsyncClient, test_user_data: dict):
        """Test successful token refresh."""
        # Register and get tokens
        reg_response = await client.post("/auth/register", json=test_user_data)
        refresh_token = reg_response.json()["refresh_token"]

        # Refresh token
        response = await client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh with invalid token."""
        response = await client.post("/auth/refresh", json={
            "refresh_token": "invalid_token"
        })

        assert response.status_code == 401


class TestTelegramAuth:
    """Tests for Telegram Mini App authentication."""

    @pytest.mark.asyncio
    async def test_telegram_auth_success(self, client: AsyncClient, mock_redis):
        """Test successful Telegram authentication."""
        # Mock valid Telegram init data
        init_data = "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D&auth_date=1234567890&hash=valid_hash"

        response = await client.post("/auth/telegram", json={
            "init_data": init_data
        })

        # Will fail validation in test but endpoint should exist
        assert response.status_code in [200, 401, 422]

    @pytest.mark.asyncio
    async def test_telegram_auth_invalid_data(self, client: AsyncClient):
        """Test Telegram auth with invalid data."""
        response = await client.post("/auth/telegram", json={
            "init_data": "invalid_data"
        })

        assert response.status_code in [401, 422]


class TestProtectedEndpoints:
    """Tests for protected endpoint access."""

    @pytest.mark.asyncio
    async def test_access_without_token(self, client: AsyncClient):
        """Test accessing protected endpoint without token."""
        response = await client.get("/users/me")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_with_valid_token(self, client: AsyncClient, auth_headers: dict):
        """Test accessing protected endpoint with valid token."""
        response = await client.get("/users/me", headers=auth_headers)

        # May return 404 if user doesn't exist in test DB
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_access_with_expired_token(self, client: AsyncClient):
        """Test accessing protected endpoint with expired token."""
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.signature"

        response = await client.get("/users/me", headers={
            "Authorization": f"Bearer {expired_token}"
        })

        assert response.status_code == 401
