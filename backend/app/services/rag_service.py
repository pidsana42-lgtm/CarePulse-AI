import logging
from typing import List

from app.db.faiss_store import faiss_store
from app.models.document import SemanticSearchResult

logger = logging.getLogger(__name__)


class SemanticRAGService:
    """
    Retrieval-Augmented Generation over the CarePulse policy/manual/hospital corpus.
    Backed by a real FAISS vector index (data/faiss/corpus.index) built from
    policies.jsonl, manual_chunks.jsonl and scraped_policies.jsonl — the query is
    embedded with the same sentence-transformers model used at index build time,
    so results are ranked by actual semantic similarity to the user's question.
    """

    @staticmethod
    def search_benefits(query: str, top_k: int = 3) -> List[SemanticSearchResult]:
        try:
            hits = faiss_store.search(query, top_k=top_k)
            return [
                SemanticSearchResult(
                    title=hit["title"] or hit["id"],
                    description=hit["text"],
                    scheme_code=hit["category"],
                    similarity_score=hit["similarity_score"],
                    source_id=hit["id"],
                )
                for hit in hits
            ]
        except Exception as e:
            logger.error(f"Error during semantic vector search: {e}")
            return []


rag_service = SemanticRAGService()
