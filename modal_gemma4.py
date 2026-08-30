"""
Deploy Gemma 4 E4B on Modal with a Transformers-backed OpenAI-compatible API.

Deploy:
    modal deploy modal_gemma4.py
"""

import os

import modal


APP_NAME = "carepulse-gemma4"
MODEL_ID = "Phonsiri/Gemma-4-E4B-it-PARL"
GPU = "A10G"

app = modal.App(APP_NAME)

hf_cache = modal.Volume.from_name("carepulse-hf-cache", create_if_missing=True)

hf_token = os.getenv("HF_TOKEN", "")
hf_secrets = (
    [modal.Secret.from_dict({"HF_TOKEN": hf_token})]
    if hf_token
    else []
)

gemma_image = (
    modal.Image.debian_slim(python_version="3.12")
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
        "pydantic",
    )
    .env(
        {
            "HF_HUB_ENABLE_HF_TRANSFER": "1",
            "HF_HOME": "/root/.cache/huggingface",
        }
    )
)


@app.function(
    image=gemma_image,
    gpu=GPU,
    volumes={"/root/.cache/huggingface": hf_cache},
    secrets=hf_secrets,
    scaledown_window=1800,
    timeout=1800,
)
@modal.asgi_app()
def serve():
    import asyncio
    import base64
    import io
    import json
    import threading
    import time
    from typing import Any, Dict, List, Optional, Union

    import torch
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from PIL import Image
    from pydantic import BaseModel
    from transformers import AutoModelForCausalLM, AutoProcessor, TextIteratorStreamer

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
        enable_thinking: Optional[bool] = True

    token = os.environ.get("HF_TOKEN") or None
    print(f"Loading processor for {MODEL_ID}...")
    processor = AutoProcessor.from_pretrained(
        MODEL_ID,
        token=token,
        trust_remote_code=True,
    )
    print(f"Loading {MODEL_ID} on {GPU}...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        dtype=torch.bfloat16,
        device_map="auto",
        token=token,
        trust_remote_code=True,
    )
    model.eval()
    print("Gemma 4 is ready for inference.")

    web_app = FastAPI(title="CarePulse Gemma 4 OpenAI-Compatible API")
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.get("/health")
    def health():
        return {
            "status": "ok",
            "app": APP_NAME,
            "model": MODEL_ID,
            "engine": "transformers",
        }

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

    def prepare_inputs(messages: List[ChatMessage], enable_thinking: bool):
        formatted_messages = []
        extracted_images = []

        for message in messages:
            content = message.content or ""
            if isinstance(content, str):
                formatted_messages.append(
                    {"role": message.role, "content": content}
                )
                continue

            message_content = []
            for item in content:
                if item.get("type") == "text":
                    message_content.append(
                        {"type": "text", "text": item.get("text", "")}
                    )
                elif item.get("type") == "image_url":
                    image_url = item.get("image_url", {}).get("url", "")
                    if image_url.startswith("data:"):
                        try:
                            encoded_image = image_url.split(",", 1)[1]
                            image = Image.open(
                                io.BytesIO(base64.b64decode(encoded_image))
                            ).convert("RGB")
                        except Exception as exc:
                            raise ValueError("Invalid base64 image") from exc
                        extracted_images.append(image)
                        message_content.append({"type": "image"})

            formatted_messages.append(
                {"role": message.role, "content": message_content}
            )

        prompt = processor.apply_chat_template(
            formatted_messages,
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=enable_thinking,
        )
        processor_args = {
            "text": prompt,
            "return_tensors": "pt",
        }
        if extracted_images:
            processor_args["images"] = extracted_images

        return processor(**processor_args).to(model.device)

    def generation_kwargs(inputs, request: ChatCompletionRequest):
        temperature = request.temperature if request.temperature is not None else 0.7
        kwargs = {
            **inputs,
            "max_new_tokens": request.max_tokens or 1024,
            "do_sample": temperature > 0,
        }
        if temperature > 0:
            kwargs["temperature"] = temperature
            kwargs["top_p"] = request.top_p or 0.95
        return kwargs

    @web_app.post("/v1/chat/completions")
    async def chat_completions(request: ChatCompletionRequest):
        try:
            inputs = prepare_inputs(
                request.messages,
                request.enable_thinking if request.enable_thinking is not None else True,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to prepare input: {exc}",
            ) from exc

        request_id = f"chatcmpl-{int(time.time() * 1000)}"
        input_length = inputs["input_ids"].shape[-1]

        if request.stream:
            streamer = TextIteratorStreamer(
                processor.tokenizer,
                skip_prompt=True,
                skip_special_tokens=False,
            )
            kwargs = generation_kwargs(inputs, request)
            kwargs["streamer"] = streamer
            thread = threading.Thread(
                target=model.generate,
                kwargs=kwargs,
                daemon=True,
            )
            thread.start()

            async def token_generator():
                for generated_token in streamer:
                    if generated_token:
                        chunk = {
                            "id": request_id,
                            "object": "chat.completion.chunk",
                            "created": int(time.time()),
                            "model": MODEL_ID,
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": {"content": generated_token},
                                    "finish_reason": None,
                                }
                            ],
                        }
                        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                        await asyncio.sleep(0)

                final_chunk = {
                    "id": request_id,
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
                yield f"data: {json.dumps(final_chunk)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(
                token_generator(),
                media_type="text/event-stream",
            )

        with torch.no_grad():
            outputs = model.generate(**generation_kwargs(inputs, request))

        generated_text = processor.decode(
            outputs[0][input_length:],
            skip_special_tokens=False,
        )
        completion_tokens = outputs[0].shape[-1] - input_length
        return {
            "id": request_id,
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
                "prompt_tokens": int(input_length),
                "completion_tokens": int(completion_tokens),
                "total_tokens": int(outputs[0].shape[-1]),
            },
        }

    return web_app
