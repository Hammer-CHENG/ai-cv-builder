import httpx
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from backend.config import settings

security = HTTPBearer()

# JWKS cache
_jwks_cache: dict = {}
_ec_public_key = None


def _decode_base64url(data: str) -> bytes:
    """Decode base64url without padding."""
    import base64
    data = data + '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data)


def _build_ec_public_key(jwk: dict) -> ec.EllipticCurvePublicKey:
    """Build EC public key from JWK."""
    x = int.from_bytes(_decode_base64url(jwk['x']), 'big')
    y = int.from_bytes(_decode_base64url(jwk['y']), 'big')
    return ec.EllipticCurvePublicNumbers(
        x, y, ec.SECP256R1()
    ).public_key(default_backend())


def _get_ec_public_key() -> ec.EllipticCurvePublicKey:
    """Get cached EC public key, or fetch from Supabase JWKS."""
    global _ec_public_key
    if _ec_public_key is not None:
        return _ec_public_key

    # Fetch JWKS from Supabase
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    resp = httpx.get(jwks_url, timeout=10.0)
    resp.raise_for_status()
    jwks = resp.json()

    if 'keys' not in jwks or not jwks['keys']:
        raise RuntimeError("No keys found in Supabase JWKS")

    key_data = jwks['keys'][0]
    _ec_public_key = _build_ec_public_key(key_data)
    return _ec_public_key


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Validate Supabase JWT (ES256 or HS256) and return user payload."""
    token = credentials.credentials

    # Try ES256 first (Supabase default)
    try:
        public_key = _get_ec_public_key()
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload
    except (JWTError, RuntimeError, httpx.HTTPError):
        pass

    # Fall back to HS256 (legacy secret)
    if settings.jwt_secret and not settings.jwt_secret.startswith("YOUR_"):
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
