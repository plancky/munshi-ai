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
        
        log_gemini(f"🚀 Starting Gemini request - task_type: {task_type}, content_length: {len(content)}")
        log_gemini(f"📋 Using model: {GEMINI_MODELS[task_type]}, max_retries: {max_retries}")
        
        for attempt in range(max_retries):
            try:
                log_gemini(f"🔄 Attempt {attempt + 1}/{max_retries} for {task_type}")
                
                response = self.client.models.generate_content(
                    model=GEMINI_MODELS[task_type],
                    contents=[prompt, content],
                    config=GENERATION_CONFIGS[task_type]
                )
                
                # Return structured data for cleaning tasks, text for summaries
                if task_type.startswith("cleaning"):
                    
                    if not response.parsed:
                        log_gemini(f"⚠️ No parsed data in response for {task_type} (attempt {attempt + 1})", "WARN")
                        # This is a parsing failure, not a network error - continue to next attempt
                        if attempt < max_retries - 1:
                            wait_time = ERROR_HANDLING["initial_delay"] + (ERROR_HANDLING["backoff_multiplier"] ** attempt)
                            log_gemini(f"🕐 Parsing error, waiting {wait_time}s before retry", "WARN")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            log_gemini(f"💥 All retries exhausted for {task_type} - parsing failed", "ERROR")
                            raise Exception(f"Failed to get structured response after {max_retries} attempts")
                    
                    return response.parsed
                else:
                    log_gemini(f"📝 Returning text response for {task_type}")
                    return response.text
                
            except Exception as e:
                error_str = str(e)
                log_gemini(f"❌ Attempt {attempt + 1} failed for {task_type}: {error_str}", "ERROR")
                
                if attempt < max_retries - 1:
                    # Determine wait time based on error type
                    if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                        wait_time = ERROR_HANDLING["rate_limit_delay"]
                        log_gemini(f"🕐 Rate limit detected, waiting {wait_time}s before retry", "WARN")
                    elif "timeout" in error_str.lower() or "deadline" in error_str.lower():
                        wait_time = ERROR_HANDLING["initial_delay"] * 2  # Longer wait for timeouts
                        log_gemini(f"🕐 Timeout detected, waiting {wait_time}s before retry", "WARN")
                    else:
                        # Exponential backoff for other errors
                        wait_time = ERROR_HANDLING["initial_delay"] + (ERROR_HANDLING["backoff_multiplier"] ** attempt)
                        log_gemini(f"🕐 General error, exponential backoff: {wait_time}s", "WARN")
                    
                    await asyncio.sleep(wait_time)
                else:
                    log_gemini(f"💥 All retries exhausted for {task_type}", "ERROR")
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
            needs_batch = token_count > threshold
            
            log_gemini(f"📊 Token analysis - count: {token_count}, threshold: {threshold}, needs_batch: {needs_batch}")
            return needs_batch
        except ImportError:
            log_gemini(f"⚠️ tiktoken not available, using character fallback", "WARN")
            # Fallback to character count
            char_limit = TOKEN_LIMITS["summary"] * 3 * 0.8
            needs_batch = len(text) > char_limit
            log_gemini(f"📊 Character analysis - count: {len(text)}, limit: {char_limit}, needs_batch: {needs_batch}")
            return needs_batch
    
    async def _generate_batch_summary(self, transcript: str) -> str:
        """
        Generate summary using batch processing for large transcripts
        """
        log_gemini(f"🔄 Starting batch summary generation for transcript: {len(transcript)} chars")
        
        from .prompts import comprehensive_summary_prompt
        
        # Split transcript into manageable chunks
        chunks = self._smart_chunk_text(transcript, TOKEN_LIMITS["summary"])
        total_chunks = len(chunks)
        
        log_gemini(f"📦 Processing {total_chunks} batches")
        
        # Generate summaries for each batch with sequential processing to avoid rate limits
        batch_summaries = []
        
        for i, chunk in enumerate(chunks):
            log_gemini(f"🔄 Processing batch {i+1}/{total_chunks}")
            
            try:
                batch_summary = await self.ask_gemini_with_retry(
                    comprehensive_summary_prompt,
                    chunk,
                    task_type="summary"
                )
                batch_summaries.append(batch_summary)
                log_gemini(f"✅ Batch {i+1} completed")
                
                # Add delay between batch requests to respect rate limits
                if i < len(chunks) - 1:  # Don't wait after the last batch
                    await asyncio.sleep(2)  # 2 second delay between batches
                    
            except Exception as e:
                log_gemini(f"❌ Batch {i+1} failed: {str(e)}", "ERROR")
                batch_summaries.append(f"[Error processing section {i+1}: {str(e)}]")
        
        log_gemini(f"📊 Batch processing complete - {len(batch_summaries)} summaries generated")
        
        # Combine batch summaries into final comprehensive summary
        if len(batch_summaries) > 1:
            log_gemini(f"🔄 Combining {len(batch_summaries)} batch summaries")
            final_summary = await self._combine_batch_summaries(batch_summaries)
        else:
            log_gemini(f"📝 Single batch summary, using directly")
            final_summary = batch_summaries[0] if batch_summaries else "Error: No summaries generated"
        
        log_gemini(f"✅ Final batch summary generated: {len(final_summary)} chars")
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
        log_gemini(f"🧹 Starting transcript cleaning - input length: {len(transcript_text)} chars")
        
        from .prompts import clean_transcript_prompt
        
        # Check transcript length
        if len(transcript_text) < 100:
            log_gemini(f"📏 Transcript too short ({len(transcript_text)} chars), returning as-is")
            return transcript_text
        
        log_gemini(f"📊 Using token limit: {TOKEN_LIMITS['cleaning_normal']} for chunking")
        
        # Smart chunking with sentence boundaries
        chunks = self._smart_chunk_text(transcript_text, TOKEN_LIMITS["cleaning_normal"])
        log_gemini(f"📦 Created {len(chunks)} chunks for cleaning")
        
        # Process chunks in parallel with error handling
        log_gemini(f"🚀 Starting parallel processing of {len(chunks)} chunks")
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
            log_gemini(f"📥 Received {len(results)} results from parallel processing")
            
            # Combine results with error recovery
            cleaned_chunks = []
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    log_gemini(f"❌ Chunk {i+1} processing failed: {str(result)}", "ERROR")
                    # Use original chunk as fallback
                    cleaned_chunks.append(chunks[i])
                    continue
                
                # Always expect a list for cleaned_text
                cleaned_text = '\n\n'.join(result.cleaned_text)
                log_gemini(f"✅ Chunk {i+1} cleaned: {len(cleaned_text)} chars")
                cleaned_chunks.append(cleaned_text)
            
            log_gemini(f"🔄 Merging {len(cleaned_chunks)} cleaned chunks")
            final_result = self._merge_cleaned_chunks(cleaned_chunks)
            
            total_time = time.time() - start_time
            log_gemini(f"✅ Cleaning completed in {total_time:.1f}s - output: {len(final_result)} chars")
            log_gemini(f"📊 Compression ratio: {len(transcript_text)} → {len(final_result)} chars ({(len(final_result)/len(transcript_text)*100):.1f}%)")
            
            return final_result
            
        except Exception as e:
            log_gemini(f"💥 Critical error in transcript cleaning: {str(e)}", "ERROR")
            raise e

    async def get_cleaned_speaker_transcript(self, speaker_transcript: str) -> Dict[str, Any]:
        """
        Clean speaker transcript with JSON response parsing
        Returns dict with cleaned_transcript and speaker_mappings
        """
        start_time = time.time()
        log_gemini(f"👥 Starting speaker transcript cleaning - input length: {len(speaker_transcript)} chars")
        
        from .prompts import clean_speaker_transcript_prompt
        
        # Check transcript length
        if len(speaker_transcript) < 100:
            log_gemini(f"📏 Speaker transcript too short ({len(speaker_transcript)} chars), returning as-is")
            return {"cleaned_transcript": speaker_transcript, "speaker_mappings": {}}
        
        # Smart chunking for speaker transcripts (larger chunks to preserve speaker context)
        chunk_limit = int(TOKEN_LIMITS["cleaning_speaker"])
        log_gemini(f"📊 Using token limit: {chunk_limit} for speaker context preservation")
        
        chunks = self._smart_chunk_text(speaker_transcript, chunk_limit)
        log_gemini(f"📦 Created {len(chunks)} speaker chunks")
        
        # Process chunks sequentially to maintain speaker context
        cleaned_chunks = []
        all_speaker_mappings = {}
        
        for i, chunk in enumerate(chunks):
            log_gemini(f"🔄 Processing speaker chunk {i+1}/{len(chunks)}")
            
            try:
                response = await self.ask_gemini_with_retry(
                    clean_speaker_transcript_prompt,
                    chunk,
                    task_type="cleaning_speaker",
                    max_retries=3
                )
                
                # Always expect a list for cleaned_transcript
                cleaned_text = '\n\n'.join(response.cleaned_transcript)
                log_gemini(f"📝 Cleaned text length: {len(cleaned_text)} chars")
                cleaned_chunks.append(cleaned_text)
                
                # Convert speaker mappings from array to dict
                if hasattr(response, 'speaker_ids') and hasattr(response, 'speaker_names'):

                    if len(response.speaker_ids) != len(response.speaker_names):
                        log_gemini(f"⚠️ Speaker IDs and names mismatch: {len(response.speaker_ids)} != {len(response.speaker_names)}", "WARN")
                        continue

                    log_gemini(f"👥 Processing {len(response.speaker_ids)} speaker mappings")
                    for j in range(len(response.speaker_ids)):
                        speaker_id = response.speaker_ids[j]
                        speaker_name = response.speaker_names[j]
                        all_speaker_mappings[speaker_id] = speaker_name
                        log_gemini(f"👤 Mapped: {speaker_id} → {speaker_name}")
                else:
                    log_gemini(f"⚠️ No speaker mappings in response", "WARN")
                
                # Small delay between chunks to avoid rate limits
                if i < len(chunks) - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                log_gemini(f"❌ Speaker chunk {i+1} failed: {str(e)}", "ERROR")
                raise e
        
        log_gemini(f"🔄 Merging {len(cleaned_chunks)} speaker chunks")
        final_transcript = self._merge_cleaned_chunks(cleaned_chunks)
        
        total_time = time.time() - start_time
        log_gemini(f"✅ Speaker cleaning completed in {total_time:.1f}s")
        log_gemini(f"📊 Final transcript: {len(final_transcript)} chars")
        log_gemini(f"👥 Total speaker mappings: {len(all_speaker_mappings)}")
        log_gemini(f"🎭 Speaker mappings: {all_speaker_mappings}")
        
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
        
        for i, sentence in enumerate(sentences):
            sentence_tokens = len(encoding.encode(sentence))
            
            # Handle sentences longer than max_tokens
            if sentence_tokens > max_tokens:
                log_gemini(f"⚠️ Long sentence {i+1}: {sentence_tokens} tokens > {max_tokens}, splitting", "WARN")
                
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                    current_tokens = 0
                
                # Split long sentence by tokens
                tokens = encoding.encode(sentence)
                for j in range(0, len(tokens), max_tokens):
                    chunk_tokens = tokens[j:j + max_tokens]
                    token_chunk = encoding.decode(chunk_tokens)
                    chunks.append(token_chunk)
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

        log_gemini(f"✅ Chunking complete: {len(chunks)} chunks created")
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
        log_gemini(f"📋 Starting summary generation for video {vid}")
        
        from ..utils import output_handler
        from .prompts import comprehensive_summary_prompt
        
        # Get transcript data
        log_gemini(f"📂 Loading transcript data for {vid}")
        oh = output_handler(vid)
        oh.get_output()
        
        if not oh.data or not oh.data.get("text"):
            log_gemini(f"❌ No transcript data found for video {vid}", "ERROR")
            return "Error: No transcript data available for summarization"
        
        transcript_text = oh.data["text"]
        log_gemini(f"📊 Loaded transcript: {len(transcript_text)} chars")
        
        # Check if transcript is too short
        if len(transcript_text) < 100:
            log_gemini(f"📏 Transcript too short for summarization: {len(transcript_text)} chars")
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
        
        log_gemini(f"✅ Summary generated: {len(summary)} chars")
        
        # Save summary to output data
        if oh.data:
            oh.data["summary_gemini"] = summary
            oh.write_transcription_data()
            log_gemini(f"💾 Summary saved to output data")
        else:
            log_gemini(f"⚠️ No output data to save summary to", "WARN")
        
        return summary


# Global processor instance
processor = GeminiProcessor()

async def get_cleaned_transcript(transcript_text):
    """Clean transcript using enhanced processing with JSON response"""
    return await processor.get_cleaned_transcript(transcript_text)


async def get_cleaned_speaker_transcript(speaker_transcript):
    """Clean speaker transcript with JSON response parsing"""
    return await processor.get_cleaned_speaker_transcript(speaker_transcript)
