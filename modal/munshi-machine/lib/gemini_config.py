# Gemini AI Configuration

# Model configurations
GEMINI_MODELS = {
    "primary": "gemini-2.5-flash",     # Latest and best price-performance model
    "cleaning": "gemini-2.5-flash",    # Same model for consistency and performance
}

# Generation configurations for different tasks
GENERATION_CONFIGS = {
    "summary": {
        "temperature": 0.7,
        "max_output_tokens": 32768,    # Increased for comprehensive summaries
        "top_p": 0.9,
    },
    "cleaning": {
        "temperature": 0.3,  # Lower temperature for consistent cleaning
        "max_output_tokens": 65536,    # Match input capacity for full transcript preservation
        "top_p": 0.8,
    },
}

# Request timeouts (in seconds)
REQUEST_TIMEOUTS = {
    "summary": 180,
    "cleaning": 240,
}

# Token limits for chunking
TOKEN_LIMITS = {
    "cleaning": 60000,   # Much larger chunks for better context in cleaning
    "summary": 1000000,    # Massive chunks to preserve full context in summaries
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