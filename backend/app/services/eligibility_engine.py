import uuid
from datetime import datetime
from typing import List
from app.models.assessment import CitizenAssessmentRequest, AssessmentResultResponse, HealthcareRightDetail
from app.core.pdpa_masking import pdpa_masker


class EligibilityEngine:
    """
    Core business logic engine for calculating Thai Healthcare Rights & Benefits
    (UC, SSO, CSMBS, Elderly care, Disability, Emergency UCEP).
    """

    @staticmethod
    def calculate_rights(request: CitizenAssessmentRequest) -> AssessmentResultResponse:
        assessment_id = f"EVAL-{uuid.uuid4().hex[:8].upper()}"
        additional_rights: List[HealthcareRightDetail] = []
        recommendations: List[str] = []

        # 1. Primary Scheme Detection based on employment/status
        if request.occupation_status == "gov_employee":
            primary_right = HealthcareRightDetail(
                scheme_code="CSMBS",
                scheme_name="สิทธิสวัสดิการรักษาพยาบาลข้าราชการ",
                is_eligible=True,
                coverage_summary="ครอบคลุมการรักษาพยาบาล ค่ายา ค่าห้อง ค่าผ่าตัด ในสถานพยาบาลของรัฐเต็มจำนวน",
                free_items=["การตรวจรักษาโรคทั่วไป/เฉพาะทาง", "ยารักษาโรคในและนอกบัญชียาหลัก (ตามเกณฑ์)", "ค่าห้องผู้ป่วยสามัญ"],
                co_pay_items=["ค่าห้องพิเศษส่วนเกิน", "ยานอกบัญชีบางรายการที่ไม่มีข้อบ่งชี้"],
                how_to_use="ใช้บัตรประจำตัวประชาชนตรวจสอบสิทธิเบิกจ่ายตรง ณ โรงพยาบาลของรัฐ",
                hospital_network="โรงพยาบาลรัฐทุกแห่งทั่วประเทศ และ รพ.เอกชนกรณีฉุกเฉินวิกฤต"
            )
            recommendations.append("ลงทะเบียนจ่ายตรง ณ สถานพยาบาลที่ท่านเข้ารับการรักษาเป็นประจำเพื่อความสะดวกรวดเร็ว")
        
        elif request.occupation_status in ["private_employee", "sso_m33", "sso_m39"]:
            primary_right = HealthcareRightDetail(
                scheme_code="SSO",
                scheme_name="สิทธิประกันสังคม (กองทุนประกันสังคม)",
                is_eligible=True,
                coverage_summary="ครอบคลุมการรักษาพยาบาล ณ โรงพยาบาลคู่สัญญาตามสิทธิ และสิทธิประโยชน์กรณีอื่นๆ",
                free_items=["การตรวจรักษาและค่ายาทุกโรค ณ รพ. ตามบัตรรับรองสิทธิ", "ทันตกรรม 900 บาท/ปี โดยไม่ต้องสำรองจ่าย", "คลอดบุตร และเงินสงเคราะห์บุตร"],
                co_pay_items=["การรักษานอกโรงพยาบาลตามสิทธิ (ยกเว้นกรณีฉุกเฉิน)", "ทันตกรรมส่วนเกิน 900 บาท"],
                how_to_use="ยื่นบัตรประชาชน ณ แผนกเวชระเบียน โรงพยาบาลตามสิทธิประกันสังคม",
                hospital_network="โรงพยาบาลหลักตามที่เลือกไว้ในบัตรรับรองสิทธิ"
            )
            recommendations.append("อย่าลืมใช้สิทธิทำฟันฟรี 900 บาท/ปี ภายในวันที่ 31 ธันวาคมของทุกปี")
        
        else: # freelance, unemployed, general citizen
            primary_right = HealthcareRightDetail(
                scheme_code="UC",
                scheme_name="สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาทรักษาทุกที่)",
                is_eligible=True,
                coverage_summary="ครอบคลุมการรักษาพยาบาล ค่ายา การผ่าตัด และการดูแลส่งเสริมสุขภาพฟรี",
                free_items=["การรักษาพยาบาลทุกโรคตามมาตรฐาน", "ยาในบัญชียาหลักแห่งชาติ", "บริการส่งเสริมสุขภาพและป้องกันโรค", "รับยาใกล้บ้านที่ร้านยาคุณภาพ"],
                co_pay_items=["ยานอกบัญชียาหลักแห่งชาติที่ไม่ตรงข้อบ่งชี้", "ค่าห้องพิเศษ"],
                how_to_use="ใช้บัตรประชาชนใบเดียว เข้ารับบริการที่หน่วยบริการปฐมภูมิ/ประจำตามสิทธิ หรือเครือข่าย 30 บาทรักษาทุกที่",
                hospital_network="หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และโรงพยาบาลประจำเขต"
            )
            recommendations.append("ท่านสามารถใช้บริการ '30 บาทรักษาทุกที่' ณ หน่วยบริการปฐมภูมิและร้านยาที่ร่วมโครงการ")

        # 2. Additional Benefits Check (Elderly >= 60)
        if request.age >= 60:
            additional_rights.append(
                HealthcareRightDetail(
                    scheme_code="ELDERLY_BENEFIT",
                    scheme_name="สิทธิประโยชน์สำหรับผู้สูงอายุ (60 ปีขึ้นไป)",
                    is_eligible=True,
                    coverage_summary="สิทธิบริการช่องทางด่วน คลินิกผู้สูงอายุ และการตรวจคัดกรองสุขภาพเชิงรุก",
                    free_items=["ผ้าอ้อมผู้ใหญ่และแผ่นรองซับ (ตามเกณฑ์ประเมิน ADL)", "แว่นสายตาผู้สูงอายุ", "วัคซีนไข้หวัดใหญ่ประจำปีฟรี"],
                    co_pay_items=[],
                    how_to_use="ติดต่อคลินิกผู้สูงอายุ หรือ รพ.สต./ศูนย์บริการสาธารณสุขใกล้บ้าน",
                    hospital_network="ศูนย์บริการสาธารณสุข รพ.สต. และ รพ.รัฐทุกแห่ง"
                )
            )
            recommendations.append("ผู้สูงอายุตั้งแต่ 60 ปีขึ้นไป สามารถรับการตรวจคัดกรองภาวะสมองเสื่อม และรับวัคซีนไข้หวัดใหญ่ฟรีทุกปี")

        # 3. Additional Benefits Check (Disability)
        if request.has_disability_card:
            additional_rights.append(
                HealthcareRightDetail(
                    scheme_code="DISABILITY_CARE",
                    scheme_name="สิทธิคนพิการ (ท.74 / ฟื้นฟูสมรรถภาพ)",
                    is_eligible=True,
                    coverage_summary="รับการฟื้นฟูสมรรถภาพและกายอุปกรณ์ฟรีตลอดชีพ",
                    free_items=["กายอุปกรณ์ เช่น รถเข็น ไม้เท้า ขาเทียม", "กายภาพบำบัดและกิจกรรมบำบัด", "เบี้ยความพิการรายเดือน"],
                    co_pay_items=[],
                    how_to_use="แสดงสมุดประจำตัวคนพิการคู่กับบัตรประชาชน",
                    hospital_network="สถานพยาบาลของรัฐทุกระดับ"
                )
            )

        # 4. Emergency Policy UCEP Alert
        if request.urgency_level == "emergency":
            recommendations.insert(0, "🚨 กรณีเจ็บป่วยฉุกเฉินวิกฤต สามารถใช้สิทธิ UCEP เข้ารักษาได้ทุกโรงพยาบาลทั้งรัฐและเอกชน ฟรี 72 ชั่วโมงแรก โทร 1669")

        masked_citizen_id = pdpa_masker.mask_thai_citizen_id(request.citizen_id) if request.citizen_id else "ไม่ระบุ"

        return AssessmentResultResponse(
            assessment_id=assessment_id,
            assessed_at=datetime.utcnow(),
            patient_summary={
                "citizen_id_masked": masked_citizen_id,
                "age": request.age,
                "occupation_status": request.occupation_status,
                "registered_province": request.registered_province,
                "urgency_level": request.urgency_level
            },
            primary_right=primary_right,
            additional_rights=additional_rights,
            recommendations=recommendations,
            pdpa_protected=True
        )


eligibility_engine = EligibilityEngine()
