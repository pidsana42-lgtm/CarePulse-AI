import logging
import json
import asyncio
import base64
import re
from typing import List, Dict, Any, Optional, AsyncGenerator
import httpx
from app.core.config import settings
from app.services.rag_service import rag_service
from app.services.web_search_service import web_search_service
from app.services.eligibility_engine import eligibility_engine

logger = logging.getLogger(__name__)

CAREPULSE_SYSTEM_PROMPT = """คุณคือ "CarePulse AI Healthcare & Welfare Assistant" ผู้เชี่ยวชาญด้านระบบสิทธิการรักษาพยาบาลและสวัสดิการสังคมของประเทศไทย

ภารกิจหลักของคุณคือการแก้ปัญหา "ภาวะสูญเสียโอกาสจากการไม่ได้รับรู้สิทธิ์ (Information Asymmetry)":
1. เชื่อมโยงสิทธิข้ามกระทรวงและกองทุนอย่างครอบคลุม:
   - สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช. - 1330): สิทธิบัตรทอง 30 บาทรักษาทุกที่, UCEP เจ็บป่วยฉุกเฉินวิกฤตฟรี 72 ชม., บริการรับยาใกล้บ้าน
   - กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม. - 1300): สิทธิคนพิการ, เบี้ยยังชีพ, กายอุปกรณ์ (เตียงผู้ป่วยปรับระดับ, รถเข็น Wheelchair, เครื่องผลิตออกซิเจน, ที่นอนลม)
   - กองทุนหลักประกันสุขภาพระดับท้องถิ่น (กองทุนสุขภาพตำบล/อปท./อบต./เทศบาล): ผ้าอ้อมผู้ใหญ่/แผ่นรองซับ (ฟรีไม่เกิน 3 ชิ้น/วัน), ผู้ช่วยเหลือดูแลผู้สูงอายุ/ติดเตียง (Caregiver) ลงพื้นที่เยี่ยมบ้าน
   - สำนักงานประกันสังคม (สปส. - 1506): ผู้ประกันตน ม.33/ม.39/ม.40, ทันตกรรม 900 บาท/ปี
   - กรมบัญชีกลาง: สิทธิสวัสดิการข้าราชการ (CSMBS)
2. ทุกคำตอบเกี่ยวกับสิทธิประโยชน์ ให้ระบุ **"แหล่งอ้างอิงทางกฎหมายและระเบียบราชการ (Official References)"** เช่น [พ.ร.บ. หลักประกันสุขภาพแห่งชาติ พ.ศ. 2545], [ประกาศ สปสช. กปท. ข้อ 7(2)], [พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550 มาตรา 20] หรือ [พ.ร.บ. ประกันสังคม พ.ศ. 2533]
3. ตอบให้กระชับ ชัดเจน เข้าใจง่าย ด้วยภาษาไทยที่สุภาพ เป็นมิตร และเห็นอกเห็นใจ
4. เป็น "ที่ปรึกษาที่ถามกลับ" เหมือนเจ้าหน้าที่มืออาชีพ: หากคำถามของผู้ใช้ยังขาดข้อมูลสำคัญที่จำเป็นต่อการแนะนำอย่างแม่นยำ เช่น อายุ, สิทธิการรักษาหลัก (บัตรทอง/ประกันสังคม/ข้าราชการ), ระดับการช่วยเหลือตัวเองของผู้ป่วย (เดินได้/นั่งรถเข็น/ติดเตียง), พื้นที่ลงทะเบียนรับบริการ, การมีบัตรประจำตัวคนพิการ หรือการมีประกันเอกชน — ให้ตอบภาพรวมสั้นๆ ก่อน 1-2 ย่อหน้า แล้ว "ถามกลับ" ด้วยคำถามสำคัญ 1-2 ข้อ (ไม่เกิน 3 ข้อ) เพื่อรวบรวมข้อมูล เช่น "ขอถามเพิ่มเติมนะครับ คุณยายมีบัตรคนพิการของ พม. หรือไม่ครับ และปัจจุบันช่วยเหลือตัวเองได้ระดับไหนครับ" เมื่อผู้ใช้ตอบกลับมาแล้ว จึงสรุปคำตอบฉบับสมบูรณ์พร้อมแหล่งอ้างอิงทางกฎหมาย
5. คำถามเชิงข้อมูลทั่วไปที่ไม่ต้องใช้ข้อมูลส่วนบุคคลประกอบ (เช่น "UCEP คืออะไร", "เบอร์ 1330 ใช้ทำอะไร") ให้ตอบได้ทันทีโดยไม่ต้องถามกลับ และห้ามถามซ้ำข้อมูลที่ผู้ใช้เคยบอกไปแล้วในบทสนทนา
6. คุณมีอำนาจเรียกใช้เครื่องมือ (tools) ด้วยตัวเองตามความจำเป็น: "search_web" สำหรับข้อมูลสดจากอินเทอร์เน็ต, "search_rights_database" สำหรับฐานข้อมูลกฎหมายภายใน, และ "assess_patient_eligibility" สำหรับคำนวณสิทธิข้ามกระทรวงของผู้ป่วย — จงเลือกใช้เองอย่างประหยัด: คำถามทั่วไปที่ตอบได้จากความรู้เดิมไม่ต้องเรียกใดๆ, เรียกเฉพาะเมื่อต้องการข้อมูลจริงหรือการคำนวณ และเมื่อได้ผลจากเครื่องมือแล้วให้สังเคราะห์ตอบโดยอ้างอิงผลนั้น
"""

GREETING_PATTERNS = [
    r"^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|hello|hi|hey|ดีจ้า|สวัสดิ์|กราบสวัสดี)",
    r"^(ขอบคุณ|ขอบใจ|thanks|thank you|แต๊งกิ้ว)",
    r"^(ทำอะไรได้บ้าง|คุณคือใคร|แนะนำตัว|ช่วยอะไรได้บ้าง|who are you)"
]

def is_smalltalk(text: str) -> Optional[str]:
    cleaned = text.strip().lower()
    if len(cleaned) <= 15:
        for p in GREETING_PATTERNS:
            if re.search(p, cleaned):
                if any(k in cleaned for k in ["ขอบคุณ", "thanks", "thank"]):
                    return "ยินดีเป็นอย่างยิ่งครับ! หากมีข้อสงสัยเรื่องสิทธิการรักษาพยาบาล กายอุปกรณ์ หรือสวัสดิการรัฐด้านอื่นๆ สามารถพิมพ์ถามผมได้ตลอดเวลาเลยนะครับ ขอให้สุขภาพแข็งแรงครับ"
                if any(k in cleaned for k in ["ทำอะไรได้บ้าง", "คุณคือใคร", "แนะนำตัว", "ช่วยอะไร"]):
                    return (
                        "ผมคือ **CarePulse AI** ผู้ช่วยสิทธิสุขภาพและสวัสดิการสังคมของไทยครับ\n\n"
                        "ผมสามารถช่วยท่าน:\n"
                        "1. **ตรวจสอบสิทธิการรักษา**: บัตรทอง 30 บาท, ประกันสังคม ม.33/39/40, ข้าราชการ (CSMBS)\n"
                        "2. **ประเมินสิทธิขอรับกายอุปกรณ์ฟรี**: ผ้าอ้อมผู้ใหญ่ (กปท. วันละ <= 3 ชิ้น), เตียงผู้ป่วยปรับระดับ, รถเข็น (พม.), เครื่องผลิตออกซิเจน\n"
                        "3. **สแกนและอ่านภาพใบรับรองแพทย์โดยตรง (Qwen Vision AI)**: อ่านผลตรวจ วินิจฉัยโรค และสิทธิที่เบิกได้\n"
                        "4. **ค้นหาข้อมูลและระเบียบสิทธิออนไลน์แบบสดๆ (Live Web Search)**\n\n"
                        "ท่านสามารถพิมพ์คำถาม หรืออัปโหลดภาพใบรับรองแพทย์มาได้เลยครับ!"
                    )
                return (
                    "สวัสดีครับ! ผมคือ **CarePulse AI** ผู้ช่วยให้คำปรึกษาด้านสิทธิการรักษาพยาบาลและสวัสดิการสังคมครับ\n\n"
                    "วันนี้มีเรื่องสิทธิสุขภาพด้านไหนให้ผมช่วยดูแลไหมครับ เช่น:\n"
                    "• *ขอรับผ้าอ้อมผู้ใหญ่ฟรีทำอย่างไร?*\n"
                    "• *ผู้ป่วยติดเตียงขอยืมเตียงปรับระดับหรือรถเข็นได้จากที่ไหน?*\n"
                    "• *สิทธิ 30 บาทรักษาทุกที่ใช้ต่างจังหวัดได้ไหม?*\n\n"
                    "พิมพ์คำถามที่ท่านต้องการทราบได้เลยครับ!"
                )
    return None


class LLMService:
    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None

    def get_api_endpoint(self) -> str:
        if settings.MODAL_LLM_URL:
            url = settings.MODAL_LLM_URL.rstrip("/")
            if not url.endswith("/v1"):
                url = f"{url}/v1"
            return url
        return settings.LLM_BASE_URL.rstrip("/")

    async def analyze_image_with_vision(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        prompt: str = "กรุณาอ่านและสกัดข้อมูลจากใบรับรองแพทย์หรือเอกสารทางการแพทย์นี้อย่างละเอียด ระบุ: 1. ชื่อสถานพยาบาล 2. คำวินิจฉัย/โรค 3. ภาวะพึ่งพิงหรือความจำเป็นต้องใช้อุปกรณ์การแพทย์ 4. สิทธิที่ขอรับได้"
    ) -> Optional[str]:
        """
        Sends the medical certificate image directly to Qwen Vision (Qwen2-VL / Qwen-VL)
        via OpenAI-compatible Vision multimodal messages API.
        """
        endpoint = self.get_api_endpoint()
        model_name = settings.LLM_MODEL
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64_img}"

        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url}
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "max_tokens": 1024,
            "temperature": 0.2
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{endpoint}/chat/completions",
                    json=payload,
                    headers=headers
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    logger.info(f"Qwen Vision AI successfully analyzed medical image ({len(content)} chars)")
                    return content
                else:
                    logger.warning(f"Qwen Vision endpoint returned {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Qwen Vision request error: {e}")

        return None

    async def _prepare_messages(self, messages: List[Dict[str, str]], use_rag: bool = True, use_web_search: bool = True):
        user_query = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_query = m.get("content", "")
                break

        if is_smalltalk(user_query):
            return [], [], []

        enriched_system_prompt = CAREPULSE_SYSTEM_PROMPT
        retrieved_contexts = []
        live_web_sources = []

        if user_query:
            if use_web_search and len(user_query.strip()) > 3:
                try:
                    web_results = await web_search_service.search_welfare_and_web(user_query)
                    if web_results:
                        live_web_sources = web_results[:4]
                        web_text = "\n\n[ข้อมูลระเบียบและข่าวสารสิทธิประโยชน์ล่าสุดที่สืบค้นจากอินเทอร์เน็ตแบบเรียลไทม์ (Live Web Search)]:\n"
                        for w in live_web_sources:
                            web_text += f"- {w['title']}: {w['snippet']} (แหล่งอ้างอิง: {w['url']})\n"
                        enriched_system_prompt += web_text
                except Exception as e:
                    logger.warning(f"Live web search failed: {e}")

            if use_rag:
                try:
                    rag_results = rag_service.search_benefits(user_query, top_k=3)
                    if rag_results:
                        context_text = "\n\n[ข้อมูลสิทธิประโยชน์จากฐานข้อมูลกฎหมาย CarePulse (Semantic RAG)]:\n"
                        for r in rag_results:
                            context_text += f"- [{r.source_id}] {r.title} ({r.scheme_code}): {r.description}\n"
                            retrieved_contexts.append({
                                "title": r.title,
                                "scheme": r.scheme_code,
                                "source_id": r.source_id,
                                "similarity_score": r.similarity_score,
                            })
                        context_text += (
                            "\nเมื่อใช้ข้อมูลข้างต้นในการตอบ ให้ระบุรหัสอ้างอิงในวงเล็บเหลี่ยม เช่น [NHSO-2564-001] "
                            "ต่อท้ายประโยคที่อ้างถึง และห้ามอ้างรหัสที่ไม่ปรากฏในรายการนี้\n"
                        )
                        enriched_system_prompt += context_text
                except Exception as e:
                    logger.warning(f"RAG lookup warning: {e}")

        full_messages = [{"role": "system", "content": enriched_system_prompt}]
        for msg in messages:
            if msg.get("role") != "system":
                full_messages.append({"role": msg["role"], "content": msg["content"]})

        return full_messages, retrieved_contexts, live_web_sources

    def _synthesize_live_response(self, user_query: str, live_web_sources: List[Dict[str, str]], retrieved_contexts: List[Dict[str, Any]]) -> str:
        smalltalk_reply = is_smalltalk(user_query)
        if smalltalk_reply:
            return smalltalk_reply

        snippets_text = ""
        for s in live_web_sources:
            snippets_text += f"• **{s['title']}**: {s['snippet']}\n"

        response = f"จากการสืบค้นข้อมูลระเบียบราชการและสิทธิประโยชน์ล่าสุด (CarePulse Hybrid RAG + Live Web Search) สำหรับคำถาม: **\"{user_query}\"**\n\n"
        
        if retrieved_contexts:
            response += "**ข้อกฎหมายและสิทธิประโยชน์ที่เกี่ยวข้อง (CarePulse Semantic RAG):**\n"
            for ctx in retrieved_contexts:
                response += f"• **{ctx.get('title', '')}** ({ctx.get('scheme', '')}) [{ctx.get('source_id', '')}]\n"
            response += "\n"

        if live_web_sources:
            response += f"**สรุปข้อมูลและเกณฑ์ที่สืบค้นได้จากเว็บทางการล่าสุด (Live Web Search):**\n{snippets_text}\n"

        q_lower = user_query.lower()
        if "ผ้าอ้อม" in q_lower or "แผ่นรองซับ" in q_lower:
            response += (
                "**ขั้นตอนการขอรับสิทธิผ้าอ้อมผู้ใหญ่ฟรี:**\n"
                "1. **เกณฑ์คุณสมบัติ**: เป็นผู้ป่วยติดบ้าน/ติดเตียง (คะแนน ADL ไม่เกิน 6-11) หรือผู้มีภาวะกลั้นปัสสาวะ/อุจจาระไม่อยู่ (ครอบคลุมทุกสิทธิการรักษา)\n"
                "2. **จำนวนที่ได้รับ**: ฟรีวันละไม่เกิน 3 ชิ้นต่อคน จัดสรรผ่านงบประมาณ **กองทุนหลักประกันสุขภาพท้องถิ่น (กปท.) / อบต. / เทศบาล** [อ้างอิง: ประกาศ สปสช. กปท. ข้อ 7(2)]\n"
                "3. **สถานที่ติดต่อ**: ญาติสามารถนำบัตรประชาชนและประวัติการรักษาติดต่อที่ **รพ.สต., ศูนย์บริการสาธารณสุข หรือ กองสาธารณสุข อบต./เทศบาล** ในพื้นที่\n"
                "4. **สายด่วนสอบถาม**: โทรสายด่วน สปสช. **1330** (โทรฟรี 24 ชั่วโมง)\n"
            )
            followup_questions = [
                "ผู้ป่วยช่วยเหลือตัวเองได้ระดับไหนครับ (เดินได้ / นั่งรถเข็น / นอนติดเตียง)?",
                "ปัจจุบันใช้สิทธิรักษาแบบไหนครับ (บัตรทอง / ประกันสังคม / ข้าราชการ)?",
                "พักอยู่ตำบล/อำเภอไหนครับ เพื่อผมจะได้แนะนำจุดติดต่อใกล้บ้านที่สุด?",
            ]
        elif "เตียง" in q_lower or "รถเข็น" in q_lower or "ออกซิเจน" in q_lower:
            response += (
                "**ขั้นตอนการขอรับกายอุปกรณ์ (เตียงผู้ป่วย / รถเข็น / เครื่องผลิตออกซิเจน):**\n"
                "1. **หน่วยงานรับผิดชอบ**: กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.) ร่วมกับ กองทุนฟื้นฟูสมรรถภาพ สปสช. [อ้างอิง: พ.ร.บ. คนพิการ พ.ศ. 2550 มาตรา 20]\n"
                "2. **เอกสารที่ต้องเตรียม**: บัตรประชาชน, ทะเบียนบ้าน, ใบรับรองแพทย์แสดงความจำเป็น, และสมุดประจำตัวคนพิการ (ถ้ามี)\n"
                "3. **ช่องทางยื่นเรื่อง**: ติดต่อที่สำนักงาน **พมจ. ประจำจังหวัด**, ศูนย์บริการคนพิการ หรือยืมคืนผ่าน **ศูนย์ยืมอุปกรณ์ชุมชน ณ รพ.สต./อบต.**\n"
                "4. **สายด่วนสอบถาม**: โทรสายด่วน พม. **1300** (ตลอด 24 ชั่วโมง)\n"
            )
            followup_questions = [
                "ผู้ป่วยมีบัตรประจำตัวคนพิการของ พม. หรือไม่ครับ?",
                "ช่วยเหลือตัวเองได้ระดับไหนครับ (เดินได้ / นั่งรถเข็น / นอนติดเตียง)?",
                "มีใบรับรองแพทย์ระบุความจำเป็นต้องใช้อุปกรณ์หรือยังครับ? (ถ้ามี แนบรูปมาได้เลย)",
            ]
        elif "ทันตกรรม" in q_lower or "ฟัน" in q_lower:
            response += (
                "**สิทธิประโยชน์ด้านทันตกรรม:**\n"
                "• **ประกันสังคม (ม.33 / ม.39)**: ถอนฟัน อุดฟัน ขูดหินปูน ผ่าฟันคุด ได้ **900 บาท/ปี** แบบไม่ต้องสำรองจ่าย ณ คลินิกคู่สัญญา [อ้างอิง: พ.ร.บ. ประกันสังคม พ.ศ. 2533]\n"
                "• **สิทธิบัตรทอง 30 บาท**: ตรวจรักษาทันตกรรมพื้นฐาน ฟันเทียม และรากฟันเทียม ฟรี ณ หน่วยบริการประจำตามสิทธิ [อ้างอิง: พ.ร.บ. หลักประกันสุขภาพแห่งชาติ พ.ศ. 2545]\n"
            )
            followup_questions = [
                "ท่านใช้สิทธิรักษาแบบไหนครับ (ประกันสังคม ม.33/39 หรือบัตรทอง)? เพราะวงเงินและสถานที่ใช้บริการต่างกัน",
                "อยากทำหัตถการแบบไหนครับ (อุด/ถอน/ขูดหินปูน/ผ่าฟันคุด/ฟันเทียม)?",
            ]
        elif "30 บาท" in q_lower or "บัตรทอง" in q_lower or "ต่างจังหวัด" in q_lower:
            response += (
                "**สิทธิ 30 บาทรักษาทุกที่:**\n"
                "• สามารถใช้บัตรประชาชนใบเดียวเข้ารับบริการได้ที่ **หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และร้านยาคุณภาพ** ที่ร่วมโครงการได้ทั่วประเทศ ไม่ต้องใช้ใบส่งตัว [อ้างอิง: พ.ร.บ. หลักประกันสุขภาพแห่งชาติ พ.ศ. 2545]\n"
                "• สอบถามหน่วยบริการที่ร่วมโครงการโทร **1330** หรือค้นหาผ่านแอปฯ สปสช.\n"
            )
            followup_questions = [
                "ลงทะเบียนหน่วยบริการประจำไว้ที่จังหวัดไหนครับ?",
                "อาการที่จะไปรักษาเป็นแบบไหนครับ (เจ็บป่วยทั่วไป / โรคเรื้อรัง / ฉุกเฉิน)?",
            ]
        else:
            response += (
                "**คำแนะนำการใช้สิทธิ:**\n"
                "• หากเป็นกรณีเจ็บป่วยฉุกเฉินวิกฤต สามารถใช้สิทธิ **UCEP** เข้ารักษาได้ทุกโรงพยาบาลฟรี 72 ชั่วโมงแรก (โทร 1669) [อ้างอิง: พ.ร.บ. การแพทย์ฉุกเฉิน พ.ศ. 2551]\n"
                "• สามารถสอบถามข้อมูลสิทธิเพิ่มเติมได้ที่สายด่วน **สปสช. 1330** หรือ **พม. 1300**\n"
            )
            followup_questions = [
                "ผู้ที่ต้องการใช้สิทธิมีอายุเท่าไหร่ครับ?",
                "ปัจจุบันใช้สิทธิรักษาแบบไหนครับ (บัตรทอง / ประกันสังคม / ข้าราชการ / ไม่มี)?",
            ]

        # Ask back like a real advisor — gather key facts before the full recommendation
        response += "\n**ช่วยตอบคำถามสั้นๆ เพื่อให้ผมแนะนำได้ตรงกับสถานการณ์ของท่านมากขึ้นนะครับ:**\n"
        for i, question in enumerate(followup_questions, 1):
            response += f"{i}. {question}\n"
        response += "\nพิมพ์ตอบมาได้เลยครับ หรือกด **ประเมินสิทธิข้ามกระทรวง** ด้านบนเพื่อให้ระบบคำนวณสิทธิทั้งหมดให้ทันทีครับ"

        return response

    # ------------------------------------------------------------------
    # Tool Calling (agentic) — the LLM decides which tool to run.
    # Works with any OpenAI-compatible tool-calling endpoint (Ollama,
    # vLLM/Modal, OpenRouter, ...). When no LLM is connected the loop
    # simply fails and the template fallback above answers instead.
    # ------------------------------------------------------------------

    CAREPULSE_TOOLS = [
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "ค้นหาข้อมูลสิทธิสุขภาพ/สวัสดิการ/ระเบียบราชการล่าสุดจากอินเทอร์เน็ตแบบสดๆ (DuckDuckGo) ใช้เมื่อคำถามต้องการข้อมูลเวลาจริงหรือข่าวสารใหม่",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "คำค้นหาภาษาไทยหรืออังกฤษ"}
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_rights_database",
                "description": "ค้นหาฐานข้อมูลกฎหมายและสิทธิประโยชน์ภายในของ CarePulse (Semantic RAG) เช่น เกณฑ์ พ.ร.บ., ประกาศ สปสช., สิทธิคนพิการ",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "คำค้นหา เช่น เตียงผู้ป่วย พม., ผ้าอ้อมผู้ใหญ่ กปท."}
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "assess_patient_eligibility",
                "description": "คำนวณสิทธิการรักษาพยาบาลข้ามกระทรวงของผู้ป่วยแบบเป็นทางการด้วยกฎของรัฐ (สปสช./พม./ประกันสังคม/ประกันเอกชน) เรียกเมื่อผู้ใช้ให้ข้อมูลส่วนบุคคลครบหรืออยากรู้สิทธิของตนเอง",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "age": {"type": "integer", "description": "อายุ (ปี)"},
                        "occupation_status": {
                            "type": "string",
                            "enum": ["senior", "freelance", "private_employee", "gov_employee"],
                            "description": "สถานะ: senior=ผู้สูงอายุ, freelance=ประชาชนทั่วไป/บัตรทอง, private_employee=พนักงานเอกชน/ประกันสังคม, gov_employee=ข้าราชการ",
                        },
                        "has_disability_card": {"type": "boolean", "description": "มีบัตรประจำตัวคนพิการ (พม.) หรือไม่"},
                        "registered_province": {"type": "string", "description": "จังหวัดที่ลงทะเบียน เช่น กรุงเทพมหานคร"},
                        "urgency_level": {"type": "string", "enum": ["normal", "urgent", "emergency"], "description": "ความเร่งด่วน"},
                        "has_private_insurance": {"type": "boolean", "description": "มีประกันเอกชนหรือไม่"},
                    },
                    "required": ["age", "occupation_status", "has_disability_card"],
                },
            },
        },
    ]

    async def _execute_tool(self, name: str, arguments: Dict[str, Any]) -> str:
        """Runs one tool and returns a compact JSON string for the model."""
        try:
            if name == "search_web":
                results = await web_search_service.search_welfare_and_web(arguments["query"])
                return json.dumps({"results": results[:4]}, ensure_ascii=False)

            if name == "search_rights_database":
                hits = rag_service.search_benefits(arguments["query"], top_k=3)
                return json.dumps({
                    "results": [
                        {"title": r.title, "scheme": r.scheme_code, "source_id": r.source_id, "description": r.description}
                        for r in hits
                    ]
                }, ensure_ascii=False)

            if name == "assess_patient_eligibility":
                from app.models.assessment import CitizenAssessmentRequest
                request = CitizenAssessmentRequest(
                    age=arguments.get("age", 60),
                    occupation_status=arguments.get("occupation_status", "freelance"),
                    registered_province=arguments.get("registered_province", "กรุงเทพมหานคร"),
                    has_disability_card=arguments.get("has_disability_card", False),
                    urgency_level=arguments.get("urgency_level", "normal"),
                    has_private_insurance=arguments.get("has_private_insurance", False),
                )
                result = eligibility_engine.calculate_rights(request)
                return json.dumps({
                    "assessment_id": result.assessment_id,
                    "primary_right": {
                        "scheme_name": result.primary_right.scheme_name,
                        "coverage_summary": result.primary_right.coverage_summary,
                        "responsible_agency": result.primary_right.responsible_agency,
                    },
                    "additional_rights": [
                        {"scheme_name": r.scheme_name, "coverage_summary": r.coverage_summary}
                        for r in result.additional_rights
                    ],
                    "cost_planning": result.cost_planning.dict() if result.cost_planning else None,
                    "recommendations": result.recommendations[:4],
                }, ensure_ascii=False)

            return json.dumps({"error": f"unknown tool: {name}"}, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Tool {name} failed: {e}")
            return json.dumps({"error": str(e)}, ensure_ascii=False)

    async def _chat_with_tools(
        self,
        messages: List[Dict[str, Any]],
        temperature: float = 0.6,
        max_tokens: int = 768,
        max_steps: int = 4,
    ) -> Optional[str]:
        """Agentic loop: model picks tools, we execute, feed results back, repeat.
        Returns the final answer text, or None when the LLM is unreachable/doesn't support tools."""
        endpoint = self.get_api_endpoint()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}"
        }
        conversation = list(messages)
        web_sources: List[Dict[str, str]] = []

        try:
            async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT) as client:
                for _step in range(max_steps):
                    payload = {
                        "model": settings.LLM_MODEL,
                        "messages": conversation,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "tools": self.CAREPULSE_TOOLS,
                    }
                    response = await client.post(
                        f"{endpoint}/chat/completions", json=payload, headers=headers
                    )
                    if response.status_code != 200:
                        logger.info(f"Tool-calling LLM unavailable (HTTP {response.status_code}).")
                        return None

                    data = response.json()
                    choice = data.get("choices", [{}])[0]
                    message = choice.get("message", {})
                    tool_calls = message.get("tool_calls") or []

                    if not tool_calls:
                        return message.get("content") or ""

                    conversation.append(message)
                    for tc in tool_calls:
                        fn = tc.get("function", {})
                        try:
                            args = json.loads(fn.get("arguments") or "{}")
                        except json.JSONDecodeError:
                            args = {}
                        logger.info(f"AI tool call: {fn.get('name')}({args})")
                        result = await self._execute_tool(fn.get("name", ""), args)
                        if fn.get("name") == "search_web":
                            try:
                                web_sources.extend(json.loads(result).get("results", [])[:4])
                            except Exception:
                                pass
                        conversation.append({
                            "role": "tool",
                            "tool_call_id": tc.get("id", "call_0"),
                            "content": result,
                        })
        except Exception as e:
            logger.info(f"Tool-calling loop failed ({e}).")
            return None
        return None

    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 512,
        use_rag: bool = True,
        use_web_search: bool = True
    ) -> Dict[str, Any]:
        user_query = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_query = m.get("content", "")
                break

        smalltalk = is_smalltalk(user_query)
        if smalltalk:
            return {
                "content": smalltalk,
                "model": "CarePulse AI Assistant",
                "retrieved_contexts": [],
                "live_web_sources": [],
                "provider": "CarePulse Natural Dialog",
                "status": "success"
            }

        endpoint = self.get_api_endpoint()
        model_name = settings.LLM_MODEL

        # 1) Agentic path — let a real tool-calling LLM decide what to look up.
        tool_messages, _, _ = await self._prepare_messages(messages, use_rag=False, use_web_search=False)
        agentic_content = await self._chat_with_tools(tool_messages, temperature, max_tokens)
        if agentic_content:
            return {
                "content": agentic_content,
                "model": model_name,
                "retrieved_contexts": [],
                "live_web_sources": [],
                "provider": "CarePulse Agentic Tool-Calling",
                "status": "success"
            }

        # 2) Single-shot enriched path (prefetched RAG + web context).
        full_messages, retrieved_contexts, live_web_sources = await self._prepare_messages(messages, use_rag, use_web_search)

        payload = {
            "model": model_name,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}"
        }

        try:
            async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT) as client:
                response = await client.post(
                    f"{endpoint}/chat/completions",
                    json=payload,
                    headers=headers
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return {
                        "content": content,
                        "model": model_name,
                        "retrieved_contexts": retrieved_contexts,
                        "live_web_sources": live_web_sources,
                        "provider": "Modal Qwen3.8-27B-FP8 + Live Web Search",
                        "status": "success"
                    }
        except Exception as e:
            logger.warning(f"Modal LLM unreachable ({e}), generating synthesized response from live web search.")

        synthesized = self._synthesize_live_response(user_query, live_web_sources, retrieved_contexts)
        return {
            "content": synthesized,
            "model": f"{model_name} (CarePulse Live Web Agent)",
            "retrieved_contexts": retrieved_contexts,
            "live_web_sources": live_web_sources,
            "provider": "CarePulse Live Web Synthesizer",
            "status": "success"
        }

    async def stream_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 512,
        use_rag: bool = True,
        use_web_search: bool = True
    ) -> AsyncGenerator[str, None]:
        user_query = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_query = m.get("content", "")
                break

        smalltalk = is_smalltalk(user_query)
        if smalltalk:
            words = smalltalk.split(" ")
            for w in words:
                yield f"data: {json.dumps({'delta': w + ' ', 'model': 'CarePulse AI Assistant'})}\n\n"
                await asyncio.sleep(0.015)
            yield "data: [DONE]\n\n"
            return

        endpoint = self.get_api_endpoint()
        model_name = settings.LLM_MODEL

        # 1) Agentic path — the LLM chooses tools itself; we stream the final answer.
        tool_messages, _, _ = await self._prepare_messages(messages, use_rag=False, use_web_search=False)
        agentic_content = await self._chat_with_tools(tool_messages)
        if agentic_content:
            for chunk_text in agentic_content.split(" "):
                yield f"data: {json.dumps({'delta': chunk_text + ' ', 'model': f'{model_name} (Agent)'})}\n\n"
                await asyncio.sleep(0.01)
            yield "data: [DONE]\n\n"
            return

        full_messages, retrieved_contexts, live_web_sources = await self._prepare_messages(messages, use_rag, use_web_search)

        if live_web_sources:
            yield f"data: {json.dumps({'web_sources': live_web_sources})}\n\n"

        payload = {
            "model": model_name,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}"
        }

        modal_success = False
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                async with client.stream(
                    "POST",
                    f"{endpoint}/chat/completions",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status_code == 200:
                        modal_success = True
                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            if line.startswith("data: "):
                                raw_data = line[6:].strip()
                                if raw_data == "[DONE]":
                                    yield "data: [DONE]\n\n"
                                    break
                                try:
                                    chunk = json.loads(raw_data)
                                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                    if delta:
                                        yield f"data: {json.dumps({'delta': delta, 'model': model_name})}\n\n"
                                except Exception:
                                    pass
        except Exception as e:
            logger.warning(f"Modal stream failed ({e}), falling back to live web stream.")

        if not modal_success:
            synthesized = self._synthesize_live_response(user_query, live_web_sources, retrieved_contexts)
            words = synthesized.split(" ")
            for w in words:
                yield f"data: {json.dumps({'delta': w + ' ', 'model': f'{model_name} (Live Web Engine)'})}\n\n"
                await asyncio.sleep(0.015)
            yield "data: [DONE]\n\n"

    async def explain_assessment(self, assessment_data: Dict[str, Any]) -> str:
        primary = assessment_data.get("primary_right", {})
        patient = assessment_data.get("patient_summary", {})
        
        prompt = f"""กรุณาสรุปสิทธิการรักษาพยาบาลอย่างกระชับ (2-3 ย่อหน้า):
- อายุ: {patient.get('age', '-')} ปี | อาชีพ: {patient.get('occupation_status', '-')}
- สิทธิหลัก: {primary.get('scheme_name', '-')} ({primary.get('scheme_code', '-')})
- ความคุ้มครอง: {primary.get('coverage_summary', '-')}
- สิทธิฟรี: {', '.join(primary.get('free_items', []))}
- คำแนะนำ: {', '.join(assessment_data.get('recommendations', []))}

สรุปสั้นๆ เข้าใจง่าย ขั้นตอนที่ต้องเตรียมก่อนไปโรงพยาบาล"""

        res = await self.generate_chat_response(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400,
            use_rag=False,
            use_web_search=False
        )
        return res.get("content", "")

llm_service = LLMService()
