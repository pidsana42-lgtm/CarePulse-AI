from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.document import DocumentUploadResponse
from app.services.ocr_service import ocr_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/scan", response_model=DocumentUploadResponse)
async def scan_and_extract_document(
    file: UploadFile = File(..., description="Document image file (JPEG, PNG, WEBP)"),
    document_type: str = Form("id_card", description="Document type: 'id_card', 'referral_letter', 'medical_certificate'")
):
    """
    Receive uploaded document photo from Citizen Interface (Smartphone camera).
    Performs OCR and instant PDPA masking.
    """
    if not file.content_type.startswith("image/") and not file.filename.endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an image or PDF.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    result = await ocr_service.process_document(
        filename=file.filename,
        file_bytes=contents,
        doc_type=document_type
    )

    return result
