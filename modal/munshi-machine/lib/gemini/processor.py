"""
Gemini AI Module with Enhanced Processing
Focused on high-quality transcript cleaning and summarization
"""

from google import genai

import os
import asyncio
import time
from typing import Dict, Any

from .config import (
    GEMINI_MODELS, GENERATION_CONFIGS,
    TOKEN_LIMITS, ERROR_HANDLING
)

def log_gemini(message: str, level: str = "INFO"):
    """Enhanced logging for Gemini operations"""
    timestamp = time.strftime("%H:%M:%S")
    print(f"[GEMINI {level}] {timestamp} - {message}")

class GeminiProcessor:
    """Enhanced Gemini processor for transcripts and summaries"""
    
    def __init__(self):
        self.client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    
    
    async def ask_gemini_with_retry(
        self, 
        prompt: str, 
        content: str, 
        task_type: str = "summary",
        max_retries: int = None,
    ) -> Any:
        """
        Enhanced Gemini API call with structured output support
        """
        max_retries = max_retries or ERROR_HANDLING["max_retries"]
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=GEMINI_MODELS[task_type],
                    contents=[prompt, content],
                    config=GENERATION_CONFIGS[task_type]
                )

                # Return structured data for cleaning tasks, text for summaries
                if task_type.startswith("cleaning"):
                    log_gemini(f"Raw speaker response: {response.text}", "DEBUG")
                    log_gemini(f"Structured response: {response.parsed}", "DEBUG")
                    return response.parsed
                else:
                    return response.text
                
            except Exception as e:
                error_str = str(e)
                
                if attempt < max_retries - 1:
                    if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                        wait_time = ERROR_HANDLING["rate_limit_delay"]
                        log_gemini(f"Error while making a request to Gemini: {error_str}", "ERROR")
                        log_gemini(f"🔄 Rate limit, waiting {wait_time}s...", "WARN")
                    else:
                        wait_time = ERROR_HANDLING["initial_delay"] + (ERROR_HANDLING["backoff_multiplier"] ** attempt)
                        log_gemini(f"Error while making a request to Gemini: {error_str}", "ERROR")
                        log_gemini(f"🔄 Retry in {wait_time}s...", "WARN")
                    
                    await asyncio.sleep(wait_time)
                else:
                    log_gemini(f"❌ {task_type} failed: {str(e)[:100]}...", "ERROR")
                    raise e
    
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
        from .prompts import comprehensive_summary_prompt
        
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
        from .prompts import batch_combine_prompt
        
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
        Enhanced transcript cleaning with JSON response parsing
        """
        start_time = time.time()
        
        from .prompts import clean_transcript_prompt
        
        # Check transcript length
        if len(transcript_text) < 100:
            return transcript_text
        
        # Smart chunking with sentence boundaries
        chunks = self._smart_chunk_text(transcript_text, TOKEN_LIMITS["cleaning_normal"])
        
        # Process chunks in parallel with error handling
        tasks = [
            self.ask_gemini_with_retry(
                clean_transcript_prompt, 
                chunk, 
                task_type="cleaning_normal"
            ) 
            for chunk in chunks
        ]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results with error recovery
            cleaned_chunks = []
            
            for result in results:
                log_gemini(f"Result in get_cleaned_transcript: {result}", "DEBUG")
                log_gemini(f"Result type in get_cleaned_transcript: {type(result)}", "DEBUG")
                cleaned_text = result.cleaned_text
                cleaned_chunks.append(cleaned_text)
            
            final_result = self._merge_cleaned_chunks(cleaned_chunks)
            
            total_time = time.time() - start_time
            log_gemini(f"✅ Cleaning done in {total_time:.1f}s")
            
            return final_result
            
        except Exception as e:
            log_gemini(f"Critical error in transcript cleaning: {e}", "ERROR")
            raise e

    async def get_cleaned_speaker_transcript(self, speaker_transcript: str) -> Dict[str, Any]:
        """
        Clean speaker transcript with JSON response parsing
        Returns dict with cleaned_transcript and speaker_mappings
        """
        start_time = time.time()
        
        from .prompts import clean_speaker_transcript_prompt
        
        log_gemini(f"👥 Cleaning speaker transcript")
        
        # Check transcript length
        if len(speaker_transcript) < 100:
            return {"cleaned_transcript": speaker_transcript, "speaker_mappings": {}}
        
        # Smart chunking for speaker transcripts (larger chunks to preserve speaker context)
        chunks = self._smart_chunk_text(speaker_transcript, int(TOKEN_LIMITS["cleaning_speaker"] * 1.5))
        
        # Process chunks sequentially to maintain speaker context
        cleaned_chunks = []
        all_speaker_mappings = {}
        
        for i, chunk in enumerate(chunks):
            try:
                response = await self.ask_gemini_with_retry(
                    clean_speaker_transcript_prompt,
                    chunk,
                    task_type="cleaning_speaker",
                    max_retries=3
                )
                
                # response is already structured data from Gemini
                cleaned_text = response.cleaned_transcript
                cleaned_chunks.append(cleaned_text)
                
                # Convert speaker mappings from array to dict
                for i in range(len(response.speaker_ids)):
                    all_speaker_mappings[response.speaker_ids[i]] = response.speaker_names[i]
                
                # Small delay between chunks to avoid rate limits
                if i < len(chunks) - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                log_gemini(f"❌ Speaker chunk {i+1} failed", "ERROR")
                raise e
        
        final_transcript = self._merge_cleaned_chunks(cleaned_chunks)
        
        total_time = time.time() - start_time
        log_gemini(f"✅ Speaker cleaning done in {total_time:.1f}s")
        
        return {
            "cleaned_transcript": final_transcript,
            "speaker_mappings": all_speaker_mappings
        }

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

    async def get_summary(self, vid: str) -> str:
        """
        Generate summary for a video ID by reading transcript and processing with Gemini
        """
        from ..utils import output_handler
        from .prompts import comprehensive_summary_prompt
        
        log_gemini(f"📝 Generating summary for video {vid}")
        
        # Get transcript data
        oh = output_handler(vid)
        oh.get_output()
        
        if not oh.data or not oh.data.get("text"):
            log_gemini(f"❌ No transcript data found for video {vid}", "ERROR")
            return "Error: No transcript data available for summarization"
        
        transcript_text = oh.data["text"]
        
        # Check if transcript is too short
        if len(transcript_text) < 100:
            log_gemini(f"📝 Transcript too short for summarization: {len(transcript_text)} chars")
            return transcript_text
        
        # Check if batch processing is needed
        if self._needs_batch_processing(transcript_text):
            log_gemini(f"📦 Using batch processing for large transcript")
            summary = await self._generate_batch_summary(transcript_text)
        else:
            log_gemini(f"📝 Using single-pass summarization")
            summary = await self.ask_gemini_with_retry(
                comprehensive_summary_prompt,
                transcript_text,
                task_type="summary"
            )
        
        # Save summary to output data
        if oh.data:
            oh.data["summary_gemini"] = summary
            oh.write_transcription_data()
            log_gemini(f"✅ Summary saved to output data")
        
        return summary


# Global processor instance
processor = GeminiProcessor()

async def get_cleaned_transcript(transcript_text):
    """Clean transcript using enhanced processing with JSON response"""
    return await processor.get_cleaned_transcript(transcript_text)


async def get_cleaned_speaker_transcript(speaker_transcript):
    """Clean speaker transcript with JSON response parsing"""
    return await processor.get_cleaned_speaker_transcript(speaker_transcript)
