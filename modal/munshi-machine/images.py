from modal import Image
from . import config

def download_model():
    from huggingface_hub import snapshot_download
    snapshot_download("openai/whisper-large-v3-turbo", local_dir=config.MODEL_DIR)

"""
Cuda Image to run transcribe function
"""
cuda_image = (
    Image.from_registry("nvidia/cuda:12.2.2-cudnn8-devel-ubuntu22.04", add_python="3.11")
    .apt_install(*config.APT_PACKAGES)
    .pip_install(*config.PYTHON_PACKAGES)
    .run_commands("python -m pip install --upgrade pip wheel setuptools")
    .run_commands("MAX_JOBS=10 python -m pip install flash-attn --use-pep517 --no-build-isolation --verbose", gpu="A10G")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(
        download_model,
    )
)

"""
Base Image to run get_audio function
"""
base_image = (
    Image.debian_slim(python_version="3.11")
    .apt_install(*config.APT_PACKAGES)
    .pip_install(*config.BASE_PYTHON_PACKAGES)
)

