import logging
import urllib.parse
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class LiveWebSearchService:
    """
    Live real-time web search engine for CarePulse AI.
    Executes web searches on the internet and scrapes real-time results
    for healthcare policies, welfare news, and government regulations.
    """

    @staticmethod
    async def search_live_web(query: str, max_results: int = 4) -> List[Dict[str, str]]:
        if not query or not query.strip():
            return []

        search_query = f"{query.strip()} สิทธิการรักษา สปสช พม ประกันสังคม"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        results: List[Dict[str, str]] = []

        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    logger.warning(f"DuckDuckGo returned status {response.status_code}")
                    return []

                soup = BeautifulSoup(response.text, "html.parser")
                result_divs = soup.find_all("div", class_="result")

                for r in result_divs:
                    if len(results) >= max_results:
                        break

                    title_tag = r.find("a", class_="result__a")
                    snippet_tag = r.find("a", class_="result__snippet")

                    if title_tag:
                        title = title_tag.get_text(strip=True)
                        raw_href = title_tag.get("href", "")
                        
                        # Clean DuckDuckGo redirect URL
                        actual_url = raw_href
                        if "uddg=" in raw_href:
                            try:
                                actual_url = urllib.parse.unquote(raw_href.split("uddg=")[1].split("&")[0])
                            except Exception:
                                actual_url = raw_href

                        snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""
                        if title and snippet:
                            results.append({
                                "title": title,
                                "snippet": snippet,
                                "url": actual_url
                            })

                logger.info(f"Live web search for '{query}' found {len(results)} live results.")
                return results

        except Exception as e:
            logger.error(f"Live web search failed: {e}")
            return []


live_web_search = LiveWebSearchService()
