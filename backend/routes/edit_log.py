from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.database import acquire
from backend.dependencies import get_current_user
from backend.models.edit_log import EditLogCreate, EditLogResponse
from backend.services.diff_service import capture_diff

router = APIRouter(prefix="/api/edit-logs", tags=["edit-logs"])


@router.post("/", response_model=EditLogResponse, status_code=status.HTTP_201_CREATED)
async def create_edit_log(
    payload: EditLogCreate,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    diff = capture_diff(payload.original_json, payload.edited_json)

    async with acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO edit_logs (user_id, jd_session_id, original_json, edited_json, diff)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, jd_session_id, original_json, edited_json, diff, created_at
            """,
            str(user_id),
            str(payload.jd_session_id) if payload.jd_session_id else None,
            payload.original_json,
            payload.edited_json,
            diff,
        )
        return dict(row)
