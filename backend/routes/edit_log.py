from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.dependencies import get_current_user
from backend.database import database
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

    row = await database.fetch_one(
        """
        INSERT INTO edit_logs (user_id, jd_session_id, original_json, edited_json, diff)
        VALUES (:user_id, :jd_session_id, :original_json, :edited_json, :diff)
        RETURNING id, user_id, jd_session_id, original_json, edited_json, diff, created_at
        """,
        values={
            "user_id": str(user_id),
            "jd_session_id": str(payload.jd_session_id) if payload.jd_session_id else None,
            "original_json": payload.original_json,
            "edited_json": payload.edited_json,
            "diff": diff,
        },
    )
    return dict(row)
