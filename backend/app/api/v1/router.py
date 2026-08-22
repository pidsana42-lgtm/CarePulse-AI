from fastapi import APIRouter
from app.api.v1.endpoints import health_check, eligibility, ocr_document, semantic_rag, data_query

api_router = APIRouter()

api_router.include_router(health_check.router, prefix="/health", tags=["Health Check"])
api_router.include_router(eligibility.router, prefix="/eligibility", tags=["Healthcare Rights Eligibility"])
api_router.include_router(ocr_document.router, prefix="/documents", tags=["Document OCR & PDPA"])
api_router.include_router(semantic_rag.router, prefix="/knowledge", tags=["Semantic Search & RAG"])
api_router.include_router(data_query.router, prefix="/data", tags=["SCG Healthcare Datasets"])
