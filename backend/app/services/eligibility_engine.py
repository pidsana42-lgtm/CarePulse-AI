import uuid
from datetime import datetime
from typing import List, Dict, Any
from app.models.assessment import (
    CitizenAssessmentRequest,
    AssessmentResultResponse,
    HealthcareRightDetail,
    CostPlanningSummary,
    OfficialReference
)
from app.core.pdpa_masking import pdpa_masker
from app.services.cost_engine import compute_cost_planning


class EligibilityEngine:
    """
    CarePulse Multi-Agency Welfare & Healthcare Rules Engine with Legal Citations.
    """

    @staticmethod
    def calculate_rights(request: CitizenAssessmentRequest) -> AssessmentResultResponse:
        assessment_id = f"EVAL-{uuid.uuid4().hex[:8].upper()}"
        additional_rights: List[HealthcareRightDetail] = []
        recommendations: List[str] = []
        participating_agencies: List[str] = []
        all_references: List[OfficialReference] = []
        total_equipment_count = 0

        # Check conditions
        is_bedridden = any(c in ["ติดเตียง", "ติดบ้าน", "อัมพฤกษ์", "อัมพาต", "bedridden", "stroke"] for c in [cond.lower() for cond in request.chronic_conditions])

        # ------------------------------------------------------------------
        # 1. Primary Scheme Detection
        # ------------------------------------------------------------------
        if request.occupation_status == "gov_employee":
            participating_agencies.append("กรมบัญชีกลาง กระทรวงการคลัง")
            ref = OfficialReference(
                title="พระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล พ.ศ. 2553",
                legal_act="พ.ร.ฎ. เงินสวัสดิการรักษาพยาบาลข้าราชการ พ.ศ. 2553 และหนังสือเวียนกรมบัญชีกลาง",
                agency="กรมบัญชีกลาง กระทรวงการคลัง",
                url="https://www.cgd.go.th"
            )
            all_references.append(ref)
            primary_right = HealthcareRightDetail(
                scheme_code="CSMBS",
                scheme_name="สิทธิสวัสดิการรักษาพยาบาลข้าราชการ",
                responsible_agency="กรมบัญชีกลาง กระทรวงการคลัง",
                contact_channel="โทร 02-270-6400 หรือ แผนกสิทธิประโยชน์ ณ รพ.รัฐทุกแห่ง",
                is_eligible=True,
                coverage_summary="ครอบคลุมการรักษาพยาบาล ค่ายา ค่าห้อง ค่าผ่าตัด ในสถานพยาบาลของรัฐเต็มจำนวน ครอบคลุมถึงบิดามารดา คู่สมรส และบุตร",
                free_items=[
                    "การตรวจรักษาโรคทั่วไปและโรคเฉพาะทาง ณ รพ.รัฐ",
                    "ยารักษาโรคในบัญชีและนอกบัญชียาหลัก (กรณีแพทย์รับรองความจำเป็น)",
                    "ค่าห้องผู้ป่วยสามัญ และค่าผ่าตัดเต็มจำนวน",
                    "การตรวจวินิจฉัยพิเศษ (MRI, CT Scan) ตามข้อบ่งชี้"
                ],
                co_pay_items=[
                    "ค่าห้องพิเศษส่วนเกินเพดานที่กรมบัญชีกลางกำหนด",
                    "ยานอกบัญชียาหลักที่ไม่มีข้อบ่งชี้ทางการแพทย์จำเป็น"
                ],
                eligible_equipment=[
                    "อุปกรณ์และอวัยวะเทียมในการบำบัดรักษาโรคตามเกณฑ์กรมบัญชีกลาง",
                    "เครื่องกระตุกหัวใจ / ข้อเข่าเทียม / เลนส์แก้วตาเทียม"
                ],
                estimated_coverage_value="ประหยัดค่ารักษาได้ 100% ตามระเบียบราชการ (ประมาณ 50,000 - 300,000+ บาท/ปี)",
                estimated_out_of_pocket="0 บาท สำหรับการรักษาและยาตามสิทธิ (จ่ายเฉพาะค่าห้องพิเศษส่วนเกิน)",
                official_references=[ref],
                how_to_use="ใช้บัตรประจำตัวประชาชนตรวจสอบสิทธิเบิกจ่ายตรง ณ แผนกเวชระเบียน โรงพยาบาลของรัฐ",
                hospital_network="โรงพยาบาลรัฐทุกแห่งทั่วประเทศ และ รพ.เอกชนกรณีเจ็บป่วยฉุกเฉินวิกฤต (UCEP)"
            )
            recommendations.append("ลงทะเบียนจ่ายตรง ณ สถานพยาบาลที่เข้ารับการรักษาประจำ เพื่อไม่ต้องสำรองจ่ายเงินสด")

        elif request.occupation_status in ["private_employee", "sso_m33", "sso_m39"]:
            participating_agencies.append("สำนักงานประกันสังคม (สปส.)")
            ref = OfficialReference(
                title="พระราชบัญญัติประกันสังคม พ.ศ. 2533 และประกาศคณะกรรมการการแพทย์เรื่องทันตกรรม",
                legal_act="พ.ร.บ. ประกันสังคม พ.ศ. 2533 มาตรา 63 (ประโยชน์ทดแทนกรณีเจ็บป่วย) และ มาตรา 77",
                agency="สำนักงานประกันสังคม กระทรวงแรงงาน",
                url="https://www.sso.go.th"
            )
            all_references.append(ref)
            primary_right = HealthcareRightDetail(
                scheme_code="SSO",
                scheme_name="สิทธิประกันสังคม (กองทุนประกันสังคม ม.33 / ม.39)",
                responsible_agency="สำนักงานประกันสังคม กระทรวงแรงงาน",
                contact_channel="สายด่วนประกันสังคม 1506 (ตลอด 24 ชั่วโมง) หรือ สำนักงานประกันสังคมพื้นที่",
                is_eligible=True,
                coverage_summary="ครอบคลุมการตรวจรักษาพยาบาลและผ่าตัดทุกโรค ณ โรงพยาบาลตามสิทธิ พร้อมสิทธิประโยชน์เงินทดแทนการขาดรายได้",
                free_items=[
                    "การตรวจรักษา ค่ายา ค่าห้อง และการผ่าตัด ณ รพ. ตามบัตรรับรองสิทธิ",
                    "ทันตกรรม 900 บาท/ปี (ขูดหินปูน อุดฟัน ถอนฟัน) ไม่ต้องสำรองจ่ายในคลินิกคู่สัญญา",
                    "เงินสงเคราะห์การหยุดงานเพื่อการคลอดบุตร และค่าคลอดบุตรเหมาจ่าย 15,000 บาท",
                    "ฟอกไต ล้างไต และการปลูกถ่ายอวัยวะตามเกณฑ์มาตรฐาน"
                ],
                co_pay_items=[
                    "การรักษานอกโรงพยาบาลตามสิทธิ (ยกเว้นกรณีฉุกเฉินวิกฤต UCEP)",
                    "ทันตกรรมส่วนเกิน 900 บาท/ปี"
                ],
                eligible_equipment=[
                    "กายอุปกรณ์เทียมสำหรับผู้ประกันตนที่สูญเสียอวัยวะหรือทุพพลภาพ",
                    "เงินทดแทนการขาดรายได้กรณีทุพพลภาพ 50% ของค่าจ้างตลอดชีพ"
                ],
                estimated_coverage_value="ประหยัดค่ารักษาพยาบาลได้เฉลี่ย 30,000 - 150,000+ บาท/ปี",
                estimated_out_of_pocket="0 บาท เมื่อเข้ารักษาที่โรงพยาบาลตามสิทธิ",
                official_references=[ref],
                how_to_use="ยื่นบัตรประจำตัวประชาชน ณ แผนกเวชระเบียน โรงพยาบาลคู่สัญญาตามสิทธิประกันสังคม",
                hospital_network="โรงพยาบาลหลักตามที่เลือกไว้ในบัตรรับรองสิทธิ และเครือข่ายส่งต่อ"
            )
            recommendations.append("อย่าลืมใช้สิทธิทันตกรรมฟรี 900 บาท/ปี ภายในวันที่ 31 ธันวาคมของทุกปี")

        else: # บัตรทอง 30 บาท
            participating_agencies.append("สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)")
            ref = OfficialReference(
                title="พระราชบัญญัติหลักประกันสุขภาพแห่งชาติ พ.ศ. 2545 และนโยบาย 30 บาทรักษาทุกที่",
                legal_act="พ.ร.บ. หลักประกันสุขภาพแห่งชาติ พ.ศ. 2545 มาตรา 5 (บุคคลทุกคนมีสิทธิได้รับบริการสาธารณสุขที่ได้มาตรฐาน)",
                agency="สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
                url="https://www.nhso.go.th"
            )
            all_references.append(ref)
            primary_right = HealthcareRightDetail(
                scheme_code="UC",
                scheme_name="สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาทรักษาทุกที่)",
                responsible_agency="สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
                contact_channel="สายด่วน สปสช. 1330 (โทรฟรีตลอด 24 ชม.) หรือ ไลน์ @nhso",
                is_eligible=True,
                coverage_summary="ครอบคลุมการรักษาพยาบาลทุกโรค ค่ายาในบัญชียาหลัก การผ่าตัด และนวัตกรรม 30 บาทรักษาทุกที่ด้วยบัตรประชาชนใบเดียว",
                free_items=[
                    "การรักษาพยาบาลทุกโรคตามมาตรฐาน และยาในบัญชียาหลักแห่งชาติ",
                    "บริการรับยาใกล้บ้านที่ร้านยาคุณภาพ และคลินิกพยาบาลชุมชนอบอุ่น",
                    "การตรวจคัดกรองมะเร็งปากมดลูก มะเร็งลำไส้ใหญ่ และวัคซีนพื้นฐานฟรี",
                    "การรักษาโรคราคาสูง: ฟอกไต ล้างไตฟรี, เคมีบำบัดรักษาโรคมะเร็ง (Cancer Anywhere)"
                ],
                co_pay_items=[
                    "ยานอกบัญชียาหลักแห่งชาติที่ไม่มีข้อบ่งชี้ทางการแพทย์",
                    "ค่าห้องพิเศษส่วนเกินนอกเหนือจากห้องสามัญ"
                ],
                eligible_equipment=[
                    "แว่นสายตาสำหรับเด็กและผู้สูงอายุ (ตามเกณฑ์คัดกรอง)",
                    "กายอุปกรณ์ฟื้นฟูสมรรถภาพเบื้องต้นผ่าน รพ.สต. และคลินิกชุมชน"
                ],
                estimated_coverage_value="ประหยัดค่ารักษาพยาบาลได้เฉลี่ย 25,000 - 200,000+ บาท/ปี",
                estimated_out_of_pocket="0 บาท (ไม่มีค่าใช้จ่ายในหน่วยบริการปฐมภูมิและเครือข่ายบัตรทอง)",
                official_references=[ref],
                how_to_use="ใช้บัตรประชาชนใบเดียว เข้ารับบริการที่หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น หรือ รพ.สต. ใกล้บ้าน",
                hospital_network="หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น ร้านยาคุณภาพ และโรงพยาบาลประจำเขต"
            )
            recommendations.append("ท่านสามารถใช้บริการ '30 บาทรักษาทุกที่' ณ หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และร้านยาคุณภาพใกล้บ้านได้ทันที")

        # ------------------------------------------------------------------
        # 2. กองทุนสุขภาพตำบล (กปท.) & LTC ผ้าอ้อมผู้ใหญ่
        # ------------------------------------------------------------------
        if request.age >= 60 or is_bedridden:
            participating_agencies.append("กองทุนหลักประกันสุขภาพระดับท้องถิ่น (กองทุนสุขภาพตำบล/อปท.)")
            total_equipment_count += 3
            ref_ltc = OfficialReference(
                title="ประกาศคณะกรรมการหลักประกันสุขภาพแห่งชาติ เรื่อง การสนับสนุนผ้าอ้อมผู้ใหญ่และแผ่นรองซับผ่าน กปท.",
                legal_act="ประกาศ สปสช. เรื่อง หลักเกณฑ์การดำเนินงานและการบริหารจัดการกองทุนหลักประกันสุขภาพท้องถิ่น ข้อ 7(2)",
                agency="สปสช. ร่วมกับ กรมส่งเสริมการปกครองท้องถิ่น (สถ.)",
                url="https://localhealth.nhso.go.th"
            )
            all_references.append(ref_ltc)
            additional_rights.append(
                HealthcareRightDetail(
                    scheme_code="LOCAL_HEALTH_FUND_LTC",
                    scheme_name="สิทธิกองทุนสุขภาพตำบล & การดูแลระยะยาวผู้มีภาวะพึ่งพิง (LTC)",
                    responsible_agency="องค์กรปกครองส่วนท้องถิ่น (อบต. / เทศบาล) ร่วมกับ สปสช.",
                    contact_channel="กองสาธารณสุข อบต./เทศบาล ในพื้นที่ หรือ รพ.สต./ศูนย์บริการสาธารณสุขใกล้บ้าน",
                    is_eligible=True,
                    coverage_summary="สิทธิเบิกรับผ้าอ้อมผู้ใหญ่ แผ่นรองซับ กายอุปกรณ์ และมีผู้จัดการดูแล (Care Manager) พร้อมผู้ช่วยเหลือดูแล (Caregiver) เยี่ยมบ้านฟรี",
                    free_items=[
                        "ผ้าอ้อมผู้ใหญ่และแผ่นรองซับการขับถ่าย ฟรีไม่เกิน 3 ชิ้น/วัน (ตามเกณฑ์ ADL <= 11)",
                        "ทีมผู้ช่วยเหลือดูแลผู้สูงอายุ (Caregiver) ลงพื้นที่ดูแลสุขภาพและกายภาพที่บ้าน",
                        "บริการตรวจประเมินภาวะสมองเสื่อม ภาวะหกล้ม และคัดกรองสุขภาพเชิงรุกถึงบ้าน"
                    ],
                    co_pay_items=[],
                    eligible_equipment=[
                        "ผ้าอ้อมผู้ใหญ่สำเร็จรูปและแผ่นเสริมซับ (เบิกได้ต่อเนื่องทุกเดือน)",
                        "ที่นอนลมป้องกันแผลกดทับ (ยืมคืนผ่านศูนย์ยืมอุปกรณ์ชุมชน)",
                        "สายยางให้อาหารและสายสวนปัสสาวะพร้อมชุดทำแผล"
                    ],
                    estimated_coverage_value="ประหยัดค่าผ้าอ้อมและอุปกรณ์ดูแลได้ประมาณ 12,000 - 25,000 บาท/ปี",
                    estimated_out_of_pocket="0 บาท (สนับสนุนโดยงบประมาณกองทุนสุขภาพตำบล 100%)",
                    official_references=[ref_ltc],
                    how_to_use="ให้ญาติหรือผู้ดูแลนำบัตรประชาชนและประวัติการรักษาติดต่อ อบต./เทศบาล หรือ รพ.สต. ในพื้นที่เพื่อประเมินคะแนน ADL",
                    hospital_network="รพ.สต., ศูนย์บริการสาธารณสุข, อบต., เทศบาล และ รพ.ชุมชนประจำอำเภอ"
                )
            )
            recommendations.append("ผู้สูงอายุ/ผู้มีภาวะกลั้นปัสสาวะไม่อยู่ สามารถติดต่อ อบต./เทศบาล หรือ รพ.สต. เพื่อขอรับ 'ผ้าอ้อมผู้ใหญ่ฟรีวันละไม่เกิน 3 ชิ้น'")

        # ------------------------------------------------------------------
        # 3. กระทรวง พม. (กายอุปกรณ์ / คนพิการ / เตียงผู้ป่วย)
        # ------------------------------------------------------------------
        if request.has_disability_card or request.age >= 60:
            participating_agencies.append("กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.)")
            total_equipment_count += 4
            ref_msdhs = OfficialReference(
                title="พระราชบัญญัติส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550 และระเบียบการจัดสรรกายอุปกรณ์",
                legal_act="พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550 มาตรา 20 (สิทธิกายอุปกรณ์และการปรับสภาพบ้าน)",
                agency="กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ กระทรวง พม.",
                url="https://dep.go.th"
            )
            all_references.append(ref_msdhs)

            disability_items = [
                "เบี้ยความพิการรายเดือน 800 - 1,000 บาท/เดือน",
                "สิทธิกู้ยืมเงินทุนประกอบอาชีพคนพิการปลอดดอกเบี้ย สูงสุด 120,000 บาท",
                "บริการผู้ช่วยคนพิการ (Personal Assistant) และปรับสภาพแวดล้อมที่อยู่อาศัย (หลังละไม่เกิน 40,000 บาท)"
            ] if request.has_disability_card else [
                "เบี้ยยังชีพผู้สูงอายุแบบขั้นบันได 600 - 1,000 บาท/เดือน",
                "เงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก",
                "การปรับปรุงซ่อมแซมบ้านผู้สูงอายุที่มีฐานะยากจน (หลังละไม่เกิน 40,000 บาท)"
            ]

            equipment_items = [
                "รถเข็นนั่งคนพิการ (Wheelchair) ทั้งแบบธรรมดาและปรับนอนได้",
                "เตียงผู้ป่วยปรับระดับสำหรับผู้ป่วยติดเตียง",
                "เครื่องผลิตออกซิเจน (Oxygen Concentrator) และเครื่องดูดเสมหะ",
                "ไม้เท้า 3 ขา / 4 ขา, วอล์คเกอร์หัดเดิน และขาเทียม/แขนเทียม"
            ]

            additional_rights.append(
                HealthcareRightDetail(
                    scheme_code="MSDHS_WELFARE",
                    scheme_name="สิทธิสวัสดิการและกายอุปกรณ์ กระทรวง พม. (พม. / กรมส่งเสริมและพัฒนาคุณภาพชีวิต)",
                    responsible_agency="สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัด (พมจ.) และ อปท.",
                    contact_channel="ศูนย์ช่วยเหลือสังคม สายด่วน พม. 1300 (โทรฟรีตลอด 24 ชั่วโมง) หรือ พมจ. ประจำจังหวัด",
                    is_eligible=True,
                    coverage_summary="สิทธิขอรับกายอุปกรณ์การแพทย์ เงินสงเคราะห์เยียวยา และการปรับสภาพแวดล้อมบ้านให้ปลอดภัยสำหรับผู้สูงอายุและคนพิการ",
                    free_items=disability_items,
                    co_pay_items=[],
                    eligible_equipment=equipment_items,
                    estimated_coverage_value="มูลค่าสวัสดิการและกายอุปกรณ์รวมประมาณ 30,000 - 160,000 บาท",
                    estimated_out_of_pocket="0 บาท (รัฐบาลสนับสนุนผ่านกองทุน พม.)",
                    official_references=[ref_msdhs],
                    how_to_use="ยื่นเอกสารบัตรประชาชน สมุดประจำตัวคนพิการ (ถ้ามี) และใบรับรองแพทย์ ณ สำนักงาน พมจ. หรือ อบต./เทศบาล",
                    hospital_network="ศูนย์บริการคนพิการจังหวัด, สำนักงาน พมจ., และโรงพยาบาลศูนย์ประจำจังหวัด"
                )
            )
            recommendations.append("หากต้องการเบิกขอรับ 'เตียงผู้ป่วย รถเข็น หรือเครื่องผลิตออกซิเจน' สามารถประสานงานผ่านสายด่วน พม. 1300 หรือ รพ.สต. ใกล้บ้านได้ทันที")

        # ------------------------------------------------------------------
        # 4. Emergency Policy UCEP
        # ------------------------------------------------------------------
        if request.urgency_level in ["emergency", "urgent"]:
            participating_agencies.append("สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ. 1669)")
            ref_ucep = OfficialReference(
                title="นโยบายเจ็บป่วยฉุกเฉินวิกฤต มีสิทธิทุกที่ (UCEP 72 ชั่วโมง)",
                legal_act="พ.ร.บ. การแพทย์ฉุกเฉิน พ.ศ. 2551 และ มติคณะรัฐมนตรีว่าด้วยสิทธิ UCEP",
                agency="สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)",
                url="https://niems.go.th"
            )
            all_references.append(ref_ucep)
            recommendations.insert(0, "กรณีเจ็บป่วยฉุกเฉินวิกฤตถึงแก่ชีวิต (หมดสติ แน่นหน้าอก หายใจไม่ออก) ใช้สิทธิ UCEP เข้ารักษาได้ทุก รพ. ทั้งรัฐและเอกชน ฟรี 72 ชม. แรก โทร 1669 ทันที")

        # ------------------------------------------------------------------
        # 5. Private Insurance — Combined Benefit Calculation
        # ------------------------------------------------------------------
        if getattr(request, 'has_private_insurance', False):
            ins_type = getattr(request, 'private_insurance_type', 'health') or 'health'
            ins_provider = getattr(request, 'private_insurance_provider', '') or 'บริษัทประกันเอกชน'
            ins_limit = getattr(request, 'private_insurance_annual_limit', None)

            ins_type_label = {
                'life': 'ประกันชีวิต',
                'health': 'ประกันสุขภาพเอกชน',
                'both': 'ประกันชีวิต + ประกันสุขภาพเอกชน',
            }.get(ins_type, 'ประกันเอกชน')

            limit_str = f"{ins_limit:,} บาท/ปี" if ins_limit else "ตามกรมธรรม์"

            free_items_ins = [
                f"ค่ารักษาพยาบาลส่วนเกินวงเงินสิทธิรัฐ ชดเชยโดย {ins_provider} สูงสุด {limit_str}",
            ]
            if ins_type in ('life', 'both'):
                free_items_ins += [
                    "เงินชดเชยรายได้ระหว่างนอนรักษาตัวใน รพ. (ถ้ากรมธรรม์กำหนด)",
                    "เงินประกันชีวิต / ทุพพลภาพถาวร ตามกรมธรรม์",
                ]
            if ins_type in ('health', 'both'):
                free_items_ins += [
                    "ค่าห้องพิเศษ / ค่าห้อง ICU ส่วนเกินที่สิทธิรัฐไม่ครอบคลุม",
                    "ค่ายานอกบัญชียาหลัก ที่แพทย์สั่ง (ถ้ากรมธรรม์ครอบคลุม)",
                    "ค่าผ่าตัดและค่าแพทย์ส่วนเกินในโรงพยาบาลเอกชน",
                ]

            participating_agencies.append(f"บริษัทประกัน: {ins_provider}")
            additional_rights.append(
                HealthcareRightDetail(
                    scheme_code="PRIVATE_INS",
                    scheme_name=f"{ins_type_label} ({ins_provider})",
                    responsible_agency=ins_provider,
                    contact_channel=f"ติดต่อ {ins_provider} โดยตรง หรือสายด่วน คปภ. 1186",
                    is_eligible=True,
                    coverage_summary=(
                        f"ประกันเอกชน {ins_type_label} จาก {ins_provider} ใช้ควบคู่กับสิทธิรัฐได้ "
                        f"ครอบคลุมค่าใช้จ่ายที่สิทธิรัฐไม่ครอบคลุม เช่น ห้องพิเศษ ยานอกบัญชี และโรงพยาบาลเอกชน "
                        f"วงเงินสูงสุด {limit_str}"
                    ),
                    free_items=free_items_ins,
                    co_pay_items=["ค่าใช้จ่ายเกินวงเงินกรมธรรม์ — ต้องชำระส่วนต่างเอง"],
                    eligible_equipment=[],
                    estimated_coverage_value=f"วงเงิน {limit_str} (ตามกรมธรรม์ {ins_provider})",
                    estimated_out_of_pocket="ตามเงื่อนไขและข้อยกเว้นในกรมธรรม์",
                    official_references=[
                        OfficialReference(
                            title="สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย (คปภ.)",
                            legal_act="พ.ร.บ. ประกันชีวิต พ.ศ. 2535 และ พ.ร.บ. ประกันวินาศภัย พ.ศ. 2535",
                            agency="สำนักงาน คปภ.",
                            url="https://www.oic.or.th"
                        )
                    ],
                    how_to_use=(
                        "1) แจ้งโรงพยาบาลว่ามีประกันเอกชน รับ Claim Form จากพยาบาล "
                        "2) ส่งเอกสาร (ใบรับรองแพทย์ ใบเสร็จ) ให้บริษัทประกัน ภายใน 30 วัน "
                        "3) กรณีเร่งด่วน โทรสายด่วน คปภ. 1186 เพื่อรับคำแนะนำ"
                    ),
                    hospital_network=f"โรงพยาบาลในเครือข่าย {ins_provider} (ดูรายชื่อในแอปหรือเว็บของบริษัท)"
                )
            )
            recommendations.append(
                f"คุณมีประกันเอกชน ({ins_type_label}) จาก {ins_provider} — "
                f"ใช้ควบคู่กับสิทธิรัฐเพื่อครอบคลุม ค่าห้องพิเศษ ยานอกบัญชี และโรงพยาบาลเอกชนได้ "
                f"ควรตรวจสอบ Claim Process กับ {ins_provider} โดยตรง หรือโทร คปภ. 1186"
            )

        masked_citizen_id = pdpa_masker.mask_thai_citizen_id(request.citizen_id) if request.citizen_id else "ไม่ได้ระบุ"

        participating_agencies = list(dict.fromkeys(participating_agencies))

        grounded_cost = compute_cost_planning(
            registered_province=request.registered_province,
            occupation_status=request.occupation_status,
            extra_equipment_count=total_equipment_count,
            participating_agencies=participating_agencies,
        )
        cost_planning = CostPlanningSummary(
            total_estimated_benefit_value=grounded_cost["total_estimated_benefit_value"],
            estimated_out_of_pocket=grounded_cost["estimated_out_of_pocket"],
            eligible_equipment_count=total_equipment_count,
            participating_agencies=participating_agencies
        )

        return AssessmentResultResponse(
            assessment_id=assessment_id,
            assessed_at=datetime.utcnow(),
            patient_summary={
                "citizen_id_masked": masked_citizen_id,
                "age": request.age,
                "occupation_status": request.occupation_status,
                "registered_province": request.registered_province,
                "urgency_level": request.urgency_level,
                "chronic_conditions": request.chronic_conditions
            },
            primary_right=primary_right,
            additional_rights=additional_rights,
            cost_planning=cost_planning,
            all_official_references=all_references,
            recommendations=recommendations,
            pdpa_protected=True
        )


eligibility_engine = EligibilityEngine()
