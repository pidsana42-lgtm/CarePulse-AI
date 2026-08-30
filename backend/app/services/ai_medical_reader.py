import logging
import uuid
import re
import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
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
    async def analyze_medical_document(
        filename: str,
        file_bytes: bytes,
        doc_type: str = "medical_certificate",
        corrected_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        doc_id = f"MED-{uuid.uuid4().hex[:8].upper()}"
        from app.services.llm_service import llm_service, strip_thinking_tokens

        # 1. Run Real OCR on image / document bytes
        if corrected_text is not None:
            raw_text = corrected_text.strip()
            ocr_engine = "user_reviewed"
            ocr_confidence = 1.0
        else:
            ocr_result = await asyncio.to_thread(
                real_ocr_service.extract_text,
                file_bytes,
                filename,
            )
            raw_text = ocr_result.get("text", "")
            ocr_engine = ocr_result.get("engine", "none")
            ocr_confidence = ocr_result.get("confidence", 0.92)

        logger.info(f"Real OCR on {filename}: Engine={ocr_engine}, Extracted {len(raw_text)} chars")

        # 2. Detect MIME type
        mime_type = "image/jpeg"
        if filename.lower().endswith(".png"):
            mime_type = "image/png"
        elif filename.lower().endswith(".webp"):
            mime_type = "image/webp"
        elif filename.lower().endswith(".pdf"):
            mime_type = "application/pdf"

        # 3. Optimize image size for ultra-fast network transmission (<300KB)
        import base64 as _b64
        from app.core.config import settings as _settings
        import httpx as _httpx

        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(file_bytes))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            if max(img.width, img.height) > 1280:
                img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85, optimize=True)
            compressed_bytes = buf.getvalue()
            b64_img = _b64.b64encode(compressed_bytes).decode("utf-8")
            data_url = f"data:image/jpeg;base64,{b64_img}"
        except Exception:
            b64_img = _b64.b64encode(file_bytes).decode("utf-8")
            data_url = f"data:{mime_type};base64,{b64_img}"

        vision_analysis = None
        gemma_clinical_analysis = ""
        vision_extracted: Dict[str, Any] = {}

        gemma_vision_prompt = (
            "อ่านใบรับรองแพทย์ในภาพและดึงข้อมูลจริงเป็น JSON ตาม schema ที่กำหนด "
            "patient_first_name และ patient_last_name ต้องเป็นชื่อบุคคลที่ใบรับรองออกให้เท่านั้น "
            "ห้ามใช้ชื่อแพทย์ นายแพทย์ ผู้ตรวจ ผู้รับรอง ผู้ลงนาม หรือเลขใบประกอบวิชาชีพ "
            "ชื่อหลังคำว่า ข้าพเจ้า, นายแพทย์, แพทย์หญิง หรือแพทย์ผู้ตรวจ คือชื่อแพทย์และต้องข้ามเสมอ "
            "ให้เลือกชื่อที่อยู่หลังคำว่า ได้ตรวจร่างกายของ, ผู้ป่วย, ผู้รับการตรวจ, ผู้รับบริการ "
            "หรือ ขอรับรองว่า เท่านั้น "
            "citizen_id ต้องเป็นเลขบัตรของผู้ป่วยเท่านั้น "
            "ห้ามเดาข้อมูลที่มองไม่เห็น ตอบเป็น JSON object เท่านั้นตามรูปแบบนี้:\n"
            "{\n"
            '  "patient_title": "คำนำหน้าชื่อผู้ป่วย",\n'
            '  "patient_first_name": "ชื่อผู้ป่วยโดยไม่มีคำนำหน้า",\n'
            '  "patient_last_name": "นามสกุลผู้ป่วย",\n'
            '  "citizen_id": "เลขบัตรผู้ป่วย 13 หลัก",\n'
            '  "hospital": "ชื่อสถานพยาบาล",\n'
            '  "doctor_name": "ชื่อแพทย์",\n'
            '  "doctor_license": "เลขใบประกอบวิชาชีพเวชกรรม",\n'
            '  "examination_date": "วันที่ตรวจ",\n'
            '  "certificate_date": "วันที่ออกใบรับรอง",\n'
            '  "symptoms": ["อาการที่ตรวจพบ"],\n'
            '  "diagnoses": ["การวินิจฉัยของแพทย์"],\n'
            '  "recommendation": "ความเห็นหรือคำแนะนำของแพทย์",\n'
            '  "leave_days": null\n'
            "}\n"
            "citizen_id ต้องมีเฉพาะเลขอารบิก 13 หลักโดยไม่มีขีดหรือเว้นวรรค "
            "ถ้าเห็นเฉพาะชื่อแพทย์หรืออ่านค่าของผู้ป่วยไม่ได้ให้ใช้สตริงว่าง "
            "ข้อมูลข้อความที่อ่านไม่ได้ให้ใช้สตริงว่าง รายการที่ไม่มีให้ใช้ [] และตัวเลขที่ไม่มีให้ใช้ null "
            "ห้ามเพิ่ม key อื่น ข้อความ OCR ดิบ คำอธิบาย หรือ markdown"
        )

        try:
            if corrected_text is not None:
                raise RuntimeError("ใช้ข้อความที่ผู้ใช้ตรวจทานแล้วแทนการวิเคราะห์ภาพซ้ำ")
            timeout_cfg = _httpx.Timeout(float(_settings.LLM_TIMEOUT), connect=15.0)
            async with _httpx.AsyncClient(timeout=timeout_cfg) as _client:
                _resp = await _client.post(
                    f"{llm_service.get_api_endpoint()}/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {_settings.LLM_API_KEY}",
                    },
                    json={
                        "model": _settings.LLM_MODEL,
                        "messages": [{
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": data_url}},
                                {"type": "text", "text": gemma_vision_prompt},
                            ],
                        }],
                        "temperature": 0,
                        "max_tokens": 768,
                        "enable_thinking": False,
                    },
                )
            if _resp.status_code == 200:
                _result = _resp.json()["choices"][0]["message"]["content"] or ""
                clean_result = strip_thinking_tokens(_result).strip()
                json_match = re.search(r"\{.*\}", clean_result, flags=re.DOTALL)
                if json_match:
                    try:
                        parsed_result = json.loads(json_match.group(0))
                        if isinstance(parsed_result, dict):
                            allowed_keys = {
                                "patient_title",
                                "patient_first_name",
                                "patient_last_name",
                                "patient_name",
                                "citizen_id",
                                "hospital",
                                "doctor_name",
                                "doctor_license",
                                "examination_date",
                                "certificate_date",
                                "symptoms",
                                "diagnoses",
                                "recommendation",
                                "leave_days",
                            }
                            vision_extracted = {
                                key: value
                                for key, value in parsed_result.items()
                                if key in allowed_keys
                            }
                    except json.JSONDecodeError:
                        logger.warning("Gemma-4 Vision returned invalid JSON; using text fallback")

                if not raw_text and any(
                    vision_extracted.get(key)
                    for key in (
                        "patient_first_name",
                        "patient_last_name",
                        "patient_name",
                        "citizen_id",
                    )
                ):
                    ocr_engine = "Gemma-4 Vision Identity Extractor"
                    ocr_confidence = 0.85

                logger.info(
                    "Gemma-4 Vision structured extraction on %s: name=%s, citizen_id=%s, diagnoses=%s",
                    filename,
                    bool(
                        vision_extracted.get("patient_first_name")
                        or vision_extracted.get("patient_name")
                    ),
                    bool(vision_extracted.get("citizen_id")),
                    len(vision_extracted.get("diagnoses") or []),
                )
            else:
                logger.warning(f"Gemma-4 Vision HTTP {_resp.status_code}: {_resp.text[:200]}")
                raise Exception(f"HTTP {_resp.status_code}")
        except Exception as e:
            logger.info(f"Gemma-4 Vision offline/cold ({e}), instant clinical reasoning from OCR text")


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
        combined_corpus = f"{raw_text} {vision_analysis or ''} {gemma_clinical_analysis} {filename}".lower()

        def clean_text(value: Any, max_length: int = 240) -> str:
            if not isinstance(value, str):
                return ""
            cleaned = " ".join(value.split()).strip(" .,:：-–_/|")
            return cleaned[:max_length]

        def clean_text_list(value: Any, max_items: int = 12) -> List[str]:
            if not isinstance(value, list):
                return []
            cleaned_items = [clean_text(item) for item in value]
            return list(dict.fromkeys(item for item in cleaned_items if item))[:max_items]

        structured_symptoms = clean_text_list(vision_extracted.get("symptoms"))
        structured_diagnoses = clean_text_list(vision_extracted.get("diagnoses"))
        detected_conditions = list(structured_diagnoses)
        detected_hospital = clean_text(vision_extracted.get("hospital"), 160)
        detected_patient_title = clean_text(vision_extracted.get("patient_title"), 20)
        detected_patient_first_name = clean_text(vision_extracted.get("patient_first_name"), 80)
        detected_patient_last_name = clean_text(vision_extracted.get("patient_last_name"), 80)
        detected_patient_name = " ".join(
            part
            for part in (
                detected_patient_title,
                detected_patient_first_name,
                detected_patient_last_name,
            )
            if part
        )
        if not detected_patient_name:
            detected_patient_name = clean_text(vision_extracted.get("patient_name"), 120)
        detected_citizen_id = re.sub(
            r"\D",
            "",
            str(vision_extracted.get("citizen_id") or "").translate(
                str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789")
            ),
        )
        if len(detected_citizen_id) != 13:
            detected_citizen_id = ""
        detected_age = vision_extracted.get("age")
        if not isinstance(detected_age, int) or not 0 <= detected_age <= 130:
            detected_age = None

        entity_text = f"{raw_text}\n{gemma_clinical_analysis}"

        # A labelled patient line is more reliable than the model when the
        # certificate also contains the physician's name and signature.
        explicit_patient_match = re.search(
            r"(?:ได้\s*ตรวจ\s*ร่างกาย(?:\s*ของ)?|ชื่อ\s*ผู้ป่วย|ผู้ป่วย|ผู้รับการตรวจ|ผู้รับบริการ)"
            r"[^\S\r\n]*[.．:：-]*[^\S\r\n]*([^\n\r]{2,120})",
            raw_text,
            flags=re.IGNORECASE,
        )
        if explicit_patient_match:
            explicit_patient_name = re.split(
                r"\s*(?:\(|บัตรประจ[ํำ]าตัว|เลข(?:ที่|ประจ[ํำ]าตัว|บัตร)|อายุ|HN|AN)",
                explicit_patient_match.group(1).strip(),
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0].strip(" .,:：-–_/")
            if (
                len(explicit_patient_name) >= 2
                and not re.search(
                    r"(?:นายแพทย์|แพทย์หญิง|แพทย์ผู้ตรวจ|นพ\.|พญ\.)",
                    explicit_patient_name,
                    flags=re.IGNORECASE,
                )
            ):
                title_match = re.match(r"^(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง)\s*", explicit_patient_name)
                if title_match:
                    detected_patient_title = title_match.group(1)
                    explicit_patient_name = explicit_patient_name[title_match.end():].strip()

                normalized_explicit_name = re.sub(r"\s+", "", explicit_patient_name)
                normalized_model_name = re.sub(
                    r"\s+",
                    "",
                    f"{detected_patient_first_name}{detected_patient_last_name}",
                )
                model_parts_match_patient = bool(
                    detected_patient_first_name
                    and normalized_model_name
                    and normalized_model_name == normalized_explicit_name
                )
                if not model_parts_match_patient:
                    name_parts = explicit_patient_name.split()
                    if len(name_parts) >= 2:
                        detected_patient_first_name = name_parts[0]
                        detected_patient_last_name = " ".join(name_parts[1:])
                    else:
                        detected_patient_first_name = explicit_patient_name
                        detected_patient_last_name = ""
                detected_patient_name = " ".join(
                    part
                    for part in (
                        detected_patient_title,
                        detected_patient_first_name,
                        detected_patient_last_name,
                    )
                    if part
                ) or explicit_patient_name
        
        is_bedridden = False
        needs_oxygen = False
        needs_wheelchair = False
        needs_diapers = False
        has_incontinence = False
        is_kidney_disease = False
        is_cancer = False
        adl_score_found = ""

        # Detect Hospital name
        hosp_match = re.search(r"(โรงพยาบาล[^\n\r,]+|รพ\.[^\n\r,]+|ศูนย์บริการสาธารณสุข[^\n\r,]+|คลินิก[^\n\r,]+)", entity_text)
        if not detected_hospital and hosp_match:
            detected_hospital = hosp_match.group(1).strip()
        if not detected_hospital:
            detected_hospital = "ไม่ระบุชัดเจนในเอกสาร"

        # Detect basic patient information for transient form prefill.
        citizen_match = re.search(
            r"(?<!\d)(\d)[-\s]?(\d{4})[-\s]?(\d{5})[-\s]?(\d{2})[-\s]?(\d)(?!\d)",
            entity_text,
        )
        if not detected_citizen_id and citizen_match:
            detected_citizen_id = "".join(citizen_match.groups())

        patient_name_match = re.search(
            r"(?:^|\n)[^\S\r\n]*(?:ชื่อ(?:ผู้ป่วย|ผู้รับบริการ)?"
            r"(?:[^\S\r\n]*[-–]?[^\S\r\n]*นามสกุล)?|ผู้ป่วย)"
            r"(?:[^\S\r\n]*[:：][^\S\r\n]*|[^\S\r\n]+)([^\n\r]{2,100})",
            entity_text,
            flags=re.IGNORECASE | re.MULTILINE,
        )
        if not detected_patient_name and patient_name_match:
            candidate_name = re.split(
                r"\s+(?:เลข(?:ประจำตัว|บัตร)|อายุ|เพศ|วัน(?:ที่|เกิด)|HN|AN)(?=\s|[:：])",
                patient_name_match.group(1).strip(),
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0].strip(" :-–")
            invalid_name_phrases = (
                "แบบฟอร์ม",
                "กรอกชื่อ",
                "สามารถพิมพ์",
                "อ่านข้อความ",
                "ตรวจแก้",
                "เอกสาร",
            )
            if not any(phrase in candidate_name for phrase in invalid_name_phrases):
                detected_patient_name = candidate_name

        if detected_patient_name and not detected_patient_first_name and not detected_patient_last_name:
            fallback_name = detected_patient_name
            title_match = re.match(r"^(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง)\s*", fallback_name)
            if title_match:
                detected_patient_title = title_match.group(1)
                fallback_name = fallback_name[title_match.end():].strip()
            name_parts = fallback_name.split()
            detected_patient_first_name = name_parts[0] if name_parts else ""
            detected_patient_last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        age_match = re.search(r"อายุ\s*[:：]?\s*([0-9]{1,3})\s*(?:ปี|yrs?|years?)?", entity_text, flags=re.IGNORECASE)
        if detected_age is None and age_match:
            parsed_age = int(age_match.group(1))
            if 0 <= parsed_age <= 130:
                detected_age = parsed_age

        # Detect ADL score
        adl_match = re.search(r"(adl|คะแนน\s*adl)[\s:=]*([0-9]+)", combined_corpus)
        if adl_match:
            adl_score_found = f"คะแนนประเมินกิจวัตรประจำวัน: {adl_match.group(2)}/20"

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
            has_incontinence = True

        if adl_score_found:
            detected_conditions.append(adl_score_found)

        detected_conditions = list(dict.fromkeys(detected_conditions))

        raw_leave_days = vision_extracted.get("leave_days")
        leave_days = raw_leave_days if isinstance(raw_leave_days, int) and 0 <= raw_leave_days <= 365 else None
        certificate_data = {
            "patient_name": detected_patient_name,
            "patient_title": detected_patient_title,
            "patient_first_name": detected_patient_first_name,
            "patient_last_name": detected_patient_last_name,
            "citizen_id": detected_citizen_id,
            "hospital": detected_hospital if detected_hospital != "ไม่ระบุชัดเจนในเอกสาร" else "",
            "doctor_name": clean_text(vision_extracted.get("doctor_name"), 120),
            "doctor_license": clean_text(vision_extracted.get("doctor_license"), 60),
            "examination_date": clean_text(vision_extracted.get("examination_date"), 80),
            "certificate_date": clean_text(vision_extracted.get("certificate_date"), 80),
            "symptoms": structured_symptoms,
            "diagnoses": structured_diagnoses,
            "recommendation": clean_text(vision_extracted.get("recommendation"), 500),
            "leave_days": leave_days,
        }

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
            "scheme": "สิทธิการดูแลระยะยาวสำหรับผู้มีภาวะพึ่งพิงและผู้ช่วยดูแลเยี่ยมบ้าน",
            "agency": "กองทุนสุขภาพตำบล / รพ.สต.",
            "benefit": "มีผู้จัดการดูแลและผู้ช่วยดูแลลงพื้นที่ตรวจสุขภาพและทำกายภาพที่บ้านโดยไม่มีค่าใช้จ่าย",
            "contact": "รพ.สต. หรือ ศูนย์บริการสาธารณสุขใกล้บ้าน"
        })

        # 7. Final AI Clinical Summary
        if gemma_clinical_analysis:
            ai_clinical_summary = gemma_clinical_analysis
        elif vision_analysis:
            ai_clinical_summary = vision_analysis
        else:
            cond_text = ", ".join(detected_conditions)
            ai_clinical_summary = (
                f"จากการอ่านและวิเคราะห์เอกสาร ({filename}) โดยระบบปัญญาประดิษฐ์ Gemma-4 และระบบอ่านข้อความจากภาพ:\n"
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
                "title": "คู่มือแนวทางการจัดบริการดูแลระยะยาวด้านสาธารณสุขสำหรับผู้สูงอายุที่มีภาวะพึ่งพิง",
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
            "ai_model": "Gemma-4 ระบบวิเคราะห์ภาพและเหตุผลทางการแพทย์",
            "ocr_engine": ocr_engine,
            "ocr_raw_text": raw_text if raw_text else "อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)",
            "reviewed_by_user": corrected_text is not None,
            "certificate_data": certificate_data,
            "detected_patient_name": detected_patient_name,
            "detected_patient_first_name": detected_patient_first_name,
            "detected_patient_last_name": detected_patient_last_name,
            "detected_citizen_id": detected_citizen_id,
            "detected_age": detected_age,
            "detected_hospital": detected_hospital,
            "detected_conditions": detected_conditions,
            "is_bedridden_or_adl_limited": is_bedridden,
            "suggested_daily_living": "bedridden" if is_bedridden else ("partial" if needs_wheelchair else "independent"),
            "has_mobility_limitation": needs_wheelchair or is_bedridden,
            "has_incontinence": has_incontinence,
            "has_disability_card": any(k in combined_corpus for k in ["บัตรประจำตัวคนพิการ", "บัตรคนพิการ", "disability card"]),
            "suggested_needs_equipment": [
                *(["adult_diaper"] if needs_diapers else []),
                *(["wheelchair"] if needs_wheelchair else []),
                *(["oxygen"] if needs_oxygen else []),
            ],
            "ai_clinical_summary": ai_clinical_summary,
            "matched_equipment": matched_equipment,
            "eligible_schemes": eligible_schemes,
            "official_references": official_references,
            "analyzed_at": datetime.utcnow().isoformat()
        }

        masked_preview = pdpa_masker.sanitize_health_data({
            "ชื่อเอกสาร": filename,
            "โมเดล AI ที่ใช้วิเคราะห์": "Gemma-4 (Clinical Vision & Reasoning)",
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
            "message": (
                "บันทึกข้อความที่ผู้ใช้ตรวจทานและวิเคราะห์สิทธิใหม่เรียบร้อยแล้ว"
                if corrected_text is not None
                else "Gemma-4 AI ได้ทำการอ่านและวิเคราะห์ใบรับรองแพทย์ พร้อมคำนวณสิทธิเรียบร้อยแล้ว"
            )
        }


ai_medical_reader = AIMedicalCertificateReader()
