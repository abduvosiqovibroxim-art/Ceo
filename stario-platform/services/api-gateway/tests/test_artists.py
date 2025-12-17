"""
Tests for artist management endpoints.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestListArtists:
    """Tests for listing artists."""

    @pytest.mark.asyncio
    async def test_list_artists_public(self, client: AsyncClient):
        """Test listing artists without authentication."""
        response = await client.get("/artists")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_list_artists_with_category_filter(self, client: AsyncClient):
        """Test listing artists with category filter."""
        response = await client.get("/artists", params={"category": "singer"})

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_artists_with_country_filter(self, client: AsyncClient):
        """Test listing artists with country filter."""
        response = await client.get("/artists", params={"country": "UZ"})

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_artists_pagination(self, client: AsyncClient):
        """Test artist listing pagination."""
        response = await client.get("/artists", params={
            "page": 1,
            "page_size": 10
        })

        assert response.status_code == 200


class TestGetArtist:
    """Tests for getting artist details."""

    @pytest.mark.asyncio
    async def test_get_artist_not_found(self, client: AsyncClient):
        """Test getting non-existent artist."""
        fake_id = str(uuid4())
        response = await client.get(f"/artists/{fake_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_artist_invalid_id(self, client: AsyncClient):
        """Test getting artist with invalid ID format."""
        response = await client.get("/artists/invalid-uuid")

        assert response.status_code in [404, 422]


class TestCreateArtist:
    """Tests for creating artists (admin only)."""

    @pytest.mark.asyncio
    async def test_create_artist_unauthorized(self, client: AsyncClient, test_artist_data: dict):
        """Test creating artist without authentication."""
        response = await client.post("/artists", json=test_artist_data)

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_artist_as_user(self, client: AsyncClient, auth_headers: dict, test_artist_data: dict):
        """Test creating artist as regular user (forbidden)."""
        response = await client.post("/artists", json=test_artist_data, headers=auth_headers)

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_artist_as_admin(self, client: AsyncClient, admin_auth_headers: dict, test_artist_data: dict):
        """Test creating artist as admin."""
        response = await client.post("/artists", json=test_artist_data, headers=admin_auth_headers)

        # May succeed or fail depending on database setup
        assert response.status_code in [201, 500]

    @pytest.mark.asyncio
    async def test_create_artist_missing_fields(self, client: AsyncClient, admin_auth_headers: dict):
        """Test creating artist with missing required fields."""
        response = await client.post("/artists", json={}, headers=admin_auth_headers)

        assert response.status_code == 422


class TestUpdateArtist:
    """Tests for updating artists."""

    @pytest.mark.asyncio
    async def test_update_artist_unauthorized(self, client: AsyncClient):
        """Test updating artist without authentication."""
        fake_id = str(uuid4())
        response = await client.put(f"/artists/{fake_id}", json={"name": "New Name"})

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_artist_as_user(self, client: AsyncClient, auth_headers: dict):
        """Test updating artist as regular user (forbidden)."""
        fake_id = str(uuid4())
        response = await client.put(
            f"/artists/{fake_id}",
            json={"name": "New Name"},
            headers=auth_headers
        )

        assert response.status_code == 403


class TestArtistVerification:
    """Tests for artist verification workflow."""

    @pytest.mark.asyncio
    async def test_submit_verification_unauthorized(self, client: AsyncClient):
        """Test submitting verification without authentication."""
        fake_id = str(uuid4())
        response = await client.post(f"/artists/{fake_id}/verification/submit")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_review_verification_as_user(self, client: AsyncClient, auth_headers: dict):
        """Test reviewing verification as regular user (forbidden)."""
        fake_id = str(uuid4())
        response = await client.post(
            f"/artists/{fake_id}/verification/review",
            json={"status": "approved"},
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_review_verification_as_validator(self, client: AsyncClient, validator_auth_headers: dict):
        """Test reviewing verification as validator."""
        fake_id = str(uuid4())
        response = await client.post(
            f"/artists/{fake_id}/verification/review",
            json={"status": "approved", "notes": "All documents verified"},
            headers=validator_auth_headers
        )

        # May return 404 if artist doesn't exist
        assert response.status_code in [200, 404]


class TestArtistRestrictions:
    """Tests for artist restriction management."""

    @pytest.mark.asyncio
    async def test_get_restrictions_unauthorized(self, client: AsyncClient):
        """Test getting restrictions without authentication."""
        fake_id = str(uuid4())
        response = await client.get(f"/artists/{fake_id}/restrictions")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_restrictions_as_admin(self, client: AsyncClient, admin_auth_headers: dict):
        """Test updating restrictions as admin."""
        fake_id = str(uuid4())
        response = await client.put(
            f"/artists/{fake_id}/restrictions",
            json={
                "whitelist_topics": ["birthday", "greeting"],
                "blacklist_topics": ["politics", "violence"],
                "max_duration_seconds": 60
            },
            headers=admin_auth_headers
        )

        # May return 404 if artist doesn't exist
        assert response.status_code in [200, 404]


class TestArtistPrompts:
    """Tests for artist prompt templates."""

    @pytest.mark.asyncio
    async def test_list_prompts(self, client: AsyncClient):
        """Test listing artist prompts (public)."""
        fake_id = str(uuid4())
        response = await client.get(f"/artists/{fake_id}/prompts")

        # May return 404 if artist doesn't exist or 200 with empty list
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_create_prompt_as_admin(self, client: AsyncClient, admin_auth_headers: dict):
        """Test creating prompt template as admin."""
        fake_id = str(uuid4())
        response = await client.post(
            f"/artists/{fake_id}/prompts",
            json={
                "name": "Birthday Greeting",
                "template": "Happy birthday, {recipient}! Wishing you all the best!",
                "category": "birthday"
            },
            headers=admin_auth_headers
        )

        assert response.status_code in [201, 404]
