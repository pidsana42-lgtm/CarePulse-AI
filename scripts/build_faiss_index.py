"""
build_faiss_index.py
====================
Script สำหรับ rebuild FAISS vector index จากข้อมูลทั้งหมดใน data/
ด้วย real sentence-transformers embeddings

รัน:
    python scripts/build_faiss_index.py
"""

import json
import os
import sys
import logging

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
FAISS_DIR = os.path.join(DATA_DIR, "faiss")
INDEX_PATH = os.path.join(FAISS_DIR, "corpus.index")
META_PATH = os.path.join(FAISS_DIR, "meta.json")

# Model เดิมที่โปรเจคใช้ (multilingual, รองรับภาษาไทย)
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

os.makedirs(FAISS_DIR, exist_ok=True)


# ─── Helpers ──────────────────────────────────────────────────────────────────
def load_jsonl(filename: str) -> list:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        logger.warning(f"ไม่พบไฟล์: {path}")
        return []
    items = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    items.append(json.loads(line))
                except Exception as e:
                    logger.warning(f"Parse error ใน {filename}: {e}")
    return items


# ─── Document Builders ────────────────────────────────────────────────────────
def build_docs_from_policies(records: list) -> list:
    docs = []
    for r in records:
        title = r.get("title", "")
        summary = r.get("summary", "")
        keywords = " ".join(r.get("keywords", []))
        section = r.get("section", "")
        # รวม field ที่สำคัญเป็น text เดียว
        text = f"{title}\n{summary}\n{keywords}\n{section}".strip()
        if not text:
            continue
        docs.append({
            "id": r.get("id", ""),
            "kind": "policy",
            "title": title,
            "category": r.get("source", "general"),
            "text": text,
        })
    return docs


def build_docs_from_manual_chunks(records: list) -> list:
    docs = []
    for r in records:
        heading = r.get("heading", "")
        text = r.get("text", "")
        full_text = f"{heading}\n{text}".strip() if heading else text.strip()
        if not full_text:
            continue
        docs.append({
            "id": r.get("id", ""),
            "kind": "manual",
            "title": heading or r.get("source", "คู่มือสิทธิการรักษา"),
            "category": r.get("source", "general"),
            "text": full_text,
        })
    return docs


def build_docs_from_scraped(records: list) -> list:
    docs = []
    for r in records:
        title = r.get("title", "")
        summary = r.get("summary", "")
        keywords = " ".join(r.get("keywords", []))
        text = f"{title}\n{summary}\n{keywords}".strip()
        if not text:
            continue
        docs.append({
            "id": r.get("id", ""),
            "kind": "scraped",
            "title": title,
            "category": r.get("source", "web"),
            "text": text,
        })
    return docs


def build_docs_from_hospitals(records: list) -> list:
    docs = []
    for r in records:
        name = r.get("name", "")
        province = r.get("province", "")
        schemes = ", ".join(r.get("schemes", []))
        hospital_type = r.get("type", "")
        text = f"โรงพยาบาล {name} จังหวัด {province} รับสิทธิ {schemes} ประเภท {hospital_type}".strip()
        docs.append({
            "id": r.get("id", ""),
            "kind": "hospital",
            "title": name,
            "category": "hospital",
            "text": text,
        })
    return docs


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    # 1. โหลดข้อมูลทั้งหมด
    logger.info("📂 โหลดข้อมูลจากไฟล์ .jsonl ...")
    policies       = load_jsonl("policies.jsonl")
    manual_chunks  = load_jsonl("manual_chunks.jsonl")
    scraped        = load_jsonl("scraped_policies.jsonl")
    hospitals      = load_jsonl("hospitals.jsonl")

    # 2. แปลงเป็น document list
    docs = []
    docs += build_docs_from_policies(policies)
    docs += build_docs_from_manual_chunks(manual_chunks)
    docs += build_docs_from_scraped(scraped)
    docs += build_docs_from_hospitals(hospitals)

    logger.info(f"📄 รวมทั้งหมด {len(docs)} documents")
    if not docs:
        logger.error("ไม่พบข้อมูลเลย ตรวจสอบไฟล์ .jsonl ใน data/")
        sys.exit(1)

    # 3. สร้าง embeddings ด้วย sentence-transformers
    logger.info(f"🤖 โหลด model: {MODEL_NAME} ...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(MODEL_NAME)

    texts = [d["text"] for d in docs]
    logger.info(f"🔢 กำลัง embed {len(texts)} documents (อาจใช้เวลาสักครู่) ...")
    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,  # cosine similarity ใช้ normalize แล้ว inner product
        convert_to_numpy=True,
    )
    embeddings = np.array(embeddings, dtype="float32")
    dim = embeddings.shape[1]
    logger.info(f"✅ Embedding shape: {embeddings.shape} (dim={dim})")

    # 4. สร้าง FAISS index (IndexFlatIP = Inner Product หลัง normalize = Cosine)
    import faiss
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    logger.info(f"📦 FAISS index สร้างแล้ว: {index.ntotal} vectors")

    # 5. บันทึก index และ metadata
    faiss.write_index(index, INDEX_PATH)
    logger.info(f"💾 บันทึก FAISS index → {INDEX_PATH}")

    meta = {
        "model": MODEL_NAME,
        "dim": dim,
        "total": len(docs),
        "docs": docs,
    }
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    logger.info(f"💾 บันทึก metadata → {META_PATH}")

    # 6. ทดสอบค้นหา
    logger.info("\n🔍 ทดสอบ semantic search ...")
    test_queries = [
        "สิทธิบัตรทอง 30 บาทรักษาทุกที่ใช้ได้อย่างไร",
        "ผู้ป่วยติดเตียงขอรถเข็นฟรีได้ที่ไหน",
        "ประกันสังคม มาตรา 33 เบิกค่าคลอดบุตรได้เท่าไหร่",
    ]

    for q in test_queries:
        vec = model.encode([q], normalize_embeddings=True)
        vec = np.array(vec, dtype="float32")
        scores, indices = index.search(vec, 3)
        print(f"\n❓ Query: {q}")
        for rank, (score, idx) in enumerate(zip(scores[0], indices[0]), 1):
            doc = docs[idx]
            print(f"  [{rank}] score={score:.4f} | {doc['kind']} | {doc['title'][:60]}")

    logger.info("\n✅ สร้าง FAISS index เสร็จสมบูรณ์!")


if __name__ == "__main__":
    main()
