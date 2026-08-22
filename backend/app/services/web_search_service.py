import logging
import httpx
from typing import List, Dict, Any, Optional
from app.services.data_loader import data_loader

logger = logging.getLogger(__name__)

OFFICIAL_HEALTH_PORTALS = [
    {"name": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)", "domain": "nhso.go.th", "hotline": "1330"},
    {"name": "กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.)", "domain": "m-society.go.th", "hotline": "1300"},
    {"name": "สำนักงานประกันสังคม (สปส.)", "domain": "sso.go.th", "hotline": "1506"},
    {"name": "กรมบัญชีกลาง (สวัสดิการข้าราชการ)", "domain": "cgd.go.th", "hotline": "02-270-6400"},
    {"name": "สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)", "domain": "niems.go.th", "hotline": "1669"},
    {"name": "กองทุนหลักประกันสุขภาพระดับท้องถิ่น (กปท.)", "domain": "localhealth.nhso.go.th", "hotline": "1330"},
]

class WebSearchService:
    """
    Search service across Thai healthcare official portals,
    policy regulations, and assistive device welfare catalogs.
    """

    @staticmethod
    async def search_welfare_and_web(query: str, agency_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        q_lower = query.lower().strip()

        # 1. Search local indexed policies & manual chunks from SCG & official datasets
        policies = data_loader.get_all_policies()
        chunks = data_loader.get_all_manual_chunks()
        hospitals = data_loader.get_all_hospitals()

        # Match policies
        for p in policies:
            title = str(p.get("policy_name") or p.get("title") or "")
            desc = str(p.get("description") or p.get("coverage_details") or p.get("summary") or "")
            scheme = str(p.get("scheme_type") or p.get("scheme") or "สิทธิสุขภาพ")
            
            if not q_lower or (q_lower in title.lower() or q_lower in desc.lower() or q_lower in scheme.lower()):
                results.append({
                    "title": title or "ระเบียบสิทธิประโยชน์สุขภาพ",
                    "snippet": desc[:280] + ("..." if len(desc) > 280 else ""),
                    "source": f"ฐานข้อมูลสิทธิประโยชน์ {scheme}",
                    "url": "https://www.nhso.go.th",
                    "agency": scheme,
                    "type": "policy",
                    "verified": True
                })

        # Match manual chunks & equipment rules
        for c in chunks:
            text = str(c.get("content") or c.get("text") or "")
            meta = c.get("meta") or {}
            chunk_title = str(meta.get("title") or meta.get("section") or "คู่มือสิทธิประโยชน์และกายอุปกรณ์")
            
            if q_lower in text.lower() or q_lower in chunk_title.lower():
                results.append({
                    "title": chunk_title,
                    "snippet": text[:280] + ("..." if len(text) > 280 else ""),
                    "source": "คู่มือแนวทางสวัสดิการและกายอุปกรณ์ทางการแพทย์",
                    "url": "https://www.m-society.go.th",
                    "agency": str(meta.get("agency") or "พม. / สปสช."),
                    "type": "guideline",
                    "verified": True
                })

        # Match hospitals & networks
        for h in hospitals:
            name = str(h.get("hospital_name") or h.get("name") or "")
            prov = str(h.get("province") or "")
            schemes = ", ".join(h.get("supported_schemes") or ["บัตรทอง", "ประกันสังคม"])
            
            if q_lower in name.lower() or q_lower in prov.lower():
                results.append({
                    "title": f"{name} ({prov})",
                    "snippet": f"สถานพยาบาลคู่สัญญา รองรับสิทธิ: {schemes}. โทรศัพท์: {h.get('phone', '1330')}",
                    "source": "เครือข่ายสถานพยาบาลภาครัฐ",
                    "url": "https://moph.go.th",
                    "agency": "กระทรวงสาธารณสุข",
                    "type": "hospital",
                    "verified": True
                })

        # 2. Add Live Web Search Fallback / Live External Queries via DuckDuckGo API
        if len(results) < 3 and q_lower:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    ddg_url = f"https://api.duckduckgo.com/?q={query}+สิทธิการรักษา+สปสช+พม&format=json&no_html=1&skip_disambig=1"
                    res = await client.get(ddg_url)
                    if res.status_code == 200:
                        ddg_data = res.json()
                        related = ddg_data.get("RelatedTopics", [])
                        for item in related[:3]:
                            if isinstance(item, dict) and "Text" in item:
                                results.append({
                                    "title": item.get("FirstURL", "").split("/")[-1].replace("_", " ") or query,
                                    "snippet": item.get("Text", ""),
                                    "source": "ผลการค้นหาเว็บสาธารณะ",
                                    "url": item.get("FirstURL", "https://www.nhso.go.th"),
                                    "agency": "Web Source",
                                    "type": "web",
                                    "verified": True
                                })
            except Exception as e:
                logger.warning(f"Live web search warning: {e}")

        # Limit and sort
        if agency_filter:
            results = [r for r in results if agency_filter.lower() in r["agency"].lower()]

        return results[:20]

web_search_service = WebSearchService()
