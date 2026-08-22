from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.llm_service import llm_service
from app.core.config import settings

router = APIRouter()

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.6
    max_tokens: Optional[int] = 512
    use_rag: Optional[bool] = True

class ChatResponse(BaseModel):
    content: str
    model: str
    retrieved_contexts: Optional[List[Dict[str, Any]]] = []
    provider: str
    status: str

class ExplainRequest(BaseModel):
    assessment: Dict[str, Any]

class ExplainResponse(BaseModel):
    explanation: str
    model: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai_advisor(request: ChatRequest):
    """
    Chat with Qwen3.8-27B-FP8 LLM on Modal for Thai Healthcare & Scheme inquiries.
    """
    try:
        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        result = await llm_service.generate_chat_response(
            messages=messages_dict,
            temperature=request.temperature or 0.6,
            max_tokens=request.max_tokens or 512,
            use_rag=request.use_rag if request.use_rag is not None else True
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat completion failed: {str(e)}")

@router.post("/chat/stream")
async def stream_chat_with_ai_advisor(request: ChatRequest):
    """
    Streams tokens in real-time from Qwen3.8-27B-FP8 on Modal via Server-Sent Events (SSE).
    """
    messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
    generator = llm_service.stream_chat_response(
        messages=messages_dict,
        temperature=request.temperature or 0.6,
        max_tokens=request.max_tokens or 512,
        use_rag=request.use_rag if request.use_rag is not None else True
    )
    return StreamingResponse(generator, media_type="text/event-stream")

@router.post("/explain", response_model=ExplainResponse)
async def explain_rights_assessment(request: ExplainRequest):
    """
    Generate fast concise AI reasoning explanation for citizen healthcare rights assessment.
    """
    try:
        explanation = await llm_service.explain_assessment(request.assessment)
        return ExplainResponse(
            explanation=explanation,
            model=settings.LLM_MODEL
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")

@router.get("/status")
async def get_llm_status():
    """
    Check current LLM configuration and Modal connection endpoint.
    """
    return {
        "model": settings.LLM_MODEL,
        "modal_endpoint": settings.MODAL_LLM_URL or "Not set (Using local fallback / LLM_BASE_URL)",
        "configured_base_url": settings.LLM_BASE_URL,
        "active_endpoint": llm_service.get_api_endpoint(),
        "status": "READY"
    }
