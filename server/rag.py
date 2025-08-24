# server/rag.py
import os, re
from typing import List, Dict
from chromadb import PersistentClient
from sentence_transformers import SentenceTransformer

CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_store")

# Local embedding model (you can choose another one if needed)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

client = PersistentClient(path=CHROMA_DIR)
collection = client.get_or_create_collection("docs")

def chunk_text(text: str, chunk_chars=900, overlap=150) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    chunks, i = [], 0
    while i < len(text):
        j = min(i + chunk_chars, len(text))
        k = text.rfind(". ", i, j)
        if k == -1: 
            k = j
        chunks.append(text[i:k].strip())
        i = max(k - overlap, i + chunk_chars - overlap)
    return [c for c in chunks if c]

def embed_text(text: str) -> List[float]:
    return embedder.encode(text).tolist()

def add_document(doc_id: str, source_name: str, text: str):
    chunks = chunk_text(text)
    ids, docs, embs, metas = [], [], [], []
    for i, ch in enumerate(chunks):
        ids.append(f"{doc_id}-{i}")
        docs.append(ch)
        embs.append(embed_text(ch))
        metas.append({"doc_id": doc_id, "source": source_name, "chunk": i})
    collection.add(ids=ids, documents=docs, embeddings=embs, metadatas=metas)
    return len(chunks)

def retrieve(question: str, top_k=6) -> List[Dict]:
    q_emb = embed_text(question)
    res = collection.query(query_embeddings=[q_emb], n_results=top_k)
    out = []
    for i in range(len(res["ids"][0])):
        out.append({
            "id": res["ids"][0][i],
            "text": res["documents"][0][i],
            "metadata": res["metadatas"][0][i],
        })
    return out

def assemble_context(hits: List[Dict], max_chars=6000) -> str:
    ctx, used = [], 0
    for h in hits:
        tag = f"[{h['metadata'].get('source','?')}#{h['metadata'].get('chunk')}]"
        block = f"{tag}\n{h['text']}\n"
        if used + len(block) > max_chars: 
            break
        ctx.append(block)
        used += len(block)
    return "\n".join(ctx)
