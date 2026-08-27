import os
import io
import time
import base64
import asyncio
import threading
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import modal

# Load local environment if present (for HF_TOKEN / HF_API_KEY)
load_dotenv()

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------
APP_NAME = "carepulse-gemma-4"
MODEL_ID = "Phonsiri/Gemma-4-E4B-it-PARL"

app = modal.App(APP_NAME)

# Persistent volume for Hugging Face model cache
hf_cache = modal.Volume.from_name("carepulse-hf-cache", create_if_missing=True)

# Container Image with PyTorch & latest Transformers from source for Gemma-4 architecture
gemma_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "ffmpeg")
    .pip_install(
        "torch",
        "torchvision",
        "torchaudio",
        "accelerate",
        "sentencepiece",
        "huggingface_hub",
        "hf-transfer",
        "git+https://github.com/huggingface/transformers.git",
        "pillow",
        "scipy",
        "soundfile",
        "timm",
        "fastapi",
        "uvicorn",
        "pydantic",
        "python-dotenv",
    )
    .env({
        "HF_HUB_ENABLE_HF_TRANSFER": "1",
        "HF_HOME": "/root/.cache/huggingface",
    })
)

# Pass HF Token securely from environment into Modal container
hf_token_val = os.environ.get("HF_TOKEN") or os.environ.get("HF_API_KEY", "")
hf_secret = modal.Secret.from_dict({"HF_TOKEN": hf_token_val}) if hf_token_val else None
secret_list = [hf_secret] if hf_secret else []


# Pydantic schemas for OpenAI compatibility
class ChatMessage(BaseModel):
    role: str
    content: Optional[Union[str, List[Dict[str, Any]]]] = ""


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = MODEL_ID
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False
    top_p: Optional[float] = 0.95
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[Any] = None


@app.cls(
    image=gemma_image,
    gpu="A10G",
    volumes={"/root/.cache/huggingface": hf_cache},
    secrets=secret_list,
    scaledown_window=1800,  # Keep container warm for 30 min
    timeout=1800,
)
class GemmaServer:
    @modal.enter()
    def setup(self):
        import torch
        from transformers import AutoProcessor, AutoModelForCausalLM

        token = os.environ.get("HF_TOKEN") or None
        print(f"🚀 Loading Gemma-4 processor for {MODEL_ID}...")
        self.processor = AutoProcessor.from_pretrained(
            MODEL_ID,
            token=token,
            trust_remote_code=True,
        )

        print(f"🚀 Loading Gemma-4 model for {MODEL_ID} into A10G...")
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            dtype=torch.bfloat16,
            device_map="auto",
            token=token,
            trust_remote_code=True,
        )
        self.model.eval()
        print("✅ Gemma-4 Model loaded successfully and ready for inference!")

    @modal.asgi_app()
    def serve(self):
        import json
        import torch
        from PIL import Image
        from fastapi import FastAPI, HTTPException
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi.responses import JSONResponse, StreamingResponse
        from transformers import TextIteratorStreamer

        web_app = FastAPI(title="CarePulse Gemma-4 OpenAI-Compatible API")

        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.get("/health")
        def health():
            return {"status": "ok", "model": MODEL_ID, "app": APP_NAME}

        @web_app.get("/v1/models")
        def list_models():
            return {
                "object": "list",
                "data": [
                    {
                        "id": MODEL_ID,
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "CarePulse-AI",
                    }
                ],
            }

        def prepare_inputs(messages_data: List[ChatMessage]):
            """Extracts images and formats text for Gemma-4 processor."""
            formatted_messages = []
            extracted_images = []

            for m in messages_data:
                role = m.role
                content = m.content or ""

                if isinstance(content, str):
                    formatted_messages.append({"role": role, "content": content})
                elif isinstance(content, list):
                    msg_content = []
                    for item in content:
                        if isinstance(item, dict):
                            if item.get("type") == "text":
                                msg_content.append({"type": "text", "text": item.get("text", "")})
                            elif item.get("type") == "image_url":
                                url_data = item.get("image_url", {}).get("url", "")
                                if url_data.startswith("data:"):
                                    try:
                                        _, b64_data = url_data.split(",", 1)
                                        img_bytes = base64.b64decode(b64_data)
                                        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                                        extracted_images.append(img)
                                        msg_content.append({"type": "image"})
                                    except Exception as img_err:
                                        print(f"Error parsing base64 image: {img_err}")
                    formatted_messages.append({"role": role, "content": msg_content})

            prompt_text = self.processor.apply_chat_template(
                formatted_messages,
                tokenize=False,
                add_generation_prompt=True,
                enable_thinking=True,
            )

            if extracted_images:
                inputs = self.processor(
                    text=prompt_text,
                    images=extracted_images,
                    return_tensors="pt",
                ).to(self.model.device)
            else:
                inputs = self.processor(
                    text=prompt_text,
                    return_tensors="pt",
                ).to(self.model.device)

            return inputs

        @web_app.post("/v1/chat/completions")
        async def chat_completions(req: ChatCompletionRequest):
            try:
                inputs = prepare_inputs(req.messages)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to prepare input: {str(e)}")

            max_new = req.max_tokens or 1024
            temp = req.temperature if req.temperature is not None else 0.7

            if req.stream:
                streamer = TextIteratorStreamer(
                    self.processor.tokenizer,
                    skip_prompt=True,
                    skip_special_tokens=False,
                )

                gen_kwargs = dict(
                    **inputs,
                    streamer=streamer,
                    max_new_tokens=max_new,
                    temperature=temp,
                    do_sample=True if temp > 0 else False,
                )

                thread = threading.Thread(target=self.model.generate, kwargs=gen_kwargs)
                thread.start()

                async def token_generator():
                    for token in streamer:
                        if token:
                            chunk = {
                                "id": f"chatcmpl-{int(time.time() * 1000)}",
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),
                                "model": MODEL_ID,
                                "choices": [
                                    {
                                        "index": 0,
                                        "delta": {"content": token},
                                        "finish_reason": None,
                                    }
                                ],
                            }
                            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                            await asyncio.sleep(0.001)

                    done_chunk = {
                        "id": f"chatcmpl-{int(time.time() * 1000)}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": MODEL_ID,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {},
                                "finish_reason": "stop",
                            }
                        ],
                    }
                    yield f"data: {json.dumps(done_chunk, ensure_ascii=False)}\n\n"
                    yield "data: [DONE]\n\n"

                return StreamingResponse(token_generator(), media_type="text/event-stream")

            # Non-streaming response
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new,
                    temperature=temp,
                    do_sample=True if temp > 0 else False,
                )

            input_len = inputs["input_ids"].shape[-1]
            generated_text = self.processor.decode(
                outputs[0][input_len:], skip_special_tokens=False
            )

            return {
                "id": f"chatcmpl-{int(time.time() * 1000)}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": MODEL_ID,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": generated_text,
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": int(input_len),
                    "completion_tokens": int(outputs[0].shape[-1] - input_len),
                    "total_tokens": int(outputs[0].shape[-1]),
                },
            }

        return web_app
