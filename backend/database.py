import json
import asyncpg
from contextlib import asynccontextmanager

from backend.config import settings

_pool = None


def _to_asyncpg_url(url: str) -> str:
    """Convert SQLAlchemy-style URL to asyncpg-compatible."""
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def _init_conn(conn):
    """Set JSON/JSONB type codecs so asyncpg handles dicts properly."""
    await conn.set_type_codec(
        'json', encoder=json.dumps, decoder=json.loads, schema='pg_catalog'
    )
    await conn.set_type_codec(
        'jsonb', encoder=json.dumps, decoder=json.loads, schema='pg_catalog'
    )


async def get_pool() -> asyncpg.Pool:
    """Get or create the asyncpg connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=_to_asyncpg_url(settings.database_url),
            min_size=2,
            max_size=10,
            init=_init_conn,
        )
    return _pool


async def connect_db():
    """Initialize the connection pool."""
    await get_pool()


async def disconnect_db():
    """Close the connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def acquire():
    """Acquire a connection from the pool."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
