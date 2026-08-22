from fastapi import APIRouter
from typing import List
from app.models.document import SemanticSearchRequest, SemanticSearchResult
from app.services.rag_service import rag_service

router = APIRouter()


@router.post("/search", response_model=List[SemanticSearchResult])
async def search_healthcare_knowledge(request: SemanticSearchRequest):
    """
    Search healthcare rights, hospital guidelines, and policy knowledge base
    using Semantic Vector Search.
    """
    return rag_service.search_benefits(request.query, request.top_k)
