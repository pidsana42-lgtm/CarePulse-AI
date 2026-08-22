import logging
import urllib.parse
import re
from typing import List, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://html.duckduckgo.com/",
    "Content-Type": "application/x-www-form-urlencoded",
}

# Curated Official Thai Healthcare Regulations Knowledge Base (Always accessible fallback)
OFFICIAL_WELFARE_CATALOG = [
    {
        "keywords": ["ผ้าอ้อม", "แผ่นรองซับ", "กปท", "ติดเตียง", "ผู้สูงอายุ", "ขับถ่าย"],
        "title": "สิทธิรับผ้าอ้อมผู้ใหญ่และแผ่นรองซับฟรี วันละไม่เกิน 3 ชิ้น (กองทุน กปท. / สปสช.)",
        "snippet": "คนไทยทุกสิทธิที่มีภาวะพึ่งพิง/ติดเตียง (ADL 0-11) หรือภาวะกลั้นปัสสาวะ/อุจจาระไม่ได้ มีสิทธิรับผ้าอ้อมผู้ใหญ่ฟรีวันละไม่เกิน 3 ชิ้น ผ่านกองทุนหลักประกันสุขภาพท้องถิ่น (กปท.) ยื่นเรื่องที่ รพ.สต. หรือ อบต./เทศบาล",
        "url": "https://www.nhso.go.th/news/3762",
        "source": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
        "agency": "สปสช. / กปท.",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["เตียง", "รถเข็น", "wheelchair", "วอล์กเกอร์", "กายอุปกรณ์", "พม", "คนพิการ"],
        "title": "สิทธิยืม/รับกายอุปกรณ์ เตียงผู้ป่วยปรับระดับ และรถเข็นวีลแชร์ (กระทรวง พม. และ สปสช.)",
        "snippet": "ผู้พิการและผู้สูงอายุที่มีภาวะพึ่งพิงสามารถขอรับหรือยืมกายอุปกรณ์ทางการแพทย์ (เตียงผู้ป่วย, รถเข็น, ที่นอนลม, ไม้เท้า) ฟรี ยื่นคำขอได้ที่สำนักงาน พมจ. ประจำจังหวัด, รพ.สต. หรือศูนย์บริการคนพิการ โทรสายด่วน พม. 1300",
        "url": "https://www.dep.go.th",
        "source": "กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ (พม.)",
        "agency": "กระทรวง พม.",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["ทันตกรรม", "ทำฟัน", "อุดฟัน", "ถอนฟัน", "ขูดหินปูน", "ผ่าฟันคุด", "ประกันสังคม"],
        "title": "สิทธิประโยชน์ทันตกรรม ประกันสังคม 900 บาท/ปี ไม่ต้องสำรองจ่าย",
        "snippet": "ผู้ประกันตนมาตรา 33 และ 39 มีสิทธิทำฟัน ถอนฟัน อุดฟัน ขูดหินปูน ผ่าฟันคุด ได้ในวงเงิน 900 บาทต่อปี ณ คลินิกทันตกรรมคู่สัญญาโดยไม่ต้องสำรองจ่ายเงินสด",
        "url": "https://www.sso.go.th",
        "source": "สำนักงานประกันสังคม (สปส.)",
        "agency": "ประกันสังคม",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["30 บาท", "บัตรทอง", "รักษาทุกที่", "ต่างจังหวัด", "ปฐมภูมิ"],
        "title": "นโยบาย 30 บาทรักษาทุกที่ ด้วยบัตรประชาชนใบเดียว (สปสช.)",
        "snippet": "ผู้มีสิทธิบัตรทองสามารถเข้ารับการรักษาพยาบาลที่หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และร้านยาคุณภาพที่เข้าร่วมโครงการได้ทั่วประเทศ ไม่ต้องใช้ใบส่งตัว",
        "url": "https://www.nhso.go.th",
        "source": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
        "agency": "สปสช. (บัตรทอง)",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["ฉุกเฉิน", "ucep", "1669", "วิกฤต", "72 ชม", "หัวใจ", "หมดสติ"],
        "title": "สิทธิเจ็บป่วยฉุกเฉินวิกฤต มีสิทธิทุกที่ UCEP 72 ชั่วโมงแรก (สพฉ.)",
        "snippet": "กรณีเจ็บป่วยฉุกเฉินวิกฤตถึงแก่ชีวิต สามารถเข้ารับการรักษาในโรงพยาบาลที่ใกล้ที่สุดได้ทุกแห่ง ทั้งรัฐและเอกชน โดยไม่ต้องสำรองจ่ายเงินใน 72 ชั่วโมงแรก โทร 1669",
        "url": "https://www.niems.go.th",
        "source": "สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)",
        "agency": "สพฉ. (ฉุกเฉิน UCEP)",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["ฟอกไต", "ไตวาย", "capd", "hd", "ล้างไต"],
        "title": "สิทธิประโยชน์การบำบัดทดแทนไต (ฟอกเลือด HD และล้างไตทางช่องท้อง CAPD) ฟรี",
        "snippet": "สปสช. ให้สิทธิผู้ป่วยไตวายเรื้อรังระยะสุดท้ายเลือกวิธีบำบัดทดแทนไตได้ ทั้งฟอกเลือดผ่านเครื่องไตเทียม (HD) หรือล้างไตทางช่องท้อง (CAPD) โดยไม่มีค่าใช้จ่าย",
        "url": "https://www.nhso.go.th",
        "source": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
        "agency": "สปสช. (บัตรทอง)",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["ออกซิเจน", "เครื่องผลิตออกซิเจน", "หายใจ", "ปอด"],
        "title": "สิทธิขอรับเครื่องผลิตออกซิเจนและถังออกซิเจนสำหรับผู้ป่วยที่บ้าน",
        "snippet": "ผู้ป่วยที่มีภาวะออกซิเจนในเลือดต่ำเรื้อรัง สามารถขอรับการสนับสนุนเครื่องผลิตออกซิเจนและอุปกรณ์ช่วยหายใจผ่านศูนย์บริการยืมคืนอุปกรณ์ของ รพ. หรือกองทุนสุขภาพตำบล",
        "url": "https://localhealth.nhso.go.th",
        "source": "กองทุนหลักประกันสุขภาพระดับท้องถิ่น (กปท.)",
        "agency": "สปสช. / กปท.",
        "type": "official_policy",
        "verified": True,
    }
]


def _detect_agency(url: str, snippet: str) -> str:
    combined = (url + " " + snippet).lower()
    if any(d in combined for d in ["nhso.go.th", "สปสช", "หลักประกันสุขภาพ", "บัตรทอง"]):
        return "สปสช. (บัตรทอง)"
    if any(d in combined for d in ["sso.go.th", "ประกันสังคม"]):
        return "ประกันสังคม"
    if any(d in combined for d in ["m-society.go.th", "dep.go.th", "dsdw", "พม", "คนพิการ"]):
        return "กระทรวง พม."
    if any(d in combined for d in ["localhealth", "กองทุนสุขภาพตำบล", "กปท", "อบต", "เทศบาล"]):
        return "กองทุนสุขภาพตำบล (กปท.)"
    if any(d in combined for d in ["cgd.go.th", "ข้าราชการ", "กรมบัญชีกลาง"]):
        return "กรมบัญชีกลาง"
    if any(d in combined for d in ["niems.go.th", "ฉุกเฉิน", "ucep"]):
        return "สพฉ. (ฉุกเฉิน UCEP)"
    return "เว็บไซต์ทางการ"


async def _search_duckduckgo_post(query: str, max_results: int = 8) -> List[Dict[str, Any]]:
    """Scrape real search results from DuckDuckGo HTML POST endpoint."""
    url = "https://html.duckduckgo.com/html/"
    payload = {
        "q": f"{query} สิทธิ สวัสดิการ ระเบียบ",
        "b": "",
        "kl": "th-th"
    }
    results: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            resp = await client.post(url, data=payload, headers=HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for div in soup.find_all("div", class_="result"):
                    if len(results) >= max_results:
                        break

                    title_tag = div.find("a", class_="result__a")
                    snippet_tag = div.find("a", class_="result__snippet")
                    url_tag = div.find("a", class_="result__url")

                    if not title_tag:
                        continue

                    title = title_tag.get_text(strip=True)
                    snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""
                    raw_href = title_tag.get("href", "")

                    actual_url = raw_href
                    if "uddg=" in raw_href:
                        try:
                            actual_url = urllib.parse.unquote(raw_href.split("uddg=")[1].split("&")[0])
                        except Exception:
                            actual_url = raw_href

                    display_url = url_tag.get_text(strip=True) if url_tag else actual_url

                    if title and len(title) > 3:
                        agency = _detect_agency(actual_url, snippet + " " + title)
                        results.append({
                            "title": title,
                            "snippet": snippet or f"ข้อมูลระเบียบจาก {display_url}",
                            "source": display_url or "DuckDuckGo Live Search",
                            "url": actual_url,
                            "agency": agency,
                            "type": "live_web",
                            "verified": any(gov in actual_url for gov in [".go.th", ".or.th", ".ac.th"]),
                        })
                logger.info(f"DuckDuckGo POST: '{query}' -> {len(results)} live results")
    except Exception as e:
        logger.warning(f"DuckDuckGo POST scrape error: {e}")

    return results


class WebSearchService:
    """
    Real-time Live Web Search Service for CarePulse AI.
    Combines live web search (DuckDuckGo POST scraper) with official verified Thai regulations.
    """

    @staticmethod
    async def search_welfare_and_web(query: str, agency_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        q_clean = query.strip().lower()

        # 1. Fetch live web search results via POST
        live_results = await _search_duckduckgo_post(query, max_results=8)
        results.extend(live_results)

        # 2. Add relevant curated official welfare regulations that match query keywords
        matched_official = []
        for item in OFFICIAL_WELFARE_CATALOG:
            if any(kw in q_clean for kw in item["keywords"]):
                matched_official.append({
                    "title": item["title"],
                    "snippet": item["snippet"],
                    "source": item["source"],
                    "url": item["url"],
                    "agency": item["agency"],
                    "type": item["type"],
                    "verified": item["verified"],
                })

        # Prepend matched official regulations to the top so citizens get official answers first
        existing_titles = {r["title"] for r in results}
        for item in reversed(matched_official):
            if item["title"] not in existing_titles:
                results.insert(0, item)

        # 3. If still empty, provide general official health results
        if not results:
            for item in OFFICIAL_WELFARE_CATALOG[:3]:
                results.append({
                    "title": item["title"],
                    "snippet": item["snippet"],
                    "source": item["source"],
                    "url": item["url"],
                    "agency": item["agency"],
                    "type": item["type"],
                    "verified": item["verified"],
                })

        # Apply agency filter if specified
        if agency_filter and agency_filter != "all":
            filtered = [r for r in results if agency_filter.lower() in r["agency"].lower() or agency_filter.lower() in r["title"].lower()]
            if filtered:
                results = filtered

        logger.info(f"WebSearchService: query='{query}' filter='{agency_filter}' -> {len(results)} total results")
        return results[:15]


web_search_service = WebSearchService()
