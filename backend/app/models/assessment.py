from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class CitizenAssessmentRequest(BaseModel):
    """Input data for healthcare eligibility assessment."""
    citizen_id: Optional[str] = Field(None, description="13-digit Thai National ID (optional/masked)")
    age: int = Field(..., ge=0, le=130, description="Age in years")
    occupation_status: str = Field(..., description="e.g., 'gov_employee', 'private_employee', 'freelance', 'unemployed', 'senior'")
    registered_province: str = Field(default="กรุงเทพมหานคร", description="Registered hospital or province")
    has_disability_card: bool = Field(default=False, description="Has registered disability status")
    chronic_conditions: List[str] = Field(default=[], description="List of chronic conditions (e.g., เบาหวาน, ความดัน)")
    urgency_level: str = Field(default="normal", description="'emergency', 'urgent', 'normal'")


class HealthcareRightDetail(BaseModel):
    scheme_code: str
    scheme_name: str
    is_eligible: bool
    coverage_summary: str
    free_items: List[str]
    co_pay_items: List[str]
    how_to_use: str
    hospital_network: str


class AssessmentResultResponse(BaseModel):
    assessment_id: str
    assessed_at: datetime
    patient_summary: Dict[str, Any]
    primary_right: HealthcareRightDetail
    additional_rights: List[HealthcareRightDetail]
    recommendations: List[str]
    pdpa_protected: bool = True
