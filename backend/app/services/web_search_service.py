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
        "snippet": "คนไทยทุกสิทธิที่มีภาวะพึ่งพิงหรือติดเตียง โดยมีคะแนนประเมินกิจวัตรประจำวัน 0-11 หรือมีภาวะกลั้นปัสสาวะหรืออุจจาระไม่ได้ มีสิทธิรับผ้าอ้อมผู้ใหญ่โดยไม่มีค่าใช้จ่าย วันละไม่เกิน 3 ชิ้น ผ่านกองทุนหลักประกันสุขภาพท้องถิ่น ยื่นเรื่องที่ รพ.สต. อบต. หรือเทศบาล",
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
        "keywords": ["ทันตกรรม", "ทำฟัน", "อุดฟัน", "ถอนฟัน", "ขูดหินปูน", "ผ่าฟันคุด", "รากฟัน"],
        "title": "สิทธิประโยชน์ทันตกรรม ประกันสังคม 900 บาท/ปี ไม่ต้องสำรองจ่าย",
        "snippet": "ผู้ประกันตนมาตรา 33 และ 39 มีสิทธิทำฟัน ถอนฟัน อุดฟัน ขูดหินปูน ผ่าฟันคุด ได้ในวงเงิน 900 บาทต่อปี ณ คลินิกทันตกรรมคู่สัญญาโดยไม่ต้องสำรองจ่ายเงินสด",
        "url": "https://www.sso.go.th",
        "source": "สำนักงานประกันสังคม (สปส.)",
        "agency": "ประกันสังคม",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["ต้อกระจก", "เลนส์ตา", "เลนส์แก้วตาเทียม", "ผ่าตัดตา", "สลายต้อ", "ศิริราช"],
        "title": "สิทธิผ่าตัดต้อกระจกและเบิกเลนส์แก้วตาเทียม (ประกันสังคม และ สปสช.)",
        "snippet": "ผู้ประกันตน ม.33/39 และสิทธิบัตรทอง ผ่าตัดสลายต้อกระจกฟรี ณ รพ.ตามสิทธิ และสามารถเบิกค่าเลนส์แก้วตาเทียมมาตรฐานได้ 2,800 บาท (เลนส์แข็ง) หรือ 4,000 บาท (เลนส์พับได้) ต่อข้าง ส่วนเกินหรือเลนส์พิเศษสามารถใช้ประกันสุขภาพกลุ่มเบิกจ่ายตามความคุ้มครองได้",
        "url": "https://www.sso.go.th",
        "source": "สำนักงานประกันสังคม / สปสช.",
        "agency": "ประกันสังคม & สปสช.",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["มะเร็ง", "cancer anywhere", "มะเร็งรักษาทุกที่", "เคมีบำบัด", "ฉายแสง", "คีโม"],
        "title": "นโยบายโรคมะเร็งไปรับบริการที่ไหนก็ได้ที่พร้อม (Cancer Anywhere) สปสช.",
        "snippet": "ผู้ป่วยโรคมะเร็งสิทธิบัตรทองที่ได้รับการวินิจฉัยแล้ว สามารถเข้ารับการรักษา (ผ่าตัด, เคมีบำบัด, รังสีรักษา) ณ โรงพยาบาลระดับตติยภูมิที่มีศักยภาพ (เช่น รพ.จุฬาฯ, ศิริราช, รามาฯ) ได้ทั่วประเทศผ่านระบบ Cancer Anywhere โดยไม่ต้องใช้ใบส่งตัวจากต่างจังหวัด",
        "url": "https://www.nhso.go.th",
        "source": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)",
        "agency": "สปสช. (Cancer Anywhere)",
        "type": "official_policy",
        "verified": True,
    },
    {
        "keywords": ["คลอดบุตร", "สงเคราะห์บุตร", "ตู้อบ", "ทารกแรกเกิด", "nicu", "ม.39", "ม.33"],
        "title": "สิทธิประโยชน์กรณีคลอดบุตร สงเคราะห์บุตร (ประกันสังคม) และสิทธิรักษาทารกแรกเกิด (สปสช.)",
        "snippet": "ประกันสังคมจ่ายค่าคลอดบุตรเหมาจ่าย 15,000 บาท/ครั้ง + เงินสงเคราะห์การหยุดงาน 50% ของค่าจ้าง 90 วัน + เงินสงเคราะห์บุตร 800 บาท/เดือนต่อคน (แรกเกิด-6 ปี) สำหรับค่ารักษาทารกแรกเกิด/ตู้อบใน รพ.รัฐ ใช้สิทธิบัตรทองเด็กแรกเกิดคุ้มครองฟรี 100%",
        "url": "https://www.sso.go.th",
        "source": "สำนักงานประกันสังคม / สปสช.",
        "agency": "ประกันสังคม & สปสช.",
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
    if any(d in combined for d in ["th.wikipedia.org", "wikipedia"]):
        return "สารานุกรมวิกิพีเดีย"
    if any(gov in url for gov in [".go.th", ".or.th"]):
        return "เว็บไซต์ทางการ"
    return "ผลการค้นหาเว็บสด"


async def _search_wikipedia_th(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """Live encyclopedic search from Thai Wikipedia API."""
    url = "https://th.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "format": "json",
        "utf8": 1,
        "srlimit": max_results
    }
    headers = {"User-Agent": "CarePulseAI/1.0 (Live Assistant Search)"}
    results = []
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("query", {}).get("search", []):
                    clean_snippet = re.sub(r"<[^>]+>", "", item.get("snippet", ""))
                    clean_title = item.get("title", "")
                    if clean_title:
                        results.append({
                            "title": clean_title,
                            "snippet": clean_snippet,
                            "url": f"https://th.wikipedia.org/wiki/{urllib.parse.quote(clean_title)}",
                            "source": "th.wikipedia.org",
                            "agency": "สารานุกรมวิกิพีเดีย",
                            "type": "live_web",
                            "verified": True
                        })
    except Exception as e:
        logger.warning(f"Wikipedia search warning: {e}")
    return results


async def _search_duckduckgo_post(query: str, max_results: int = 8) -> List[Dict[str, Any]]:
    """Scrape real organic search results from DuckDuckGo HTML endpoint without mockups."""
    url = "https://html.duckduckgo.com/html/"
    payload = {
        "q": query.strip(),
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

                    raw_href = title_tag.get("href", "")
                    # Filter out sponsored ads
                    if any(ad in raw_href for ad in ["duckduckgo.com/y.js", "bing.com/aclick", "ad_provider", "ad_domain"]):
                        continue

                    actual_url = raw_href
                    if "uddg=" in raw_href:
                        try:
                            actual_url = urllib.parse.unquote(raw_href.split("uddg=")[1].split("&")[0])
                        except Exception:
                            actual_url = raw_href

                    title = title_tag.get_text(strip=True)
                    snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""
                    display_url = url_tag.get_text(strip=True) if url_tag else actual_url

                    if title and len(title) > 2:
                        agency = _detect_agency(actual_url, snippet + " " + title)
                        results.append({
                            "title": title,
                            "snippet": snippet or f"ข้อมูลสืบค้นสดจาก {display_url}",
                            "source": display_url or "ค้นเว็บผ่าน DuckDuckGo",
                            "url": actual_url,
                            "agency": agency,
                            "type": "live_web",
                            "verified": any(gov in actual_url for gov in [".go.th", ".or.th", ".ac.th"]),
                        })
                logger.info(f"DuckDuckGo Live Search: '{query}' -> {len(results)} organic results")
    except Exception as e:
        logger.warning(f"DuckDuckGo search error: {e}")

    return results


SEARCH_PREFIX_PATTERNS = [
    r'^(ค้นหาข้อมูล|หาข้อมูล|ขอข้อมูล|ค้นหา|ช่วยหา|ช่วยค้นหา|สืบค้นข้อมูล|อยากรู้ข้อมูล|ข้อมูลเกี่ยวกับ|ข้อมูลของ)\s*',
    r'^(ช่วยบอก|บอกหน่อย|อธิบาย|ช่วยอธิบาย|อยากรู้ว่า|สรุปข้อมูล|เล่าเรื่อง|อยากทราบ)\s*'
]

def clean_search_query(q: str) -> str:
    cleaned = q.strip()
    for p in SEARCH_PREFIX_PATTERNS:
        cleaned = re.sub(p, '', cleaned, flags=re.IGNORECASE).strip()
    return cleaned if len(cleaned) >= 2 else q.strip()


class WebSearchService:
    """
    Real-time Live Web Search Service for CarePulse AI.
    Integrates DuckDuckGo Live Search + Wikipedia TH Live Knowledge + Verified Thai Regulations.
    """

    @staticmethod
    async def search_welfare_and_web(query: str, agency_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        target_query = clean_search_query(query)
        q_clean = target_query.lower()

        # 1. Fetch live organic web search results from DuckDuckGo
        live_results = await _search_duckduckgo_post(target_query, max_results=8)
        results.extend(live_results)

        # 2. Fetch live encyclopedic facts from Wikipedia TH for knowledge lookups
        if len(results) < 4:
            wiki_results = await _search_wikipedia_th(target_query, max_results=3)
            results.extend(wiki_results)

        # 3. Add relevant curated official welfare regulations ONLY when query matches health keywords
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

        # Remove duplicate URLs while maintaining order
        seen_urls = set()
        unique_results = []
        for r in results:
            u = r.get("url")
            if u and u not in seen_urls:
                seen_urls.add(u)
                unique_results.append(r)

        # Apply agency filter if specified
        if agency_filter and agency_filter != "all":
            filtered = [r for r in unique_results if agency_filter.lower() in r["agency"].lower() or agency_filter.lower() in r["title"].lower()]
            if filtered:
                unique_results = filtered

        logger.info(f"WebSearchService: query='{query}' -> {len(unique_results)} total live results")
        return unique_results[:12]


web_search_service = WebSearchService()
