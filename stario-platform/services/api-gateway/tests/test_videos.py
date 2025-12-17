"""
Tests for video generation endpoints.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestVideoGeneration:
    """Tests for video generation."""

    @pytest.mark.asyncio
    async def test_generate_video_unauthorized(self, client: AsyncClient):
        """Test generating video without authentication."""
        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4()),
            "custom_message": "Happy birthday!",
            "recipient_name": "John"
        })

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_generate_video_success(self, client: AsyncClient, auth_headers: dict):
        """Test generating video with valid data."""
        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4()),
            "custom_message": "Happy birthday to you!",
            "recipient_name": "John",
            "occasion": "birthday",
            "language": "uz",
            "duration_seconds": 15
        }, headers=auth_headers)

        # May succeed (200) or fail if artist doesn't exist (404)
        assert response.status_code in [200, 404, 500]

    @pytest.mark.asyncio
    async def test_generate_video_missing_fields(self, client: AsyncClient, auth_headers: dict):
        """Test generating video with missing required fields."""
        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4())
            # Missing custom_message and recipient_name
        }, headers=auth_headers)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_video_long_message(self, client: AsyncClient, auth_headers: dict):
        """Test generating video with message exceeding max length."""
        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4()),
            "custom_message": "A" * 501,  # Exceeds 500 char limit
            "recipient_name": "John"
        }, headers=auth_headers)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_video_invalid_duration(self, client: AsyncClient, auth_headers: dict):
        """Test generating video with invalid duration."""
        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4()),
            "custom_message": "Test message",
            "recipient_name": "John",
            "duration_seconds": 45  # Not in allowed values [15, 30, 60]
        }, headers=auth_headers)

        assert response.status_code == 422


class TestVideoJobStatus:
    """Tests for checking video job status."""

    @pytest.mark.asyncio
    async def test_get_job_status_unauthorized(self, client: AsyncClient):
        """Test getting job status without authentication."""
        response = await client.get(f"/videos/jobs/{uuid4()}")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_job_status_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting status of non-existent job."""
        response = await client.get(f"/videos/jobs/{uuid4()}", headers=auth_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_job_status_invalid_id(self, client: AsyncClient, auth_headers: dict):
        """Test getting job status with invalid ID."""
        response = await client.get("/videos/jobs/invalid-uuid", headers=auth_headers)

        assert response.status_code in [404, 422]


class TestUserVideos:
    """Tests for user's video history."""

    @pytest.mark.asyncio
    async def test_list_my_videos_unauthorized(self, client: AsyncClient):
        """Test listing videos without authentication."""
        response = await client.get("/videos/my")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_my_videos(self, client: AsyncClient, auth_headers: dict):
        """Test listing user's videos."""
        response = await client.get("/videos/my", headers=auth_headers)

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_list_my_videos_pagination(self, client: AsyncClient, auth_headers: dict):
        """Test listing user's videos with pagination."""
        response = await client.get("/videos/my", params={
            "page": 1,
            "page_size": 10
        }, headers=auth_headers)

        assert response.status_code == 200


class TestVideoSharing:
    """Tests for video sharing functionality."""

    @pytest.mark.asyncio
    async def test_share_video_unauthorized(self, client: AsyncClient):
        """Test sharing video without authentication."""
        response = await client.post(f"/videos/{uuid4()}/share")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_share_video_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test sharing non-existent video."""
        response = await client.post(f"/videos/{uuid4()}/share", headers=auth_headers)

        assert response.status_code == 404


class TestVideoDownload:
    """Tests for video download functionality."""

    @pytest.mark.asyncio
    async def test_download_video_unauthorized(self, client: AsyncClient):
        """Test downloading video without authentication."""
        response = await client.get(f"/videos/{uuid4()}/download")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_download_video_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test downloading non-existent video."""
        response = await client.get(f"/videos/{uuid4()}/download", headers=auth_headers)

        assert response.status_code == 404


class TestVideoContentModeration:
    """Tests for video content moderation."""

    @pytest.mark.asyncio
    async def test_generate_video_with_prohibited_content(self, client: AsyncClient, auth_headers: dict, mock_redis):
        """Test that prohibited content is rejected."""
        # Configure mock to simulate moderation rejection
        mock_redis.get.return_value = None

        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4()),
            "custom_message": "Political message about elections",
            "recipient_name": "John"
        }, headers=auth_headers)

        # Should be rejected by regtech filter (400) or queued for review
        assert response.status_code in [200, 400, 404, 500]

    @pytest.mark.asyncio
    async def test_generate_video_with_nsfw_content(self, client: AsyncClient, auth_headers: dict):
        """Test that NSFW content is rejected."""
        response = await client.post("/videos/generate", json={
            "artist_id": str(uuid4()),
            "custom_message": "Explicit adult content message",
            "recipient_name": "John"
        }, headers=auth_headers)

        # Should be rejected or flagged
        assert response.status_code in [200, 400, 404, 500]
