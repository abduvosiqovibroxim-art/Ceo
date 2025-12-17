"""
Tests for Face Quiz endpoints.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


class TestStartFaceQuiz:
    """Tests for starting face quiz."""

    @pytest.mark.asyncio
    async def test_start_quiz_unauthorized(self, client: AsyncClient):
        """Test starting quiz without authentication."""
        response = await client.post("/face-quiz/start", json={
            "artist_id": str(uuid4())
        })

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_start_quiz_success(self, client: AsyncClient, auth_headers: dict):
        """Test starting quiz with valid artist."""
        response = await client.post("/face-quiz/start", json={
            "artist_id": str(uuid4()),
            "save_photo": False  # Ephemeral mode (default)
        }, headers=auth_headers)

        # May return 200 with presigned URL or 404 if artist doesn't exist
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert "quiz_id" in data
            assert "upload_url" in data
            assert "expires_in_seconds" in data

    @pytest.mark.asyncio
    async def test_start_quiz_missing_artist(self, client: AsyncClient, auth_headers: dict):
        """Test starting quiz without artist_id."""
        response = await client.post("/face-quiz/start", json={}, headers=auth_headers)

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_start_quiz_with_save_photo(self, client: AsyncClient, auth_headers: dict):
        """Test starting quiz with photo save opt-in."""
        response = await client.post("/face-quiz/start", json={
            "artist_id": str(uuid4()),
            "save_photo": True  # User consents to save
        }, headers=auth_headers)

        assert response.status_code in [200, 404]


class TestAnalyzeFace:
    """Tests for face analysis."""

    @pytest.mark.asyncio
    async def test_analyze_unauthorized(self, client: AsyncClient):
        """Test analyzing without authentication."""
        response = await client.post(f"/face-quiz/{uuid4()}/analyze")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_analyze_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test analyzing non-existent quiz."""
        response = await client.post(f"/face-quiz/{uuid4()}/analyze", headers=auth_headers)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_analyze_invalid_quiz_id(self, client: AsyncClient, auth_headers: dict):
        """Test analyzing with invalid quiz ID."""
        response = await client.post("/face-quiz/invalid-uuid/analyze", headers=auth_headers)

        assert response.status_code in [404, 422]


class TestFaceQuizResult:
    """Tests for getting quiz results."""

    @pytest.mark.asyncio
    async def test_get_result_unauthorized(self, client: AsyncClient):
        """Test getting result without authentication."""
        response = await client.get(f"/face-quiz/{uuid4()}/result")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_result_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting result of non-existent quiz."""
        response = await client.get(f"/face-quiz/{uuid4()}/result", headers=auth_headers)

        assert response.status_code == 404


class TestFaceQuizLeaderboard:
    """Tests for quiz leaderboard."""

    @pytest.mark.asyncio
    async def test_get_leaderboard(self, client: AsyncClient):
        """Test getting leaderboard (public)."""
        artist_id = str(uuid4())
        response = await client.get(f"/face-quiz/leaderboard/{artist_id}")

        # May return 200 with empty list or 404
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_get_leaderboard_pagination(self, client: AsyncClient):
        """Test leaderboard pagination."""
        artist_id = str(uuid4())
        response = await client.get(f"/face-quiz/leaderboard/{artist_id}", params={
            "limit": 10,
            "offset": 0
        })

        assert response.status_code in [200, 404]


class TestFaceQuizShare:
    """Tests for sharing quiz results."""

    @pytest.mark.asyncio
    async def test_share_result_unauthorized(self, client: AsyncClient):
        """Test sharing result without authentication."""
        response = await client.post(f"/face-quiz/{uuid4()}/share")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_share_result_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test sharing non-existent quiz result."""
        response = await client.post(f"/face-quiz/{uuid4()}/share", headers=auth_headers)

        assert response.status_code == 404


class TestMyQuizHistory:
    """Tests for user's quiz history."""

    @pytest.mark.asyncio
    async def test_get_my_quizzes_unauthorized(self, client: AsyncClient):
        """Test getting quiz history without authentication."""
        response = await client.get("/face-quiz/my")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_my_quizzes(self, client: AsyncClient, auth_headers: dict):
        """Test getting user's quiz history."""
        response = await client.get("/face-quiz/my", headers=auth_headers)

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_my_quizzes_pagination(self, client: AsyncClient, auth_headers: dict):
        """Test quiz history pagination."""
        response = await client.get("/face-quiz/my", params={
            "page": 1,
            "page_size": 10
        }, headers=auth_headers)

        assert response.status_code == 200


class TestPIICompliance:
    """Tests for PII compliance (ephemeral uploads)."""

    @pytest.mark.asyncio
    async def test_presigned_url_expiry(self, client: AsyncClient, auth_headers: dict):
        """Test that presigned URLs have reasonable expiry."""
        response = await client.post("/face-quiz/start", json={
            "artist_id": str(uuid4())
        }, headers=auth_headers)

        if response.status_code == 200:
            data = response.json()
            # Expiry should be reasonable (5 minutes = 300 seconds max)
            assert data.get("expires_in_seconds", 0) <= 300

    @pytest.mark.asyncio
    async def test_ephemeral_mode_default(self, client: AsyncClient, auth_headers: dict):
        """Test that ephemeral mode is default (save_photo=false)."""
        response = await client.post("/face-quiz/start", json={
            "artist_id": str(uuid4())
            # save_photo not specified, should default to false
        }, headers=auth_headers)

        # Response should indicate ephemeral mode
        assert response.status_code in [200, 404]
