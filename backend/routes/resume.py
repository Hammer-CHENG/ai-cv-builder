from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.dependencies import get_current_user
from backend.database import database
from backend.models.resume import (
    ResumeCreate,
    ResumeUpdate,
    ResumeAddSection,
    ResumeResponse,
    SectionEntry,
)

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


@router.post("/", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    payload: ResumeCreate,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    existing = await database.fetch_one(
        "SELECT id FROM resumes WHERE user_id = :user_id",
        values={"user_id": str(user_id)},
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already has a master resume. Use PUT to update.",
        )
    row = await database.fetch_one(
        """
        INSERT INTO resumes (user_id, profile_json)
        VALUES (:user_id, :profile_json)
        RETURNING id, user_id, profile_json, created_at, updated_at
        """,
        values={"user_id": str(user_id), "profile_json": payload.profile_json},
    )
    return dict(row)


@router.get("/", response_model=ResumeResponse)
async def get_resume(user: dict = Depends(get_current_user)):
    user_id = UUID(user["sub"])
    row = await database.fetch_one(
        "SELECT * FROM resumes WHERE user_id = :user_id",
        values={"user_id": str(user_id)},
    )
    if not row:
        raise HTTPException(status_code=404, detail="Resume not found")
    return dict(row)


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: UUID,
    payload: ResumeUpdate,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    row = await database.fetch_one(
        """
        UPDATE resumes
        SET profile_json = :profile_json, updated_at = NOW()
        WHERE id = :resume_id AND user_id = :user_id
        RETURNING id, user_id, profile_json, created_at, updated_at
        """,
        values={
            "profile_json": payload.profile_json,
            "resume_id": str(resume_id),
            "user_id": str(user_id),
        },
    )
    if not row:
        raise HTTPException(status_code=404, detail="Resume not found")
    return dict(row)


@router.post("/{resume_id}/sections", response_model=ResumeResponse)
async def add_section(
    resume_id: UUID,
    payload: ResumeAddSection,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    row = await database.fetch_one(
        "SELECT profile_json FROM resumes WHERE id = :resume_id AND user_id = :user_id",
        values={"resume_id": str(resume_id), "user_id": str(user_id)},
    )
    if not row:
        raise HTTPException(status_code=404, detail="Resume not found")
    profile = dict(row["profile_json"])
    sections = profile.get("sections", {})
    existing = sections.get(payload.section_name, [])
    existing_ids = {e.get("id") for e in existing}
    for entry in payload.entries:
        if entry.id not in existing_ids:
            existing.append(entry.model_dump())
    sections[payload.section_name] = existing
    profile["sections"] = sections

    updated = await database.fetch_one(
        """
        UPDATE resumes
        SET profile_json = :profile_json, updated_at = NOW()
        WHERE id = :resume_id AND user_id = :user_id
        RETURNING id, user_id, profile_json, created_at, updated_at
        """,
        values={
            "profile_json": profile,
            "resume_id": str(resume_id),
            "user_id": str(user_id),
        },
    )
    return dict(updated)
