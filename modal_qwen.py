import os
import subprocess
import modal

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------
APP_NAME = "carepulse-qwen-38-27b"
MODEL_ID = "Qwen/Qwen3.8-27B-FP8"
PORT = 8000

# Modal App definition
app = modal.App(APP_NAME)

# Volume for caching Hugging Face model weights & avoiding redownloads
hf_cache = modal.Volume.from_name("carepulse-hf-cache", create_if_missing=True)

# Container Image with vLLM & GPU dependencies
vllm_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "vllm>=0.6.0",
        "huggingface_hub",
        "hf-transfer",
        "fastapi",
        "uvicorn",
        "torch",
    )
    .env({
        "HF_HUB_ENABLE_HF_TRANSFER": "1",
        "HF_HOME": "/root/.cache/huggingface",
    })
)


@app.function(
    image=vllm_image,
    gpu="A10G:2",  # 2x A10G (48GB VRAM) for 27B FP8 + KV cache
    volumes={"/root/.cache/huggingface": hf_cache},
    scaledown_window=1800,  # Keep container warm for 30 minutes to eliminate cold starts
    timeout=1800,
)
@modal.web_server(port=PORT, startup_timeout=600)
def serve():
    """
    Launches high-performance vLLM OpenAI-compatible server for Qwen3.8-27B-FP8.
    """
    cmd = [
        "vllm", "serve", MODEL_ID,
        "--host", "0.0.0.0",
        "--port", str(PORT),
        "--tensor-parallel-size", "2",
        "--trust-remote-code",
        "--gpu-memory-utilization", "0.92",
        "--max-model-len", "4096",
        "--disable-log-requests",
    ]
    print(f"🚀 Starting optimized vLLM OpenAI Server for {MODEL_ID} on port {PORT}...")
    subprocess.Popen(" ".join(cmd), shell=True)



@app.function(
    image=vllm_image,
)
def ping():
    """Simple test function to check Modal connectivity."""
    return {"status": "ok", "app": APP_NAME, "model": MODEL_ID}
