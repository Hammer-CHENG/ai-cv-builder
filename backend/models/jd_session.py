from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class JDSessionCreate(BaseModel):
    resume_id: UUID
    jd_text: str


class JDSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    resume_id: UUID
    jd_text: str
    tailored_cv_json: dict
    match_score: int | None
    llm_annotations: dict
    user_rating: int | None
    created_at: datetime


class RateSession(BaseModel):
    rating: int = Field(ge=1, le=5)
