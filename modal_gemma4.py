"""
modal_gemma4.py
===============
Deploy Gemma 4 E4B with vLLM on Modal GPU
ใช้ Official Docker Image: vllm/vllm-openai:gemma4 (ไร้ปัญหา Driver / CUDA Conflict)

Deploy to Modal:
    modal deploy modal_gemma4.py
"""

import os
import subprocess
import modal

# ─── Configuration ────────────────────────────────────────────────────────────
APP_NAME      = "carepulse-gemma4"
MODEL_ID      = "Phonsiri/Gemma-4-E4B-it-PARL"   # Fine-tuned Gemma 4 E4B
PORT          = 8000
GPU           = "A10G"          # 1x A10G (24 GB) สำหรับ E4B
MAX_MODEL_LEN = 8192            # จำกัด Context เพื่อป้องกัน VRAM OOM บนการ์ด 24GB
HF_TOKEN      = os.getenv("HF_TOKEN", "")
# ──────────────────────────────────────────────────────────────────────────────

app = modal.App(APP_NAME)

# Volume สำหรับเก็บ Weights โมเดลใน Modal เพื่อให้ไม่ต้องดาวน์โหลดใหม่ทุกครั้ง
hf_cache = modal.Volume.from_name("carepulse-hf-cache", create_if_missing=True)

# HF Token Secret
hf_secret = modal.Secret.from_dict({"HF_TOKEN": HF_TOKEN})

# ─── Official Gemma 4 vLLM Image (ไร้ข้อขัดแย้งด้าน CUDA/Dependencies) ────────
# ใช้ image ทางการ vllm/vllm-openai:gemma4 ที่คอมไพล์สำหรับ CUDA 12.9 มาโดยเฉพาะ
vllm_image = (
    modal.Image.from_registry("vllm/vllm-openai:gemma4", add_python="3.12")
    .entrypoint([])
    .env({
        "HF_HUB_ENABLE_HF_TRANSFER": "1",
        "HF_HOME": "/root/.cache/huggingface",
    })
)


@app.function(
    image=vllm_image,
    gpu=GPU,
    volumes={"/root/.cache/huggingface": hf_cache},
    secrets=[hf_secret],
    scaledown_window=1800,   # Keep container warm 30 นาที
    timeout=1800,
)
@modal.web_server(port=PORT, startup_timeout=600)
def serve():
    """
    Launch vLLM OpenAI-Compatible Server for Gemma 4
    """
    cmd = [
        "vllm", "serve", MODEL_ID,
        "--host", "0.0.0.0",
        "--port", str(PORT),
        # Context Length (ป้องกัน OOM บน GPU 24GB)
        "--max-model-len", str(MAX_MODEL_LEN),
        "--gpu-memory-utilization", "0.90",
        "--trust-remote-code",
        # Multimodal Vision JSON format
        "--limit-mm-per-prompt", '{"image": 4}',
    ]

    print(f"🚀 Starting Official vLLM Gemma 4 Server for {MODEL_ID} on port {PORT}...")
    print(f"   Command: {' '.join(cmd)}")
    proc = subprocess.Popen(cmd)
    
    # Keep container alive while vLLM process is running
    proc.wait()


@app.function(image=vllm_image, secrets=[hf_secret])
def ping():
    """Health check endpoint"""
    return {
        "status": "ok",
        "app": APP_NAME,
        "model": MODEL_ID,
        "engine": "vLLM gemma4 official image",
        "features": ["multimodal_vision", "reasoning_parser", "tool_calling"],
    }
