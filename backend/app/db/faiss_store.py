import json
import logging
import os
import threading
from typing import Any, Dict, List

import numpy as np

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
INDEX_PATH = os.path.join(DATA_DIR, "faiss", "corpus.index")
META_PATH = os.path.join(DATA_DIR, "faiss", "meta.json")


class FaissKnowledgeStore:
    """
    Real semantic retrieval over the CarePulse policy/manual/hospital corpus.
    Loads the pre-built FAISS index (data/faiss/corpus.index) and encodes queries
    with the same sentence-transformers model used to build it (data/faiss/meta.json).
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._index = None
        self._docs: List[Dict[str, Any]] = []
        self._model = None
        self._model_name: str = ""
        self._loaded = False

    def _ensure_loaded(self):
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            try:
                import faiss  # local import: heavy dependency, only needed when RAG is used

                with open(META_PATH, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                self._docs = meta["docs"]
                self._model_name = meta["model"]
                self._index = faiss.read_index(INDEX_PATH)
                logger.info(
                    f"Loaded FAISS knowledge base: {self._index.ntotal} docs, model={self._model_name}"
                )
            except Exception as e:
                logger.error(f"Failed to load FAISS index from {INDEX_PATH}: {e}")
                self._index = None
                self._docs = []
            self._loaded = True

    def _ensure_model(self):
        if self._model is not None:
            return
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(self._model_name)

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        self._ensure_loaded()
        if self._index is None or not query.strip():
            return []

        try:
            self._ensure_model()
            vector = self._model.encode([query], normalize_embeddings=True)
            vector = np.asarray(vector, dtype="float32")
            scores, indices = self._index.search(vector, min(top_k, self._index.ntotal))

            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self._docs):
                    continue
                doc = self._docs[idx]
                results.append(
                    {
                        "id": doc.get("id"),
                        "kind": doc.get("kind"),
                        "title": doc.get("title", ""),
                        "category": doc.get("category", "general"),
                        "text": doc.get("text", ""),
                        "similarity_score": float(score),
                    }
                )
            return results
        except Exception as e:
            logger.error(f"FAISS semantic search failed: {e}")
            return []


faiss_store = FaissKnowledgeStore()
