"""
Gemini AI Module with Enhanced Processing
Focused on high-quality transcript cleaning and summarization
"""

import google.generativeai as genai
import os
import asyncio
import time
from typing import Optional

from .utils import output_handler
from .gemini_config import (
    GEMINI_MODELS, GENERATION_CONFIGS, REQUEST_TIMEOUTS, 
    TOKEN_LIMITS, ERROR_HANDLING
)

# Configure Gemini API
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def log_gemini(message: str, level: str = "INFO"):
    """Enhanced logging for Gemini operations"""
    timestamp = time.strftime("%H:%M:%S")
    print(f"[GEMINI {level}] {timestamp} - {message}")

class GeminiProcessor:
    """Enhanced Gemini processor for transcripts and summaries"""
    
    def __init__(self):
        self.models = {}
        for purpose, model_name in GEMINI_MODELS.items():
            self.models[purpose] = genai.GenerativeModel(model_name)
    
    async def ask_gemini_with_retry(
        self, 
        prompt: str, 
        content: str, 
        task_type: str = "summary",
        max_retries: int = None
    ) -> str:
        """
        Enhanced Gemini API call with retry logic and adaptive configuration
        """
        start_time = time.time()
        max_retries = max_retries or ERROR_HANDLING["max_retries"]
        
        model = self.models.get(task_type, self.models["primary"])
        config = GENERATION_CONFIGS.get(task_type, GENERATION_CONFIGS["summary"])
        timeout = REQUEST_TIMEOUTS.get(task_type, 180)
        
        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    [prompt, content],
                    generation_config=genai.types.GenerationConfig(**config),
                    request_options={"timeout": timeout}
                )
                
                total_time = time.time() - start_time
                log_gemini(f"✅ {task_type} done in {total_time:.1f}s")
                
                return response.text
                
            except Exception as e:
                error_str = str(e)
                
                if attempt < max_retries - 1:
                    # Handle different types of errors with appropriate delays
                    if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                        wait_time = ERROR_HANDLING["rate_limit_delay"]
                        log_gemini(f"🔄 Rate limit, waiting {wait_time}s...", "WARN")
                    elif "quota_metric" in error_str:
                        wait_time = self._extract_retry_delay(error_str) or ERROR_HANDLING["rate_limit_delay"]
                        log_gemini(f"🔄 Quota, waiting {wait_time}s...", "WARN")
                    else:
                        wait_time = ERROR_HANDLING["initial_delay"] + (ERROR_HANDLING["backoff_multiplier"] ** attempt)
                        log_gemini(f"🔄 Retry in {wait_time}s...", "WARN")
                    
                    await asyncio.sleep(wait_time)
                else:
                    log_gemini(f"❌ {task_type} failed: {str(e)[:50]}...", "ERROR")
                    if ERROR_HANDLING["fallback_to_original"]:
                        return f"Error processing content: {str(e)}"
                    raise e
    
    def _extract_retry_delay(self, error_str: str) -> Optional[int]:
        """Extract retry delay from Gemini error message"""
        import re
        match = re.search(r'retry_delay { seconds: (\d+) }', error_str)
        if match:
            return int(match.group(1))
        return None
    
    async def get_summary(self, vid: str) -> str:
        """
        Generate comprehensive summary with batch-based processing for large transcripts
        """
        start_time = time.time()
        
        oh = output_handler(vid)
        transcript = oh.data["text"]
        
        log_gemini(f"📝 Summarizing {vid}")
        
        # Check if summary already exists
        try:
            existing_summary = oh.data["summary_gemini"]
            log_gemini(f"✨ Using cached summary")
            return existing_summary
        except KeyError:
            pass
        
        # Use the comprehensive summary prompt
        from .gemini_prompts import comprehensive_summary_prompt
        
        # Check if transcript needs batch processing
        needs_batching = self._needs_batch_processing(transcript)
        
        if needs_batching:
            summary = await self._generate_batch_summary(transcript)
        else:
            # Process directly for smaller transcripts
            summary = await self.ask_gemini_with_retry(
                comprehensive_summary_prompt, 
                transcript, 
                task_type="summary"
            )
        
        total_time = time.time() - start_time
        
        # Cache the result
        oh.data["summary_gemini"] = summary
        oh.write_transcription_data()
        
        log_gemini(f"✅ Summary complete in {total_time:.1f}s")
        
        return summary
    
    def _needs_batch_processing(self, text: str) -> bool:
        """
        Check if transcript needs batch processing based on token count
        """
        try:
            import tiktoken
            encoding = tiktoken.get_encoding("cl100k_base")
            token_count = len(encoding.encode(text))
            threshold = TOKEN_LIMITS["summary"] * 0.8
            return token_count > threshold
        except ImportError:
            # Fallback to character count
            char_limit = TOKEN_LIMITS["summary"] * 3 * 0.8
            return len(text) > char_limit
    
    async def _generate_batch_summary(self, transcript: str) -> str:
        """
        Generate summary using batch processing for large transcripts
        """
        from .gemini_prompts import comprehensive_summary_prompt
        
        # Split transcript into manageable chunks
        chunks = self._smart_chunk_text(transcript, TOKEN_LIMITS["summary"])
        total_chunks = len(chunks)
        
        log_gemini(f"📦 Processing {total_chunks} batches")
        
        # Generate summaries for each batch with sequential processing to avoid rate limits
        batch_summaries = []
        
        for i, chunk in enumerate(chunks):
            try:
                batch_summary = await self.ask_gemini_with_retry(
                    comprehensive_summary_prompt,
                    chunk,
                    task_type="summary"
                )
                batch_summaries.append(batch_summary)
                
                # Add delay between batch requests to respect rate limits
                if i < len(chunks) - 1:  # Don't wait after the last batch
                    await asyncio.sleep(2)  # 2 second delay between batches
                    
            except Exception as e:
                log_gemini(f"❌ Batch {i+1} failed", "ERROR")
                batch_summaries.append(f"[Error processing section {i+1}: {str(e)}]")
        
        # Combine batch summaries into final comprehensive summary
        if len(batch_summaries) > 1:
            final_summary = await self._combine_batch_summaries(batch_summaries)
        else:
            final_summary = batch_summaries[0] if batch_summaries else "Error: No summaries generated"
        
        return final_summary

    async def _combine_batch_summaries(self, batch_summaries: list[str]) -> str:
        """
        Combine multiple batch summaries into a comprehensive final summary
        """
        from .gemini_prompts import batch_combine_prompt
        
        # Combine all batch summaries with clear separators
        combined_content = "\n\n--- SECTION SUMMARIES ---\n\n"
        for i, summary in enumerate(batch_summaries, 1):
            combined_content += f"Section {i}:\n{summary}\n\n"
        
        try:
            final_summary = await self.ask_gemini_with_retry(
                batch_combine_prompt,
                combined_content,
                task_type="summary"
            )
            
            return final_summary
        except Exception as e:
            print(f"Error combining summaries: {e}")
            # Fallback: return concatenated summaries
            return "\n\n".join([f"**Section {i+1}:**\n{summary}" for i, summary in enumerate(batch_summaries)])
    

    
    async def get_cleaned_transcript(self, transcript_text: str) -> str:
        """
        Enhanced transcript cleaning with intelligent chunking and error recovery
        """
        start_time = time.time()
        
        from .gemini_prompts import clean_transcript_prompt
        
        # Check transcript length
        if len(transcript_text) < 100:
            return transcript_text
        
        # Smart chunking with sentence boundaries
        chunks = self._smart_chunk_text(transcript_text, TOKEN_LIMITS["cleaning"])
        
        # Process chunks in parallel with error handling
        tasks = [
            self.ask_gemini_with_retry(
                clean_transcript_prompt, 
                chunk, 
                task_type="cleaning"
            ) 
            for chunk in chunks
        ]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results with error recovery
            cleaned_chunks = []
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    log_gemini(f"❌ Chunk {i+1} failed", "ERROR")
                    cleaned_chunks.append(chunks[i])
                else:
                    cleaned_chunks.append(result)
            
            final_result = self._merge_cleaned_chunks(cleaned_chunks)
            
            total_time = time.time() - start_time
            log_gemini(f"✅ Cleaning done in {total_time:.1f}s")
            
            return final_result
            
        except Exception as e:
            print(f"Critical error in transcript cleaning: {e}")
            return transcript_text  # Return original on complete failure

    async def get_cleaned_speaker_transcript(self, speaker_transcript: str) -> str:
        """
        Clean speaker transcript with smart speaker detection
        """
        start_time = time.time()
        
        from .gemini_prompts import clean_speaker_transcript_prompt
        
        log_gemini(f"👥 Cleaning speaker transcript")
        
        # Check transcript length
        if len(speaker_transcript) < 100:
            return speaker_transcript
        
        # Smart chunking for speaker transcripts (larger chunks to preserve speaker context)
        chunks = self._smart_chunk_text(speaker_transcript, int(TOKEN_LIMITS["cleaning"] * 1.5))
        
        # Process chunks sequentially to maintain speaker context
        cleaned_chunks = []
        
        for i, chunk in enumerate(chunks):
            try:
                cleaned_chunk = await self.ask_gemini_with_retry(
                    clean_speaker_transcript_prompt,
                    chunk,
                    task_type="cleaning"
                )
                cleaned_chunks.append(cleaned_chunk)
                
                # Small delay between chunks to avoid rate limits
                if i < len(chunks) - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                log_gemini(f"❌ Speaker chunk {i+1} failed", "ERROR")
                cleaned_chunks.append(chunk)
        
        final_result = self._merge_cleaned_chunks(cleaned_chunks)
        
        total_time = time.time() - start_time
        log_gemini(f"✅ Speaker cleaning done in {total_time:.1f}s")
        
        return final_result

    def _smart_chunk_text(self, text: str, max_tokens: int) -> list[str]:
        """
        Intelligent text chunking that preserves sentence boundaries and context
        """
        import tiktoken
        import re
        
        encoding = tiktoken.get_encoding("cl100k_base")
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        current_tokens = 0
        
        for sentence in sentences:
            sentence_tokens = len(encoding.encode(sentence))
            
            # Handle sentences longer than max_tokens
            if sentence_tokens > max_tokens:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                    current_tokens = 0
                
                # Split long sentence by tokens
                tokens = encoding.encode(sentence)
                for i in range(0, len(tokens), max_tokens):
                    chunk_tokens = tokens[i:i + max_tokens]
                    chunks.append(encoding.decode(chunk_tokens))
                continue
            
            # Check if adding sentence exceeds limit
            if current_tokens + sentence_tokens > max_tokens:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + " "
                current_tokens = sentence_tokens
            else:
                current_chunk += sentence + " "
                current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _merge_cleaned_chunks(self, chunks: list[str]) -> str:
        """
        Intelligently merge cleaned chunks, handling potential overlaps
        """
        if not chunks:
            return ""
        
        if len(chunks) == 1:
            return chunks[0]
        
        # Simple merge - could be enhanced with overlap detection
        merged = chunks[0]
        
        for chunk in chunks[1:]:
            # Add space if not already present
            if not merged.endswith(' ') and not chunk.startswith(' '):
                merged += " "
            merged += chunk
        
        return merged


# Global processor instance
processor = GeminiProcessor()


# Core API functions
def ask_gemini(*inputs):
    """Core function to interact with Gemini API - backward compatible"""
    import asyncio
    
    prompt = inputs[0] if inputs else ""
    content = inputs[1] if len(inputs) > 1 else ""
    
    try:
        return asyncio.run(processor.ask_gemini_with_retry(prompt, content))
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "Error processing request"


def get_summary(vid):
    """Generate comprehensive summary with enhanced processing"""
    return asyncio.run(processor.get_summary(vid))


async def get_cleaned_transcript(transcript_text):
    """Clean transcript using enhanced processing"""
    return await processor.get_cleaned_transcript(transcript_text)


async def get_cleaned_speaker_transcript(speaker_transcript):
    """Clean speaker transcript with smart speaker detection"""
    return await processor.get_cleaned_speaker_transcript(speaker_transcript)

