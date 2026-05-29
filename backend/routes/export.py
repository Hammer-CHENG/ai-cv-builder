from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from backend.dependencies import get_current_user
from backend.services.pdf_service import generate_pdf
from pydantic import BaseModel

router = APIRouter(prefix="/api/export", tags=["export"])


class PDFRequest(BaseModel):
    cv_json: dict


@router.post("/pdf")
async def export_pdf(
    payload: PDFRequest,
    user: dict = Depends(get_current_user),
):
    try:
        pdf_bytes = generate_pdf(payload.cv_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="resume.pdf"'},
    )
