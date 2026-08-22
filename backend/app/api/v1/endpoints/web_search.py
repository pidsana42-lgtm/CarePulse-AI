from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.web_search_service import web_search_service

OFFICIAL_HEALTH_PORTALS = [
    {"name": "สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)", "domain": "nhso.go.th", "hotline": "1330"},
    {"name": "กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.)", "domain": "m-society.go.th", "hotline": "1300"},
    {"name": "สำนักงานประกันสังคม (สปส.)", "domain": "sso.go.th", "hotline": "1506"},
    {"name": "กรมบัญชีกลาง (สวัสดิการข้าราชการ)", "domain": "cgd.go.th", "hotline": "02-270-6400"},
    {"name": "สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)", "domain": "niems.go.th", "hotline": "1669"},
    {"name": "กองทุนหลักประกันสุขภาพระดับท้องถิ่น (กปท.)", "domain": "localhealth.nhso.go.th", "hotline": "1330"},
]

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
