from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.web_search_service import web_search_service, OFFICIAL_HEALTH_PORTALS

router = APIRouter()

class SearchResultItem(BaseModel):
    title: str
    snippet: str
    source: str
    url: str
    agency: str
    type: str
    verified: bool = True

class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]
    official_portals: List[Dict[str, str]]

@router.get("", response_model=SearchResponse)
async def search_welfare_and_policies(
    q: str = Query(..., min_length=1, description="Search query string"),
    agency: Optional[str] = Query(None, description="Filter by agency (สปสช., พม., ประกันสังคม, ฯลฯ)")
):
    """
    Search healthcare rights, welfare benefits, medical equipment regulations, and hospitals.
    """
    results_raw = await web_search_service.search_welfare_and_web(q, agency)
    return SearchResponse(
        query=q,
        total=len(results_raw),
        results=[SearchResultItem(**r) for r in results_raw],
        official_portals=OFFICIAL_HEALTH_PORTALS
    )
