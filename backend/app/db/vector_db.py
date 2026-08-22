import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorDBManager:
    """
    Manages connections and operations with Qdrant Vector Database
    for semantic retrieval and knowledge RAG (Healthcare Benefits).
    """

    def __init__(self):
        self.client: Optional[QdrantClient] = None
        self.collection_name = settings.VECTOR_COLLECTION_NAME

    def connect(self):
        """Connect to Qdrant or fallback to local in-memory storage."""
        try:
            logger.info(f"Connecting to Qdrant Vector DB at {settings.VECTOR_DB_HOST}:{settings.VECTOR_DB_PORT}...")
            self.client = QdrantClient(
                host=settings.VECTOR_DB_HOST,
                port=settings.VECTOR_DB_PORT,
                timeout=5.0
            )
            self._ensure_collection()
            logger.info("Connected to Qdrant Vector DB successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to standalone Qdrant ({e}). Initializing In-Memory Vector Store for development...")
            self.client = QdrantClient(":memory:")
            self._ensure_collection()

    def _ensure_collection(self):
        """Ensure the target collection exists."""
        if not self.client:
            return
        
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        
        if not exists:
            # 384 dimensions for standard compact embeddings or 768 / 1536
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            logger.info(f"Created vector collection '{self.collection_name}'.")
            self._seed_default_benefits()

    def _seed_default_benefits(self):
        """Seed initial standard Thai healthcare benefits policies into Vector DB."""
        # Simple simulated seed points for semantic matching demo
        seed_data = [
            {
                "id": 1,
                "title": "สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาทรักษาทุกที่)",
                "description": "ครอบคลุมการรักษาพยาบาล ค่ายา ค่าผ่าตัด การส่งเสริมสุขภาพและป้องกันโรคสำหรับคนไทยที่ไม่มีสิทธิสวัสดิการอื่น",
                "scheme_code": "UC",
                "coverage_rate": 100
            },
            {
                "id": 2,
                "title": "สิทธิประกันสังคม (มาตรา 33, 39, 40)",
                "description": "สิทธิการรักษาพยาบาลสำหรับผู้ประกันตน คลอดบุตร ทุพพลภาพ เจ็บป่วยฉุกเฉิน และทันตกรรมประจำปี 900 บาท",
                "scheme_code": "SSO",
                "coverage_rate": 100
            },
            {
                "id": 3,
                "title": "สิทธิสวัสดิการรักษาพยาบาลข้าราชการ (CSMBS)",
                "description": "สิทธิสำหรับข้าราชการ ลูกจ้างประจำ และครอบครัว (บิดา มารดา คู่สมรส บุตร) เบิกจ่ายตรง รพ.รัฐ และเอกชนตามเกณฑ์",
                "scheme_code": "CSMBS",
                "coverage_rate": 100
            },
            {
                "id": 4,
                "title": "สิทธิผู้สูงอายุ 60 ปีขึ้นไป และเบี้ยยังชีพ",
                "description": "บริการช่องทางพิเศษ (Fast track) คลินิกผู้สูงอายุ ผ้าอ้อมผู้ใหญ่ และการตรวจคัดกรองสุขภาพประจำปีฟรี",
                "scheme_code": "ELDERLY_CARE",
                "coverage_rate": 100
            }
        ]
        
        points = []
        for item in seed_data:
            # Generate deterministic dummy 384-d vector for bootstrap
            dummy_vector = [0.05] * 384
            dummy_vector[item["id"] % 384] = 0.95
            points.append(
                PointStruct(
                    id=item["id"],
                    vector=dummy_vector,
                    payload=item
                )
            )
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        logger.info("Default healthcare policy vectors seeded.")


vector_db = VectorDBManager()
