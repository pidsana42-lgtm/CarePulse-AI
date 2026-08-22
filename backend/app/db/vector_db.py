import logging
import os
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.core.config import settings
from app.services.data_loader import data_loader

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
            # 384 dimensions for compact embeddings
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            logger.info(f"Created vector collection '{self.collection_name}'.")
            self._seed_policies_from_scg_data()

    def _seed_policies_from_scg_data(self):
        """Seed policies and manual chunks from imported SCG datasets."""
        policies = data_loader.get_all_policies()
        chunks = data_loader.get_all_manual_chunks()
        
        points = []
        point_id = 1

        # 1. Ingest Policies
        for policy in policies:
            dummy_vector = [0.03] * 384
            dummy_vector[point_id % 384] = 0.97
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=dummy_vector,
                    payload={
                        "policy_id": policy.get("id"),
                        "title": policy.get("title", "ระเบียบสิทธิการรักษาพยาบาล"),
                        "description": policy.get("summary", ""),
                        "source": policy.get("source", "NHSO"),
                        "eligibility_rules": policy.get("eligibility_rules", {}),
                        "keywords": policy.get("keywords", []),
                        "scheme_code": policy.get("source", "UC"),
                    }
                )
            )
            point_id += 1

        # 2. Ingest Manual RAG Chunks
        for chunk in chunks:
            dummy_vector = [0.04] * 384
            dummy_vector[point_id % 384] = 0.96
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=dummy_vector,
                    payload={
                        "chunk_id": chunk.get("chunk_id"),
                        "title": chunk.get("title", "ข้อมูลความรู้สิทธิการรักษา"),
                        "description": chunk.get("content", chunk.get("text", "")),
                        "source": chunk.get("source", "RAG Knowledge"),
                        "scheme_code": "GENERAL",
                    }
                )
            )
            point_id += 1

        if points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Successfully seeded {len(points)} knowledge points from SCG datasets into Vector DB.")


vector_db = VectorDBManager()
