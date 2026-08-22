from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class OfficialReference(BaseModel):
    title: str
    legal_act: str
    agency: str
    url: str


class CitizenAssessmentRequest(BaseModel):
    """Input data for healthcare eligibility assessment."""
    citizen_id: Optional[str] = Field(None, description="13-digit Thai National ID (optional/masked)")
    age: int = Field(..., ge=0, le=130, description="Age in years")
    occupation_status: str = Field(..., description="e.g., 'gov_employee', 'private_employee', 'freelance', 'unemployed', 'senior'")
    registered_province: str = Field(default="กรุงเทพมหานคร", description="Registered hospital or province")
    has_disability_card: bool = Field(default=False, description="Has registered disability status")
    chronic_conditions: List[str] = Field(default=[], description="List of chronic conditions (e.g., เบาหวาน, ความดัน, ติดเตียง)")
    urgency_level: str = Field(default="normal", description="'emergency', 'urgent', 'normal'")


class HealthcareRightDetail(BaseModel):
    scheme_code: str
    scheme_name: str
    is_eligible: bool
    responsible_agency: str = "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)"
    contact_channel: str = "สายด่วน สปสช. 1330"
    coverage_summary: str
    free_items: List[str]
    co_pay_items: List[str]
    eligible_equipment: List[str] = []
    estimated_coverage_value: str = "คุ้มครองเต็มจำนวนตามสิทธิ"
    estimated_out_of_pocket: str = "0 บาท (ไม่มีค่าใช้จ่ายในเครือข่าย)"
    official_references: List[OfficialReference] = []
    how_to_use: str
    hospital_network: str


class CostPlanningSummary(BaseModel):
    total_estimated_benefit_value: str
    estimated_out_of_pocket: str
    eligible_equipment_count: int
    participating_agencies: List[str]


class AssessmentResultResponse(BaseModel):
    assessment_id: str
    assessed_at: datetime
    patient_summary: Dict[str, Any]
    primary_right: HealthcareRightDetail
    additional_rights: List[HealthcareRightDetail]
    cost_planning: Optional[CostPlanningSummary] = None
    all_official_references: List[OfficialReference] = []
    recommendations: List[str]
    pdpa_protected: bool = True
