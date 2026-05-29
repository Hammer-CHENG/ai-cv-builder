from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class SectionEntry(BaseModel):
    """Generic repeatable entry within a section."""
    id: str = Field(default_factory=lambda: str(UUID(int=0)))
    fields: dict[str, Any] = {}


class ResumeProfile(BaseModel):
    """Master profile structure stored in profile_json JSONB."""
    contact: dict[str, str] = {}
    sections: dict[str, list[SectionEntry]] = {}


class ResumeCreate(BaseModel):
    profile_json: dict[str, Any] = {}


class ResumeUpdate(BaseModel):
    profile_json: dict[str, Any]


class ResumeAddSection(BaseModel):
    section_name: str
    entries: list[SectionEntry]


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    profile_json: dict[str, Any]
    created_at: datetime
    updated_at: datetime
