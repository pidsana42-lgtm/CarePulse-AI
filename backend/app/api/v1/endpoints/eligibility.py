from datetime import date, datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response
from typing import List, Dict, Any
from app.models.assessment import (
    CitizenAssessmentRequest,
    AssessmentResultResponse,
    MockRegistryResponse,
    RegistryBenefit,
    RegistryEntitlement,
    RegistryGatewayCheck,
    RegistryInsurancePolicy,
    RegistryLookupRequest,
    RegistryNhsoDetail,
    RegistryPerson,
    RegistryProvider,
    RegistrySource,
)
from app.services.eligibility_engine import eligibility_engine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


MOCK_SCHEMES = {
    "UCS": {
        "name": "สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง)",
        "sub_name": "สิทธิบัตรทอง",
        "agency": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
        "provider": "หน่วยบริการประจำตัวอย่าง",
        "benefits": [
            ("OPD", "บริการผู้ป่วยนอก"),
            ("IPD", "บริการผู้ป่วยใน"),
            ("EMERGENCY", "บริการกรณีฉุกเฉิน"),
        ],
    },
    "SSO33": {
        "name": "สิทธิประกันสังคม มาตรา 33",
        "sub_name": "ผู้ประกันตนมาตรา 33",
        "agency": "สำนักงานประกันสังคม (สปส.)",
        "provider": "สถานพยาบาลตามสิทธิประกันสังคมตัวอย่าง",
        "benefits": [
            ("MEDICAL", "บริการรักษาพยาบาลตามสิทธิ"),
            ("IPD", "บริการผู้ป่วยในตามเงื่อนไข"),
            ("EMERGENCY", "บริการกรณีฉุกเฉิน"),
        ],
    },
    "SSO39": {
        "name": "สิทธิประกันสังคม มาตรา 39",
        "sub_name": "ผู้ประกันตนมาตรา 39",
        "agency": "สำนักงานประกันสังคม (สปส.)",
        "provider": "สถานพยาบาลตามสิทธิประกันสังคมตัวอย่าง",
        "benefits": [
            ("MEDICAL", "บริการรักษาพยาบาลตามสิทธิ"),
            ("IPD", "บริการผู้ป่วยในตามเงื่อนไข"),
        ],
    },
    "CSMBS": {
        "name": "สวัสดิการรักษาพยาบาลข้าราชการ",
        "sub_name": "ระบบเบิกจ่ายตรงค่ารักษาพยาบาล",
        "agency": "กรมบัญชีกลาง",
        "provider": "สถานพยาบาลที่รองรับเบิกจ่ายตรงตัวอย่าง",
        "benefits": [
            ("DIRECT_PAYMENT", "บริการเบิกจ่ายตรงตามเงื่อนไข"),
            ("OPD", "บริการผู้ป่วยนอกตามสิทธิ"),
            ("IPD", "บริการผู้ป่วยในตามสิทธิ"),
        ],
    },
    "REVIEW": {
        "name": "ยังไม่พบสิทธิที่ยืนยันได้",
        "sub_name": "ต้องตรวจสอบกับหน่วยงานเจ้าของสิทธิ",
        "agency": "หน่วยงานเจ้าของสิทธิที่เกี่ยวข้อง",
        "provider": "ยังไม่พบหน่วยบริการประจำ",
        "benefits": [],
    },
}


def _resolve_mock_scheme(citizen_id: str) -> str:
    """Deterministic demo mapping; it is deliberately not a government rule."""
    last_digit = int(citizen_id[-1])
    if last_digit <= 3:
        return "UCS"
    if last_digit <= 5:
        return "SSO33"
    if last_digit == 6:
        return "SSO39"
    if last_digit in (7, 8):
        return "CSMBS"
    return "REVIEW"


def _mask_citizen_id(citizen_id: str) -> str:
    return f"{citizen_id[0]}-{citizen_id[1:5]}-XXXXX-XX-{citizen_id[-1]}"


@router.post("/registry/mock-lookup", response_model=MockRegistryResponse)
async def mock_registry_lookup(request: RegistryLookupRequest, response: Response):
    """Simulate a transient government registry lookup without persisting identity data."""
    if not request.consent:
        raise HTTPException(status_code=400, detail="ต้องได้รับความยินยอมก่อนตรวจสอบสิทธิ")

    citizen_id = "".join(character for character in request.citizen_id if character.isdigit())
    if len(citizen_id) != 13:
        raise HTTPException(status_code=422, detail="เลขบัตรประชาชนต้องมีตัวเลข 13 หลัก")

    scheme_code = _resolve_mock_scheme(citizen_id)
    scheme = MOCK_SCHEMES[scheme_code]
    active = scheme_code != "REVIEW"
    matched_gateway = {
        "UCS": "NHSO",
        "SSO33": "SSO",
        "SSO39": "SSO",
        "CSMBS": "CGD",
    }.get(scheme_code)
    province_code = str(sum(ord(character) for character in request.registered_province) % 1000).zfill(3)
    waiting_for_location = request.registered_province.startswith("รอ")
    demo_registered_providers = {
        "UCS": ("24060", "โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี", "นครราชสีมา"),
        "SSO33": ("DEMO-SSO-001", "โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี", "นครราชสีมา"),
        "SSO39": ("DEMO-SSO-001", "โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี", "นครราชสีมา"),
        "CSMBS": ("DEMO-CGD-001", "โรงพยาบาลมหาราชนครราชสีมา", "นครราชสีมา"),
        "REVIEW": ("DEMO-REVIEW", "ยังไม่พบหน่วยบริการประจำ", "รอยืนยันสิทธิ"),
    }
    demo_hcode, demo_provider_name, demo_provider_province = demo_registered_providers[scheme_code]
    mock_policies = [] if citizen_id[-1] == "9" else [
        RegistryInsurancePolicy(
            policy_number_masked="LIFE-26-XXXX-1842",
            policy_type="LIFE",
            insurer_name="บริษัทประกันชีวิตตัวอย่าง จำกัด",
            plan_name="แผนคุ้มครองชีวิต แคร์ ซีเคียวร์",
            status="ACTIVE",
            effective_date=date(2024, 1, 1),
            expiry_date=date(2034, 12, 31),
            coverage_summary="ความคุ้มครองชีวิตตามเงื่อนไขกรมธรรม์จำลอง",
            sum_insured="500,000 บาท",
        ),
        RegistryInsurancePolicy(
            policy_number_masked="HEALTH-26-XXXX-7315",
            policy_type="HEALTH",
            insurer_name="บริษัทประกันสุขภาพตัวอย่าง จำกัด",
            plan_name="แผนสุขภาพเหมาจ่าย แคร์ พลัส",
            status="ACTIVE",
            effective_date=date(2026, 1, 1),
            expiry_date=date(2026, 12, 31),
            coverage_summary="ค่ารักษาผู้ป่วยในตามวงเงินและข้อยกเว้นของกรมธรรม์จำลอง",
            sum_insured="300,000 บาทต่อปี",
        ),
    ]

    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["Pragma"] = "no-cache"

    return MockRegistryResponse(
        request_id=f"RIGHT-DEMO-{uuid4().hex[:10].upper()}",
        checked_at=datetime.now(timezone.utc),
        endpoint="/api/v1/eligibility/registry/mock-lookup",
        person=RegistryPerson(
            citizen_id_masked=_mask_citizen_id(citizen_id),
            display_name=request.full_name.strip() or "ผู้ใช้งานตัวอย่าง",
            birth_date=request.birth_date,
        ),
        entitlement=RegistryEntitlement(
            scheme_code=scheme_code,
            scheme_name=scheme["name"],
            sub_scheme_code=scheme_code,
            sub_scheme_name=scheme["sub_name"],
            status="ACTIVE" if active else "REVIEW_REQUIRED",
            effective_date=date(date.today().year, 1, 1),
            expiry_date=None,
            primary_provider=RegistryProvider(
                hcode=demo_hcode if waiting_for_location else f"DEMO-{province_code}",
                name=(
                    demo_provider_name
                    if waiting_for_location
                    else f"{scheme['provider']} จังหวัด{request.registered_province}"
                ),
                province=demo_provider_province if waiting_for_location else request.registered_province,
            ),
            nhso_detail=(
                RegistryNhsoDetail(
                    health_card_number_masked="NHSO-XXXX-24060",
                    registered_province=demo_provider_province,
                    service_start_date=date(date.today().year, 1, 1),
                    sub_scheme_expiry_date=None,
                    primary_care_provider=RegistryProvider(
                        hcode="24060",
                        name="โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี",
                        province="นครราชสีมา",
                    ),
                    referral_provider=RegistryProvider(
                        hcode="24060",
                        name="โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี",
                        province="นครราชสีมา",
                    ),
                    provider_change_count=0,
                )
                if scheme_code == "UCS"
                else None
            ),
        ),
        gateways=[
            RegistryGatewayCheck(
                code=code,
                agency=agency,
                service=service,
                status="MATCHED" if code == matched_gateway else "NOT_FOUND",
                message=(
                    f"พบสิทธิจาก {agency} ในระบบสาธิต"
                    if code == matched_gateway
                    else f"ไม่พบสิทธิที่ใช้งานอยู่จาก {agency} ในรอบตรวจนี้"
                ),
                reference_url=reference_url,
            )
            for code, agency, service, reference_url in [
                ("NHSO", "สำนักงานหลักประกันสุขภาพแห่งชาติ", "ตรวจสิทธิหลักประกันสุขภาพ", "https://srmcitizen.nhso.go.th/"),
                ("SSO", "สำนักงานประกันสังคม", "ตรวจสถานะผู้ประกันตน", "https://eself.sso.go.th/"),
                ("CGD", "กรมบัญชีกลาง", "ตรวจสวัสดิการรักษาพยาบาลข้าราชการ", "https://www.cgd.go.th/"),
            ]
        ] + [
            RegistryGatewayCheck(
                code="OIC",
                agency="สำนักงาน คปภ.",
                service="ตรวจข้อมูลประกันภัยส่วนบุคคล",
                status="MATCHED" if mock_policies else "NOT_FOUND",
                message=(
                    f"พบกรมธรรม์จำลองที่มีผล {len(mock_policies)} ฉบับ"
                    if mock_policies
                    else "ไม่พบกรมธรรม์ที่มีผลในระบบสาธิต"
                ),
                reference_url="https://cit.oic.or.th/oicconnect.html",
            )
        ],
        private_policies=mock_policies,
        benefits=[
            RegistryBenefit(
                code=code,
                name=name,
                coverage="เป็นไปตามหลักเกณฑ์และข้อบ่งชี้ของหน่วยงานเจ้าของสิทธิ",
                status="ELIGIBLE" if active else "REVIEW_REQUIRED",
            )
            for code, name in scheme["benefits"]
        ],
        source=RegistrySource(
            system=f"ระบบเชื่อมต่อสิทธิสาธิต — {scheme['agency']}",
            response_basis="โครงสร้างกลางของ CarePulse อ้างอิงแนวคิดการเชื่อมต่อข้อมูลตรวจสิทธิภาครัฐ ไม่ใช่รูปแบบคำตอบจริงของหน่วยงาน",
            disclaimer="ข้อมูลทั้งหมดเป็นข้อมูลสาธิต ยังไม่เชื่อมฐานข้อมูลจริง และไม่มีการบันทึกเลขบัตรประชาชน",
        ),
    )


@router.post("/assess", response_model=AssessmentResultResponse)
async def assess_healthcare_rights(request: CitizenAssessmentRequest):
    """
    Evaluate citizen healthcare rights without persisting the request or result.
    Session continuity is handled only by the citizen's browser tab.
    """
    try:
        # Run calculation rules engine
        result = eligibility_engine.calculate_rights(request)
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
