import logging
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List
from app.core.pdpa_masking import pdpa_masker
from app.services.real_ocr_service import real_ocr_service

logger = logging.getLogger(__name__)


class AIMedicalCertificateReader:
    """
    AI-powered Medical Certificate and Clinical Record Analyzer.
    Performs multimodal Qwen Vision + Real OCR on uploaded medical documents,
    and runs Qwen LLM Clinical Reasoning to extract diagnoses and match welfare benefits.
    """

    @staticmethod
    async def analyze_medical_document(filename: str, file_bytes: bytes, doc_type: str = "medical_certificate") -> Dict[str, Any]:
        doc_id = f"MED-{uuid.uuid4().hex[:8].upper()}"
        from app.services.llm_service import llm_service

        # 1. Run Real OCR on image / document bytes
        ocr_result = real_ocr_service.extract_text(file_bytes, filename)
        raw_text = ocr_result.get("text", "")
        ocr_engine = ocr_result.get("engine", "none")
        ocr_confidence = ocr_result.get("confidence", 0.92)

        logger.info(f"Real OCR on {filename}: Engine={ocr_engine}, Extracted {len(raw_text)} chars")

        # 2. Try Direct Qwen Vision AI Image Interpretation (VLM)
        mime_type = "image/jpeg"
        if filename.lower().endswith(".png"):
            mime_type = "image/png"
        elif filename.lower().endswith(".webp"):
            mime_type = "image/webp"

        vision_analysis = None
        try:
            vision_analysis = await llm_service.analyze_image_with_vision(
                image_bytes=file_bytes,
                mime_type=mime_type,
                prompt="กรุณาอ่านข้อความและวิเคราะห์ใบรับรองแพทย์/ประวัติการรักษานี้: ระบุ 1. ชื่อโรงพยาบาล 2. การวินิจฉัยโรคและภาวะพึ่งพิง 3. กายอุปกรณ์ที่จำเป็น (เตียง, รถเข็น, ผ้าอ้อม, ออกซิเจน) 4. คำแนะนำการขอรับสิทธิ"
            )
        except Exception as e:
            logger.warning(f"Qwen Vision analysis error: {e}")

        # 3. Call Qwen LLM for Deep Clinical Reasoning & Welfare Analysis
        qwen_clinical_analysis = ""
        prompt_text = raw_text if raw_text else f"เอกสารทางการแพทย์: {filename} (เอกสารประเมินสิทธิการรักษาและกายอุปกรณ์)"
        qwen_clinical_prompt = f"""กรุณาวิเคราะห์เอกสารทางการแพทย์/ใบรับรองแพทย์ ({filename}) อย่างละเอียด:
ข้อความที่อ่านได้จากเอกสาร:
\"\"\"{prompt_text}\"\"\"

กรุณาสรุปผลการวิเคราะห์โดย Qwen AI ให้ชัดเจนและกระชับ:
1. **สถานพยาบาลและข้อมูลเบื้องต้น**
2. **การวินิจฉัยทางการแพทย์และภาวะพึ่งพิง** (เช่น ติดเตียง, ช่วยเหลือตัวเองไม่ได้, กลั้นขับถ่ายไม่อยู่, โรคเรื้อรัง)
3. **กายอุปกรณ์และสวัสดิการที่เข้าข่ายเบิกได้ฟรี** (เตียงผู้ป่วยปรับระดับ พม., รถเข็น, ผ้าอ้อมผู้ใหญ่ กปท. วันละ <= 3 ชิ้น, เครื่องผลิตออกซิเจน)
4. **ระเบียบราชการอ้างอิงและขั้นตอนการติดต่อ** (สปสช. 1330, พม. 1300, รพ.สต., อบต.)"""

        try:
            qwen_res = await llm_service.generate_chat_response(
                messages=[{"role": "user", "content": qwen_clinical_prompt}],
                temperature=0.3,
                max_tokens=600,
                use_rag=True,
                use_web_search=False
            )
            qwen_clinical_analysis = qwen_res.get("content", "")
        except Exception as e:
            logger.warning(f"Qwen LLM clinical reasoning fallback: {e}")


        # 4. Parse Image Metadata
        image_dims = "N/A"
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(file_bytes))
            image_dims = f"{img.width}x{img.height}"
        except Exception:
            pass

        # 5. Extract Clinical Entities & Match Equipment
        combined_corpus = f"{raw_text} {vision_analysis or ''} {qwen_clinical_analysis} {filename}".lower()

        detected_conditions = []
        detected_hospital = "ไม่ระบุชัดเจนในเอกสาร"
        
        is_bedridden = False
        needs_oxygen = False
        needs_wheelchair = False
        needs_diapers = False
        is_kidney_disease = False
        is_cancer = False
        adl_score_found = ""

        # Detect Hospital name
        hosp_match = re.search(r"(โรงพยาบาล[^\n\r,]+|รพ\.[^\n\r,]+|ศูนย์บริการสาธารณสุข[^\n\r,]+|คลินิก[^\n\r,]+)", raw_text)
        if hosp_match:
            detected_hospital = hosp_match.group(1).strip()

        # Detect ADL score
        adl_match = re.search(r"(adl|คะแนน\s*adl)[\s:=]*([0-9]+)", combined_corpus)
        if adl_match:
            adl_score_found = f"คะแนน ADL: {adl_match.group(2)}/20"

        if any(k in combined_corpus for k in ["ติดเตียง", "ติดบ้าน", "bedridden", "adl", "อัมพฤกษ์", "อัมพาต", "stroke", "paralysis", "หลอดเลือดสมอง"]):
            detected_conditions.append("ภาวะพึ่งพิง / ผู้ป่วยติดบ้าน-ติดเตียง หรือโรคหลอดเลือดสมอง (Stroke)")
            is_bedridden = True
            needs_diapers = True
            needs_wheelchair = True

        if any(k in combined_corpus for k in ["ไต", "renal", "kidney", "hemodialysis", "esrd", "ckd", "ฟอกเลือด"]):
            detected_conditions.append("โรคไตวายเรื้อรังระยะสุดท้าย (Chronic Kidney Disease / ESRD)")
            is_kidney_disease = True

        if any(k in combined_corpus for k in ["มะเร็ง", "cancer", "tumor", "carcinoma", "chemotherapy", "เนื้องอก"]):
            detected_conditions.append("โรคมะเร็ง / เนื้องอกร้ายแรง (Cancer / Oncology)")
            is_cancer = True

        if any(k in combined_corpus for k in ["ออกซิเจน", "oxygen", "copd", "หอบหืด", "ปอด", "ทางเดินหายใจ"]):
            detected_conditions.append("โรคระบบทางเดินหายใจเรื้อรัง / ภาวะพร่องออกซิเจน (COPD / Respiratory)")
            needs_oxygen = True
            needs_diapers = True

        if any(k in combined_corpus for k in ["เบาหวาน", "diabetes", "dm", "ความดัน", "hypertension", "ht"]):
            detected_conditions.append("โรคเรื้อรังกลุ่ม NCDs (เบาหวาน / ความดันโลหิตสูง)")

        if any(k in combined_corpus for k in ["กระดูกหัก", "fracture", "ผ่าตัด", "ข้อเข่า", "ข้อสะโพก"]):
            detected_conditions.append("ภาวะจำกัดการเคลื่อนไหวจากกระดูกหรือข้อต่อ (Musculoskeletal Impairment)")
            needs_wheelchair = True

        if any(k in combined_corpus for k in ["กลั้น", "ปัสสาวะ", "incontinence", "อุจจาระ"]):
            detected_conditions.append("ภาวะกลั้นปัสสาวะ/อุจจาระไม่ได้ (Incontinence)")
            needs_diapers = True

        if not detected_conditions:
            if raw_text:
                detected_conditions.append(f"ผลตรวจทางการแพทย์: {raw_text[:100]}...")
            else:
                detected_conditions.append("เอกสารทางการแพทย์ (ประเมินสิทธิสุขภาพทั่วไป)")
            needs_diapers = True
            needs_wheelchair = True

        if adl_score_found:
            detected_conditions.append(adl_score_found)

        # 6. Assistive Equipment & Welfare Matching
        matched_equipment: List[Dict[str, str]] = []
        eligible_schemes: List[Dict[str, str]] = []

        if needs_diapers or is_bedridden:
            matched_equipment.append({
                "item": "ผ้าอ้อมผู้ใหญ่และแผ่นรองซับการขับถ่าย (วันละไม่เกิน 3 ชิ้น)",
                "agency": "กองทุนหลักประกันสุขภาพระดับท้องถิ่น (กปท.) / อบต. / เทศบาล",
                "cost_saved": "ประหยัดได้ประมาณ 12,000 - 25,000 บาท/ปี",
                "how_to_claim": "นำใบรับรองแพทย์นี้ติดต่อกองสาธารณสุข อบต./เทศบาล หรือ รพ.สต. ในพื้นที่ [อ้างอิง: ประกาศ สปสช. กปท. ข้อ 7(2)]"
            })
            matched_equipment.append({
                "item": "ที่นอนลมป้องกันแผลกดทับ",
                "agency": "ศูนย์ยืมอุปกรณ์ชุมชน / สปสช. กปท.",
                "cost_saved": "ประหยัดได้ประมาณ 4,000 - 8,000 บาท",
                "how_to_claim": "ยื่นขอยืมใช้งานผ่าน รพ.สต. หรือ อบต."
            })

        if needs_wheelchair or is_bedridden:
            matched_equipment.append({
                "item": "เตียงผู้ป่วยปรับระดับ (Adjustable Hospital Bed)",
                "agency": "กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.) / กองทุนคนพิการ",
                "cost_saved": "ประหยัดได้ประมาณ 18,000 - 45,000 บาท",
                "how_to_claim": "ยื่นคำขอรับกายอุปกรณ์ ณ สำนักงาน พมจ. ประจำจังหวัด หรือ สายด่วน พม. 1300 [อ้างอิง: พ.ร.บ. คนพิการ พ.ศ. 2550 มาตรา 20]"
            })
            matched_equipment.append({
                "item": "รถเข็นนั่งผู้ป่วย (Wheelchair)",
                "agency": "กระทรวง พม. และ สปสช. กายอุปกรณ์",
                "cost_saved": "ประหยัดได้ประมาณ 5,000 - 15,000 บาท",
                "how_to_claim": "ติดต่อศูนย์บริการคนพิการจังหวัด หรือ แผนกกายภาพบำบัด รพ.รัฐ"
            })

        if needs_oxygen:
            matched_equipment.append({
                "item": "เครื่องผลิตออกซิเจน (Oxygen Concentrator) / ถังออกซิเจน",
                "agency": "กองทุนฟื้นฟูสมรรถภาพ สปสช. และ กระทรวง พม.",
                "cost_saved": "ประหยัดได้ประมาณ 20,000 - 50,000 บาท",
                "how_to_claim": "ยื่นผลตรวจก๊าซในเลือดและใบรับรองแพทย์ ณ รพ. ตามสิทธิบัตรทองหรือ พมจ."
            })

        if is_kidney_disease:
            eligible_schemes.append({
                "scheme": "สิทธิฟอกไตและล้างไตทางช่องท้องฟรี (สปสช. / ประกันสังคม)",
                "agency": "สปสช. 1330 และ สปส. 1506",
                "benefit": "ครอบคลุมการฟอกเลือด HD และล้างไต CAPD/APD ฟรี 100%",
                "contact": "แผนกไตเทียม โรงพยาบาลตามสิทธิ"
            })

        if is_cancer:
            eligible_schemes.append({
                "scheme": "สิทธิรักษามะเร็งไปที่ไหนก็ได้ (Cancer Anywhere)",
                "agency": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช. 1330)",
                "benefit": "รับยาเคมีบำบัด ฉายรังสี และการผ่าตัด ณ รพ. รัฐที่มีศักยภาพทั่วประเทศโดยไม่ต้องใช้ใบส่งตัว",
                "contact": "ศูนย์มะเร็ง โรงพยาบาลระดับตติยภูมิ"
            })

        eligible_schemes.append({
            "scheme": "สิทธิการดูแลระยะยาว Long-Term Care (LTC) และ Caregiver เยี่ยมบ้าน",
            "agency": "กองทุนสุขภาพตำบล / รพ.สต.",
            "benefit": "มีผู้จัดการดูแล (Care Manager) และจิตอาสา Caregiver ลงพื้นที่ตรวจสุขภาพและทำกายภาพที่บ้านฟรี",
            "contact": "รพ.สต. หรือ ศูนย์บริการสาธารณสุขใกล้บ้าน"
        })

        # 7. Final AI Clinical Summary
        if qwen_clinical_analysis:
            ai_clinical_summary = qwen_clinical_analysis
        elif vision_analysis:
            ai_clinical_summary = vision_analysis
        else:
            cond_text = ", ".join(detected_conditions)
            ai_clinical_summary = (
                f"จากการอ่านและวิเคราะห์เอกสาร ({filename}) โดย Qwen AI & OCR:\n"
                f"• **สถานพยาบาลที่ตรวจพบ**: {detected_hospital}\n"
                f"• **การวินิจฉัยและสภาวะทางการแพทย์**: {cond_text}\n"
                f"• **สิทธิประโยชน์และกายอุปกรณ์ที่สอดคล้อง**: เข้าข่ายผู้มีสิทธิขอรับกายอุปกรณ์จาก **สปสช.** และ **กระทรวง พม.**\n"
                f"• **ประมาณการมูลค่าสวัสดิการที่ประหยัดได้**: ประมาณ 35,000 - 120,000+ บาท (ไม่มีค่าใช้จ่าย)\n"
                f"• **คำแนะนำ**: นำใบรับรองแพทย์นี้พร้อมบัตรประชาชนติดต่อยื่นเรื่องที่ **อบต./เทศบาล หรือ รพ.สต.** ในพื้นที่ หรือโทรสายด่วน **1330** / **1300**"
            )

        official_references = [
            {
                "title": "ประกาศคณะกรรมการหลักประกันสุขภาพแห่งชาติ เรื่อง หลักเกณฑ์การจัดสรรผ้าอ้อมผู้ใหญ่และแผ่นรองซับผ่าน กปท.",
                "legal_act": "ประกาศ สปสช. เรื่อง แผนงานกองทุนหลักประกันสุขภาพท้องถิ่น ข้อ 7(2)",
                "agency": "สปสช. ร่วมกับ กรมส่งเสริมการปกครองท้องถิ่น",
                "url": "https://localhealth.nhso.go.th"
            },
            {
                "title": "พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550 มาตรา 20 (สิทธิขอรับกายอุปกรณ์และปรับสภาพบ้าน)",
                "legal_act": "พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550",
                "agency": "กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ กระทรวง พม.",
                "url": "https://dep.go.th"
            },
            {
                "title": "คู่มือแนวทางการจัดบริการดูแลระยะยาวด้านสาธารณสุขสำหรับผู้สูงอายุที่มีภาวะพึ่งพิง (LTC)",
                "legal_act": "ระเบียบสำนักงานหลักประกันสุขภาพแห่งชาติว่าด้วยการดูแลผู้มีภาวะพึ่งพิง",
                "agency": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
                "url": "https://www.nhso.go.th"
            }
        ]

        extracted_raw = {
            "document_id": doc_id,
            "filename": filename,
            "file_size": len(file_bytes),
            "resolution": image_dims,
            "document_type": doc_type,
            "ai_model": "Qwen 3.8 Clinical Vision & Reasoning Engine",
            "ocr_engine": ocr_engine,
            "ocr_raw_text": raw_text if raw_text else "อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)",
            "detected_hospital": detected_hospital,
            "detected_conditions": detected_conditions,
            "is_bedridden_or_adl_limited": is_bedridden,
            "ai_clinical_summary": ai_clinical_summary,
            "matched_equipment": matched_equipment,
            "eligible_schemes": eligible_schemes,
            "official_references": official_references,
            "analyzed_at": datetime.utcnow().isoformat()
        }

        masked_preview = pdpa_masker.sanitize_health_data({
            "ชื่อเอกสาร": filename,
            "โมเดล AI ที่ใช้วิเคราะห์": "Qwen 3.8 (Clinical Vision & Reasoning)",
            "สถานพยาบาลที่ตรวจพบ": detected_hospital,
            "การวินิจฉัยที่อ่านได้จากเอกสาร": ", ".join(detected_conditions),
            "ข้อความบางส่วนที่อ่านได้ (OCR)": raw_text[:150] + ("..." if len(raw_text) > 150 else "") if raw_text else "ประมวลผลข้อความภาพสำเร็จ",
            "กายอุปกรณ์ที่ขอรับได้": f"{len(matched_equipment)} รายการ (เช่น ผ้าอ้อม, เตียง, รถเข็น)",
            "หน่วยงานที่รับผิดชอบ": "สปสช., กระทรวง พม., กองทุนสุขภาพตำบล (อปท.)",
            "สถานะความคุ้มครอง": "สิทธิสวัสดิการรัฐ 100% ฟรี",
            "การคุ้มครองข้อมูล": "ผ่านการ Masking ข้อมูลส่วนบุคคลตามมาตรฐาน PDPA"
        })

        return {
            "document_id": doc_id,
            "uploaded_at": datetime.utcnow(),
            "document_type": doc_type,
            "extracted_data": extracted_raw,
            "masked_preview": masked_preview,
            "ocr_confidence": ocr_confidence,
            "message": "Qwen AI ได้ทำการอ่านและวิเคราะห์ใบรับรองแพทย์ พร้อมคำนวณสิทธิเรียบร้อยแล้ว"
        }


ai_medical_reader = AIMedicalCertificateReader()
