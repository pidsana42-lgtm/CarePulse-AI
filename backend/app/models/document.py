from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    document_id: str
    uploaded_at: datetime
    document_type: str = Field(..., description="'id_card', 'medical_certificate', 'referral_letter', 'other'")
    extracted_data: Dict[str, Any]
    masked_preview: Dict[str, Any]
    ocr_confidence: float
    message: str


class DocumentTextReviewRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    document_type: str = Field(default="medical_certificate", max_length=64)
    corrected_text: str = Field(..., min_length=1, max_length=30000)


class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 3


class SemanticSearchResult(BaseModel):
    title: str
    description: str
    scheme_code: str
    similarity_score: float
    source_id: str = Field(default="", description="Citation id of the retrieved policy/manual chunk, e.g. NHSO-2564-001")
