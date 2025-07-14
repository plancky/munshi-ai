# Gemini AI Configuration
from .models import GeminiResponse, GeminiSpeakerResponse

# Model configurations
GEMINI_MODELS = {
    "summary": "gemini-2.5-pro",
    "cleaning_normal": "gemini-2.5-flash",
    "cleaning_speaker": "gemini-2.5-flash",
}

# Generation configurations for different tasks
GENERATION_CONFIGS = {
    "summary": {
        "temperature": 0.7,
        "max_output_tokens": 60000,
        "top_p": 0.9,
    },
    "cleaning_normal": {
        "temperature": 0.3,
        "max_output_tokens": 60000,    
        "top_p": 0.8,
        "response_mime_type": "application/json",
        "response_schema": GeminiResponse
    },
    "cleaning_speaker": {
        "temperature": 0.3,
        "max_output_tokens": 60000,    
        "top_p": 0.8,
        "response_mime_type": "application/json",
        "response_schema": GeminiSpeakerResponse
    },
}

# Request timeouts (in seconds)
REQUEST_TIMEOUTS = {
    "summary": 600,
    "cleaning_normal": 600,
    "cleaning_speaker": 600,
}

# Token limits for chunking
TOKEN_LIMITS = {
    "cleaning_normal": 60000,
    "cleaning_speaker": 60000,
    "summary": 800000,
}

# Quality thresholds
QUALITY_THRESHOLDS = {
    "min_transcript_length": 100,  # Minimum characters for processing
    "max_chunk_overlap": 50,       # Characters to overlap between chunks
    "confidence_threshold": 0.7,   # Minimum confidence for auto-processing
}

# Error handling strategies
ERROR_HANDLING = {
    "max_retries": 5,
    "backoff_multiplier": 2,
    "initial_delay": 30,  # Start with 30 seconds for rate limit errors
    "rate_limit_delay": 60,  # Wait 60 seconds for 429 errors
    "log_errors": True,
} 