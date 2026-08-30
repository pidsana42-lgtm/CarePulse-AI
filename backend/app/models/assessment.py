from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import date, datetime


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
    # Private insurance fields
    has_private_insurance: bool = Field(default=False, description="Has private life/health insurance")
    private_insurance_type: Optional[str] = Field(None, description="'life', 'health', or 'both'")
    private_insurance_provider: Optional[str] = Field(None, description="Insurance company name, e.g. AIA, คม.ชล., กรุงเทพประกันชีวิต")
    private_insurance_annual_limit: Optional[int] = Field(None, description="Annual coverage limit in THB")


class RegistryLookupRequest(BaseModel):
    """Minimal identity data used only for the transient mock registry lookup."""
    citizen_id: str = Field(..., min_length=13, max_length=17, description="Thai National ID; separators are accepted")
    full_name: str = Field(default="ผู้ใช้งานตัวอย่าง", max_length=120)
    birth_date: Optional[date] = None
    registered_province: str = Field(default="นครราชสีมา", max_length=120)
    consent: bool = Field(default=False, description="Explicit consent for this lookup")


class RegistryPerson(BaseModel):
    citizen_id_masked: str
    display_name: str
    birth_date: Optional[date] = None


class RegistryProvider(BaseModel):
    hcode: str
    name: str
    province: str


class RegistryNhsoDetail(BaseModel):
    health_card_number_masked: str
    registered_province: str
    service_start_date: date
    sub_scheme_expiry_date: Optional[date] = None
    primary_care_provider: Optional[RegistryProvider] = None
    referral_provider: Optional[RegistryProvider] = None
    provider_change_count: int = 0


class RegistryEntitlement(BaseModel):
    scheme_code: str
    scheme_name: str
    sub_scheme_code: str
    sub_scheme_name: str
    status: str
    effective_date: date
    expiry_date: Optional[date] = None
    primary_provider: RegistryProvider
    nhso_detail: Optional[RegistryNhsoDetail] = None


class RegistryBenefit(BaseModel):
    code: str
    name: str
    coverage: str
    status: str


class RegistryGatewayCheck(BaseModel):
    code: str
    agency: str
    service: str
    status: str
    message: str
    reference_url: str


class RegistryInsurancePolicy(BaseModel):
    policy_number_masked: str
    policy_type: str
    insurer_name: str
    plan_name: str
    status: str
    effective_date: date
    expiry_date: date
    coverage_summary: str
    sum_insured: str


class RegistrySource(BaseModel):
    system: str
    environment: str = "DEMO"
    response_basis: str
    disclaimer: str


class MockRegistryResponse(BaseModel):
    request_id: str
    checked_at: datetime
    endpoint: str
    person: RegistryPerson
    entitlement: RegistryEntitlement
    gateways: List[RegistryGatewayCheck]
    private_policies: List[RegistryInsurancePolicy]
    benefits: List[RegistryBenefit]
    source: RegistrySource


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
