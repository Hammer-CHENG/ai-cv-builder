from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.database import acquire
from backend.dependencies import get_current_user
from backend.models.resume import (
    ResumeCreate,
    ResumeUpdate,
    ResumeAddSection,
    ResumeResponse,
    SectionEntry,
)

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


async def ensure_user(user_id: UUID, email: str = ""):
    """Ensure the user exists in the local users table (mimics Supabase auth trigger)."""
    async with acquire() as conn:
        await conn.execute(
            "INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
            str(user_id),
            email,
        )


@router.post("/", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    payload: ResumeCreate,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    email = user.get("email", "")
    await ensure_user(user_id, email)
    async with acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM resumes WHERE user_id = $1", str(user_id)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already has a master resume. Use PUT to update.",
            )
        row = await conn.fetchrow(
            "INSERT INTO resumes (user_id, profile_json) VALUES ($1, $2) RETURNING id, user_id, profile_json, created_at, updated_at",
            str(user_id),
            payload.profile_json,
        )
        return dict(row)


@router.get("/", response_model=ResumeResponse)
async def get_resume(user: dict = Depends(get_current_user)):
    user_id = UUID(user["sub"])
    async with acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM resumes WHERE user_id = $1", str(user_id)
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
    async with acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE resumes SET profile_json = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id, user_id, profile_json, created_at, updated_at",
            payload.profile_json,
            str(resume_id),
            str(user_id),
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
    async with acquire() as conn:
        row = await conn.fetchrow(
            "SELECT profile_json FROM resumes WHERE id = $1 AND user_id = $2",
            str(resume_id),
            str(user_id),
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

        updated = await conn.fetchrow(
            "UPDATE resumes SET profile_json = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id, user_id, profile_json, created_at, updated_at",
            profile,
            str(resume_id),
            str(user_id),
        )
        return dict(updated)
