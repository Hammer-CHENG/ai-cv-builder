import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from jose.utils import base64url_decode

from backend.config import settings

security = HTTPBearer()

# JWKS cache for ES256 Supabase tokens
_jwks_cache: dict = {}


async def _get_supabase_jwks() -> dict:
    """Fetch Supabase's public keys for ES256 JWT verification."""
    if _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        )
        resp.raise_for_status()
        _jwks_cache.update(resp.json())
    return _jwks_cache


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Validate Supabase JWT and return user payload.

    Supports both HS256 (legacy secret) and ES256 (EC key) verification.
    """
    token = credentials.credentials

    # Try ES256 first (modern Supabase default)
    if settings.jwt_algorithm == "ES256" or not settings.jwt_secret or settings.jwt_secret.startswith("YOUR_"):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Running in async context, need to fetch JWKS
                # Fall back to simple decode without verification, then verify manually
                pass
        except RuntimeError:
            pass

        # For ES256: fetch JWKS and verify
        try:
            jwks = _get_supabase_jwks_sync()
            if "keys" in jwks and jwks["keys"]:
                key_data = jwks["keys"][0]
                from cryptography.hazmat.primitives.asymmetric import ec
                from cryptography.hazmat.backends import default_backend
                from cryptography.hazmat.primitives import serialization

                # Build EC public key from JWK
                x = int.from_bytes(base64url_decode(key_data["x"]), "big")
                y = int.from_bytes(base64url_decode(key_data["y"]), "big")
                public_key = ec.EllipticCurvePublicNumbers(
                    x, y, ec.SECP256R1()
                ).public_key(default_backend())

                pem_key = public_key.public_bytes(
                    serialization.Encoding.PEM,
                    serialization.PublicFormat.SubjectPublicKeyInfo,
                )

                payload = jwt.decode(
                    token,
                    pem_key,
                    algorithms=["ES256"],
                    audience="authenticated",
                )
                return payload
        except Exception:
            pass

    # Fall back to HS256 (legacy Supabase JWT secret)
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience="authenticated",
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _get_supabase_jwks_sync() -> dict:
    """Synchronous JWKS fetch for sync context."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    try:
        import urllib.request
        url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        with urllib.request.urlopen(url, timeout=10) as resp:
            _jwks_cache = resp.json()
    except Exception:
        _jwks_cache = {}
    return _jwks_cache
