"""
Gemini AI Module for Transcript Processing and Summarization
"""

from .processor import (
    GeminiProcessor,
    get_cleaned_transcript,
    get_cleaned_speaker_transcript,
    processor
)

from .prompts import (
    clean_transcript_prompt,
    clean_speaker_transcript_prompt,
    batch_combine_prompt
)

from .config import (
    GEMINI_MODELS,
    GENERATION_CONFIGS,
    TOKEN_LIMITS,
    ERROR_HANDLING
)

__all__ = [
    # Processor
    "GeminiProcessor",
    "processor",
    "get_cleaned_transcript", 
    "get_cleaned_speaker_transcript",
    
    # Prompts
    "clean_transcript_prompt",
    "clean_speaker_transcript_prompt", 
    "batch_combine_prompt",
    
    # Config
    "GEMINI_MODELS",
    "GENERATION_CONFIGS", 
    "TOKEN_LIMITS",
    "ERROR_HANDLING"
] 