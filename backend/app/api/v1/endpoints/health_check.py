from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": "CarePulse AI Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "pdpa_compliance": "ACTIVE",
        "vector_search": "READY"
    }
