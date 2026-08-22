import modal

app = modal.App("test-gpu-check")

@app.function(gpu="A10G")
def check_a10g():
    return "A10G works!"

@app.function(gpu=modal.gpu.A10G(count=2))
def check_2_a10g():
    return "2x A10G works!"
