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
}

# Government website categories
AGENCY_DOMAINS = {
    "สปสช": ["nhso.go.th", "localhealth.nhso.go.th"],
    "พม": ["m-society.go.th", "dep.go.th", "dsdw.go.th"],
    "กองทุน": ["localhealth.nhso.go.th", "dla.go.th"],
    "ประกันสังคม": ["sso.go.th"],
    "ข้าราชการ": ["cgd.go.th"],
}


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


async def _search_duckduckgo(query: str, max_results: int = 8) -> List[Dict[str, Any]]:
    """Scrape real search results from DuckDuckGo HTML endpoint."""
    encoded = urllib.parse.quote(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded}"
    results: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                logger.warning(f"DuckDuckGo returned {resp.status_code}")
                return []

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

                # Decode DuckDuckGo redirect URL
                actual_url = raw_href
                if "uddg=" in raw_href:
                    try:
                        actual_url = urllib.parse.unquote(raw_href.split("uddg=")[1].split("&")[0])
                    except Exception:
                        actual_url = raw_href

                display_url = url_tag.get_text(strip=True) if url_tag else actual_url

                if title and (snippet or actual_url):
                    agency = _detect_agency(actual_url, snippet)
                    results.append({
                        "title": title,
                        "snippet": snippet or f"ข้อมูลจาก {display_url}",
                        "source": display_url or "DuckDuckGo Live Search",
                        "url": actual_url,
                        "agency": agency,
                        "type": "live_web",
                        "verified": any(gov in actual_url for gov in [".go.th", ".or.th", ".ac.th"]),
                    })

        logger.info(f"DuckDuckGo scrape: '{query}' → {len(results)} results")
    except Exception as e:
        logger.error(f"DuckDuckGo scrape error: {e}")

    return results


class WebSearchService:
    """
    Real-time Live Web Search Service for CarePulse AI.
    Scrapes actual search results from DuckDuckGo for Thai healthcare policies,
    welfare benefits, and assistive device regulations.
    """

    @staticmethod
    async def search_welfare_and_web(query: str, agency_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        q_lower = query.lower().strip()

        # Build search query — prioritise Thai government sites
        site_filter = ""
        if agency_filter and agency_filter != "all":
            domains = AGENCY_DOMAINS.get(agency_filter, [])
            if domains:
                site_filter = " OR ".join(f"site:{d}" for d in domains)

        search_query = f"{query} สิทธิประโยชน์สุขภาพ ระเบียบราชการ"
        if site_filter:
            search_query = f"({site_filter}) {query}"

        # 1. Live web scrape — primary source
        live_results = await _search_duckduckgo(search_query, max_results=10)
        results.extend(live_results)

        # 2. If no good results, try broader Thai welfare query
        if len(results) < 3:
            broader_results = await _search_duckduckgo(
                f"{query} Thailand welfare สปสช พม nhso.go.th",
                max_results=6
            )
            # Avoid duplicates
            existing_urls = {r["url"] for r in results}
            for r in broader_results:
                if r["url"] not in existing_urls:
                    results.append(r)

        # Apply agency filter
        if agency_filter and agency_filter != "all":
            filtered = [r for r in results if agency_filter.lower() in r["agency"].lower()]
            if filtered:
                results = filtered

        logger.info(f"WebSearchService: query='{query}' filter='{agency_filter}' → {len(results)} total results")
        return results[:20]


web_search_service = WebSearchService()
