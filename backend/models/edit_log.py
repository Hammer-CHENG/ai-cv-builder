from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EditLogCreate(BaseModel):
    jd_session_id: UUID | None = None
    original_json: dict
    edited_json: dict


class EditLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    jd_session_id: UUID | None
    original_json: dict
    edited_json: dict
    diff: dict
    created_at: datetime
