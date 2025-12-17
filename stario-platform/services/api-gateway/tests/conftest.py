"""
Pytest configuration and fixtures for API Gateway tests.
"""
import asyncio
import pytest
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from redis.asyncio import Redis
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from stario_common.database import Base, get_db
from stario_common.redis_client import get_redis
from stario_common.auth import create_access_token


# Test database URL (use SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def mock_redis() -> AsyncGenerator[AsyncMock, None]:
    """Create mock Redis client."""
    mock = AsyncMock(spec=Redis)
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = 1
    mock.incr.return_value = 1
    mock.expire.return_value = True
    mock.lpush.return_value = 1
    mock.rpop.return_value = None
    yield mock


@pytest.fixture
async def client(db_session, mock_redis) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client."""

    async def override_get_db():
        yield db_session

    async def override_get_redis():
        yield mock_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data() -> dict:
    """Sample user data for tests."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "full_name": "Test User",
        "phone": "+998901234567"
    }


@pytest.fixture
def test_artist_data() -> dict:
    """Sample artist data for tests."""
    return {
        "name": "Test Artist",
        "stage_name": "TestStar",
        "bio": "Famous test artist for testing purposes",
        "category": "singer",
        "country": "UZ"
    }


@pytest.fixture
def auth_headers() -> dict:
    """Create authentication headers for tests."""
    token = create_access_token(
        data={
            "sub": "test-user-id",
            "email": "test@example.com",
            "role": "user"
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers() -> dict:
    """Create admin authentication headers for tests."""
    token = create_access_token(
        data={
            "sub": "admin-user-id",
            "email": "admin@stario.uz",
            "role": "admin"
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def operator_auth_headers() -> dict:
    """Create operator authentication headers for tests."""
    token = create_access_token(
        data={
            "sub": "operator-user-id",
            "email": "operator@stario.uz",
            "role": "operator"
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def validator_auth_headers() -> dict:
    """Create validator authentication headers for tests."""
    token = create_access_token(
        data={
            "sub": "validator-user-id",
            "email": "validator@stario.uz",
            "role": "validator"
        }
    )
    return {"Authorization": f"Bearer {token}"}
