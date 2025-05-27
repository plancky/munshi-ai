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
    # .run_commands("python -m pip install flash-attn --no-build-isolation", gpu="A10G")
    #.run_commands("git clone https://github.com/VectorSpaceLab/OmniGen.git && cd OmniGen && pip install -e .")
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
    .pip_install("pytubefix")
)

