from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.dependencies import get_current_user
from backend.database import database
from backend.models.jd_session import JDSessionCreate, JDSessionResponse, RateSession
from backend.services.llm_service import (
    tailor_cv,
    generate_cover_letter,
    generate_interview_questions,
    score_match,
)

router = APIRouter(prefix="/api/jd-sessions", tags=["jd-sessions"])


@router.post("/", response_model=JDSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_jd_session(
    payload: JDSessionCreate,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    # Verify resume ownership
    resume = await database.fetch_one(
        "SELECT id FROM resumes WHERE id = $1 AND user_id = $2",
        payload.resume_id,
        user_id,
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Call LLM for tailoring
    profile_row = await database.fetch_one(
        "SELECT profile_json FROM resumes WHERE id = $1", payload.resume_id
    )
    profile = dict(profile_row["profile_json"])

    llm_result = await tailor_cv(profile, payload.jd_text)

    # Extract cover letter and questions from result for annotations
    cover_letter = llm_result.pop("cover_letter", "")
    interview_questions = llm_result.pop("interview_questions", [])
    match_score = llm_result.pop("match_score", 0)
    why_changed = llm_result.pop("why_changed", {})

    annotations = {
        "why_changed": why_changed,
        "cover_letter": cover_letter,
        "interview_questions": interview_questions,
    }

    row = await database.fetch_one(
        """
        INSERT INTO jd_sessions (user_id, resume_id, jd_text, tailored_cv_json, match_score, llm_annotations)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, resume_id, jd_text, tailored_cv_json, match_score, llm_annotations, user_rating, created_at
        """,
        user_id,
        payload.resume_id,
        payload.jd_text,
        llm_result,
        match_score,
        annotations,
    )
    return dict(row)


@router.get("/", response_model=list[JDSessionResponse])
async def list_jd_sessions(user: dict = Depends(get_current_user)):
    user_id = UUID(user["sub"])
    rows = await database.fetch_all(
        "SELECT * FROM jd_sessions WHERE user_id = $1 ORDER BY created_at DESC",
        user_id,
    )
    return [dict(r) for r in rows]


@router.get("/{session_id}", response_model=JDSessionResponse)
async def get_jd_session(
    session_id: UUID,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    row = await database.fetch_one(
        "SELECT * FROM jd_sessions WHERE id = $1 AND user_id = $2",
        session_id,
        user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return dict(row)


@router.post("/{session_id}/rate")
async def rate_session(
    session_id: UUID,
    payload: RateSession,
    user: dict = Depends(get_current_user),
):
    user_id = UUID(user["sub"])
    await database.execute(
        "UPDATE jd_sessions SET user_rating = $1 WHERE id = $2 AND user_id = $3",
        payload.rating,
        session_id,
        user_id,
    )
    return {"status": "ok"}
