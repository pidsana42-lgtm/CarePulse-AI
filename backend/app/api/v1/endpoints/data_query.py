from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from app.services.data_loader import data_loader

router = APIRouter()


@router.get("/stats")
async def get_dataset_stats():
    """Returns total counts of imported SCG domain datasets."""
    policies = data_loader.get_all_policies()
    hospitals = data_loader.get_all_hospitals()
    insurance = data_loader.get_all_insurance_products()
    chunks = data_loader.get_all_manual_chunks()
    
    return {
        "source": "SCG Healthcare Dataset",
        "total_policies": len(policies),
        "total_hospitals": len(hospitals),
        "total_insurance_products": len(insurance),
        "total_knowledge_chunks": len(chunks),
        "status": "LOADED_AND_INDEXED"
    }


@router.get("/hospitals")
async def list_hospitals(province: Optional[str] = Query(None, description="Filter by province (e.g., 'Bangkok')")):
    """List hospitals and their supported schemes."""
    return data_loader.find_hospitals_by_province(province)


@router.get("/policies")
async def list_policies(scheme: Optional[str] = Query(None, description="Filter by scheme (e.g., 'NHSO', 'UC', 'SSS', 'CSMB')")):
    """List healthcare policies and eligibility rules."""
    if scheme:
        return data_loader.find_policies_by_scheme(scheme)
    return data_loader.get_all_policies()


@router.get("/insurance")
async def list_insurance_products():
    """List commercial health insurance products, coverage tiers, and copay rates."""
    return data_loader.get_all_insurance_products()
