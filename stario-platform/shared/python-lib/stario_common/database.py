"""
Database connection and session management.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy import MetaData, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""

    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


class Database:
    """Database connection manager."""

    def __init__(self, database_url: Optional[str] = None):
        settings = get_settings()
        url = database_url or settings.database_url

        # Convert to async URL if needed
        if url.startswith("postgresql://"):
            async_url = url.replace("postgresql://", "postgresql+asyncpg://")
        else:
            async_url = url

        self._async_engine = create_async_engine(
            async_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            echo=settings.debug,
        )

        self._async_session_factory = async_sessionmaker(
            self._async_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

        # Sync engine for migrations
        self._sync_engine = create_engine(
            url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            echo=settings.debug,
        )
        self._sync_session_factory = sessionmaker(
            self._sync_engine,
            autocommit=False,
            autoflush=False,
        )

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an async database session."""
        session = self._async_session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async def create_tables(self) -> None:
        """Create all tables."""
        async with self._async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def drop_tables(self) -> None:
        """Drop all tables."""
        async with self._async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    async def close(self) -> None:
        """Close database connections."""
        await self._async_engine.dispose()


# Global database instance
_db: Optional[Database] = None


def get_db() -> Database:
    """Get the global database instance."""
    global _db
    if _db is None:
        _db = Database()
    return _db


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions."""
    db = get_db()
    async with db.session() as session:
        yield session
