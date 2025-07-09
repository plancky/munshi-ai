# Gemini AI Configuration

# Model configurations
GEMINI_MODELS = {
    "primary": "gemini-2.0-flash",
    "cleaning": "gemini-2.0-flash",
}

# Generation configurations for different tasks
GENERATION_CONFIGS = {
    "summary": {
        "temperature": 0.7,
        "max_output_tokens": 8000,
        "top_p": 0.9,
    },
    "cleaning": {
        "temperature": 0.3,
        "max_output_tokens": 8000,    
        "top_p": 0.8,
    },
}

# Request timeouts (in seconds)
REQUEST_TIMEOUTS = {
    "summary": 600,
    "cleaning": 600,
}

# Token limits for chunking
TOKEN_LIMITS = {
    "cleaning": 8000,
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
    "fallback_to_original": True,  # Return original text if all processing fails
    "log_errors": True,
} 