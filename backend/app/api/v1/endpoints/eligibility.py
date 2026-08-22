from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.models.assessment import CitizenAssessmentRequest, AssessmentResultResponse
from app.services.eligibility_engine import eligibility_engine
from app.db.mongodb import get_database
from app.core.pdpa_masking import pdpa_masker
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/assess", response_model=AssessmentResultResponse)
async def assess_healthcare_rights(request: CitizenAssessmentRequest):
    """
    Evaluate citizen healthcare rights and calculate covered benefits.
    Automatically applies PDPA masking to personal identifiers.
    """
    try:
        # Run calculation rules engine
        result = eligibility_engine.calculate_rights(request)

        # Store in MongoDB (with PDPA sanitized data) if available
        try:
            db = get_database()
            if db is not None:
                sanitized_record = pdpa_masker.sanitize_health_data(result.model_dump())
                await db["assessment_history"].insert_one(sanitized_record)
                logger.info(f"Assessment {result.assessment_id} recorded securely in MongoDB.")
        except Exception as db_err:
            logger.warning(f"MongoDB persistence skipped (database offline or unreachable): {db_err}")

        return result
    except Exception as e:
        logger.error(f"Error evaluating rights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assess rights: {str(e)}")


@router.get("/schemes")
async def get_supported_schemes():
    """List all supported national healthcare schemes."""
    return [
        {"code": "UC", "name": "สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาท)"},
        {"code": "SSO", "name": "สิทธิประกันสังคม (มาตรา 33, 39, 40)"},
        {"code": "CSMBS", "name": "สิทธิสวัสดิการรักษาพยาบาลข้าราชการ"},
        {"code": "ELDERLY_CARE", "name": "สิทธิและสวัสดิการผู้สูงอายุ (60 ปีขึ้นไป)"},
        {"code": "DISABILITY_CARE", "name": "สิทธิการฟื้นฟูสมรรถภาพคนพิการ"},
        {"code": "UCEP", "name": "สิทธิการรักษาพยาบาลฉุกเฉินวิกฤต (UCEP 72 ชั่วโมง)"}
    ]
