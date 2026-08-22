import uuid
import logging
from datetime import datetime
from typing import Dict, Any
from app.core.pdpa_masking import pdpa_masker
from app.models.document import DocumentUploadResponse

logger = logging.getLogger(__name__)


class DocumentOCRService:
    """
    Document processing and OCR Service with built-in PDPA On-the-fly Masking.
    Designed for Thai ID Cards, Medical Certificates, and Referral Letters.
    """

    @staticmethod
    async def process_document(filename: str, file_bytes: bytes, doc_type: str) -> DocumentUploadResponse:
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        
        # In a real environment, integrate with Tesseract OCR / PaddleOCR / Google Vision OCR.
        # Here we simulate extracted metadata and apply PDPA sanitization.
        logger.info(f"Processing document {filename} ({len(file_bytes)} bytes) as {doc_type}")

        # Simulated OCR raw extraction based on document type
        if doc_type == "id_card":
            extracted_raw = {
                "name": "นาย สมศักดิ์ รักสงบ",
                "citizen_id": "1100400892143",
                "birth_date": "2505-08-12",
                "address": "99/1 หมู่ 4 ตำบลบางใหญ่ อำเภอบางใหญ่ จังหวัดนนทบุรี",
                "estimated_age": 62
            }
        elif doc_type == "referral_letter":
            extracted_raw = {
                "patient_name": "นาง สมศรี ดีงาม",
                "citizen_id": "3100201948271",
                "origin_hospital": "รพ.สต. บ้านคลองหลวง",
                "target_hospital": "โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ",
                "diagnosis": "E11.9 Type 2 Diabetes Mellitus",
                "referral_date": "2026-08-20"
            }
        else:
            extracted_raw = {
                "title": "ใบรับรองแพทย์ / ผลการตรวจเบื้องต้น",
                "patient_name": "นาย ปรีชา วงศ์สวัสดิ์",
                "citizen_id": "1103700492812",
                "vital_signs": "BP 135/85 mmHg, Pulse 76 bpm"
            }

        # Apply Automatic PDPA Masking for safe viewing and frontend presentation
        masked_data = pdpa_masker.sanitize_health_data(extracted_raw)

        return DocumentUploadResponse(
            document_id=doc_id,
            uploaded_at=datetime.utcnow(),
            document_type=doc_type,
            extracted_data=extracted_raw,
            masked_preview=masked_data,
            ocr_confidence=0.96,
            message="เอกสารได้รับการสแกนและ Mask ข้อมูลส่วนบุคคล (PDPA) สำเร็จ"
        )


ocr_service = DocumentOCRService()
