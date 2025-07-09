import dataclasses
import logging
import pathlib


@dataclasses.dataclass
class ModelSpec:
    name: str
    params: str
    relative_speed: int  # Higher is faster


def get_logger(name, level=logging.INFO):
    logger = logging.getLogger(name)
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(levelname)s: %(asctime)s: %(name)s  %(message)s")
    )
    logger.addHandler(handler)
    logger.setLevel(level)
    return logger


# model is stored on the app image itself at this path
MODEL_DIR = "/model"

CACHE_DIR = "/cache"
RAW_AUDIO_DIR = pathlib.Path(CACHE_DIR, "raw_audio")

UPLOAD_CHUNK_DIR = pathlib.Path(CACHE_DIR, "chunks")
UPLOAD_AUDIO_DIR = pathlib.Path(CACHE_DIR, "upload_audio")

# Stores metadata of individual podcast episodes as JSON.
PODCAST_METADATA_DIR = pathlib.Path(CACHE_DIR, "podcast_metadata")

# Completed episode transcriptions. Stored as flat files with
# files structured as '{guid_hash}-{model_slug}.json'.
TRANSCRIPTIONS_DIR = pathlib.Path(CACHE_DIR, "transcriptions")

# Location of web other static files to be cached
ASSETS_PATH = pathlib.Path(__file__).parent / "frontend" / "dist"

# python dependencies
BASE_PYTHON_PACKAGES = [
    "google-generativeai",
    "tiktoken",
    "requests",
    "packaging",
    "wheel",
    "ffmpeg-python",
    "mutagen",
    "python-multipart"
]

ML_PYTHON_PACKAGES = [
    #"transformers==4.53.0",
    # Core PyTorch - using newer versions but keeping compatibility
    "torch==2.7.1",
    "torchaudio==2.7.1",
    "numpy==2.0.2",
    
    # WhisperX and dependencies
    "git+https://github.com/m-bain/whisperx.git@v3.4.0",
    "ctranslate2==4.4.0",
    
    # Additional optimizations
    "ninja",
    "hf-transfer~=0.1", 
    "pyannote.audio==3.3.2",
]

PYTHON_PACKAGES = BASE_PYTHON_PACKAGES + ML_PYTHON_PACKAGES


APT_PACKAGES = [
    "git",
    "ffmpeg"
]
