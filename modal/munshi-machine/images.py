from modal import Image
from . import config

def download_whisperx_models():
    """Pre-download WhisperX models for faster runtime"""
    import os
    os.makedirs(config.MODEL_DIR, exist_ok=True)
    
    try:
        import whisperx
        print("📥 Pre-downloading WhisperX models...")
        
        # Download main Whisper model that WhisperX uses
        whisperx.load_model("large-v3", device="cpu", compute_type="float32", download_root=config.MODEL_DIR)
        
        # Download alignment model
        whisperx.load_align_model(language_code="en", device="cpu", model_name="WAV2VEC2_ASR_LARGE_LV60K_960H")
        
        print("✅ WhisperX models downloaded successfully")
    except Exception as e:
        print(f"⚠️ WhisperX model download failed (will download at runtime): {e}")

"""
Cuda Image to run transcribe function
"""
cuda_image = (
    Image.from_registry("nvidia/cuda:12.8.0-cudnn-devel-ubuntu22.04", add_python="3.11")
    .apt_install(*config.APT_PACKAGES + ["libcudnn8", "libcudnn8-dev"])
    .pip_install(*config.PYTHON_PACKAGES)
    .run_commands("python -m pip install --upgrade pip wheel setuptools")
    .run_commands("MAX_JOBS=10 python -m pip install flash-attn --use-pep517 --no-build-isolation --verbose", gpu="A10G")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    # Pre-download models for faster cold starts
    .run_function(download_whisperx_models)
)

"""
Base Image to run get_audio function
"""
base_image = (
    Image.debian_slim(python_version="3.11")
    .apt_install(*config.APT_PACKAGES)
    .pip_install(*config.BASE_PYTHON_PACKAGES)
)