import json
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")


class SCGDataLoader:
    """
    Service to load and query official domain datasets imported from SCG:
    - Healthcare policies (NHSO, SSO, CSMBS)
    - Hospitals directory
    - Commercial insurance products
    - Manual RAG text chunks
    """

    @staticmethod
    def load_jsonl(filename: str) -> List[Dict[str, Any]]:
        file_path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(file_path):
            logger.warning(f"File {file_path} not found.")
            return []
        
        items = []
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        items.append(json.loads(line))
                    except Exception as e:
                        logger.error(f"Error parsing JSON line: {e}")
        return items

    @classmethod
    def get_all_policies(cls) -> List[Dict[str, Any]]:
        return cls.load_jsonl("policies.jsonl")

    @classmethod
    def get_all_hospitals(cls) -> List[Dict[str, Any]]:
        return cls.load_jsonl("hospitals.jsonl")

    @classmethod
    def get_all_insurance_products(cls) -> List[Dict[str, Any]]:
        return cls.load_jsonl("insurance_products.jsonl")

    @classmethod
    def get_all_manual_chunks(cls) -> List[Dict[str, Any]]:
        return cls.load_jsonl("manual_chunks.jsonl")

    @classmethod
    def find_hospitals_by_province(cls, province: Optional[str] = None) -> List[Dict[str, Any]]:
        hospitals = cls.get_all_hospitals()
        if not province or province == "all":
            return hospitals
        return [h for h in hospitals if province.lower() in h.get("province", "").lower()]

    @classmethod
    def find_policies_by_scheme(cls, scheme: str) -> List[Dict[str, Any]]:
        policies = cls.get_all_policies()
        return [
            p for p in policies 
            if scheme.lower() in p.get("source", "").lower() or 
               any(scheme.lower() in s.lower() for s in p.get("eligibility_rules", {}).get("schemes", [])) or
               any(scheme.lower() in k.lower() for k in p.get("keywords", []))
        ]


data_loader = SCGDataLoader()
