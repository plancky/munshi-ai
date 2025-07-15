from modal import method, enter, exit as modal_exit
import modal
import os

from ..app import app
from ..images import cuda_image
from ..config import MODEL_DIR, RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR, get_logger
from ..volumes import audio_storage_vol, transcriptions_vol

logger = get_logger(__name__)


@app.cls(
    image=cuda_image,
    gpu="A10G",
    volumes={
        str(RAW_AUDIO_DIR): audio_storage_vol,
        str(TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
    scaledown_window=40,
    timeout=3600,
)
@modal.concurrent(max_inputs=15)
class WhisperX:
    @enter()
    def setup(self):
        import whisperx
        import torch
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.batch_size = 32
        self.compute_type = "float16"
        
        # Load WhisperX model
        self.model = whisperx.load_model(
            "large-v3", 
            self.device, 
            compute_type=self.compute_type,
            download_root=str(MODEL_DIR)
        )
        
        # Load alignment model
        self.model_a, self.metadata = whisperx.load_align_model(
            language_code="en", 
            device=self.device,
            model_name="WAV2VEC2_ASR_LARGE_LV60K_960H"
        )
        
        # Load diarization pipeline
        self.diarize_model = whisperx.diarize.DiarizationPipeline(
            use_auth_token=os.environ.get("HF_TOKEN"),
            device=self.device
        )
        
        logger.info("✅ WhisperX setup complete")

    @method()
    def transcribe_and_diarize(self, audio_file_path: str, enable_speakers: bool = True, num_speakers: int = 1):
        """Simple WhisperX pipeline: transcribe + align + diarize (optionally)"""
        import whisperx
        import time
        
        start_time = time.time()
        logger.info(f"🎯 Processing: {audio_file_path}")
        
        try:
            # Load and transcribe
            audio = whisperx.load_audio(audio_file_path)

            raw_transcript_result = self.model.transcribe(audio, 
                                                          batch_size=self.batch_size,
                                                          print_progress=True)
            
            logger.info(f"📝 Raw transcription completed: {len(raw_transcript_result.get('segments', []))} segments")
            logger.info(f"🔍 Language detected: {raw_transcript_result.get('language', 'unknown')}")
            
            if enable_speakers:
                # Align for precise timestamps
                raw_transcript_result = whisperx.align(
                    raw_transcript_result["segments"], 
                    self.model_a, 
                    self.metadata, 
                    audio, 
                    self.device, 
                    return_char_alignments=False
                )

                # Assign speakers
                diarize_segments = self.diarize_model(
                    audio_file_path,
                    num_speakers=num_speakers,
                )
                # Assign speakers to transcription
                logger.info(f"🎭 Diarization completed: {len(diarize_segments)} speaker segments")
                speaker_transcript_result = whisperx.assign_word_speakers(diarize_segments, 
                                                       raw_transcript_result,
                                                       fill_nearest=True)
                transcript = self._format_result(speaker_transcript_result, time.time() - start_time, enable_speakers=True)
            else:
                # No diarization, just plain transcript
                transcript = self._format_result(raw_transcript_result, time.time() - start_time, enable_speakers=False)

            total_time = time.time() - start_time
            logger.info(f"✅ Completed in {total_time:.2f}s")
            return [transcript, total_time]
            
        except Exception as e:
            logger.error(f"❌ Failed: {e}")
            raise e

    def _format_result(self, whisperx_result, processing_time, enable_speakers: bool = False):
        """Convert WhisperX result to expected format"""
        segments = whisperx_result.get("segments", [])
        
        # Extract plain text with proper spacing
        full_text = " ".join([seg.get("text", "").strip() for seg in segments if seg.get("text", "").strip()])
        
        # Build speaker transcript with proper formatting
        speaker_parts = []
        for segment in segments:
            text = segment.get("text", "").strip()
            if not text:
                continue
                
            words = segment.get("words", [])
            if words and any(word.get("speaker") for word in words):
                # Group words by speaker with proper spacing
                current_speaker = None
                word_buffer = []
                
                for word in words:
                    speaker = word.get("speaker", "UNKNOWN")
                    word_text = word.get("word", "").strip()
                    
                    if speaker != current_speaker:
                        # Flush previous speaker's words
                        if current_speaker and word_buffer:
                            clean_text = " ".join(word_buffer).strip()
                            if clean_text:
                                speaker_parts.append(f"{current_speaker}: {clean_text}")
                        current_speaker = speaker
                        word_buffer = [word_text] if word_text else []
                    else:
                        if word_text:
                            word_buffer.append(word_text)
                
                # Flush final speaker's words
                if current_speaker and word_buffer:
                    clean_text = " ".join(word_buffer).strip()
                    if clean_text:
                        speaker_parts.append(f"{current_speaker}: {clean_text}")
            else:
                # Fallback to segment-level speaker
                speaker = segment.get("speaker", "UNKNOWN")
                speaker_parts.append(f"{speaker}: {text}")
        
        # Join speaker parts with line breaks for better readability
        # Also merge consecutive parts from the same speaker
        merged_parts = []
        current_speaker_id = None
        current_text_parts = []
        
        for part in speaker_parts:
            if ": " in part:
                speaker_id, text = part.split(": ", 1)
                
                if speaker_id == current_speaker_id:
                    # Same speaker, accumulate text
                    current_text_parts.append(text)
                else:
                    # Different speaker, flush previous and start new
                    if current_speaker_id and current_text_parts:
                        merged_text = " ".join(current_text_parts)
                        merged_parts.append(f"{current_speaker_id}: {merged_text}")
                    
                    current_speaker_id = speaker_id
                    current_text_parts = [text]
        
        # Flush final speaker
        if current_speaker_id and current_text_parts:
            merged_text = " ".join(current_text_parts)
            merged_parts.append(f"{current_speaker_id}: {merged_text}")
        
        speaker_transcript = "\n".join(merged_parts)
        
        # Print last 100 characters of speaker_transcript
        logger.info(f"DEBUG: Last 100 characters of speaker_transcript: {speaker_transcript[-100:]}")
        
        return {
            "text": full_text,
            "speaker_transcript": speaker_transcript if enable_speakers else None,
            "language": whisperx_result.get("language", "en"),
            "processing_time": processing_time
        }

    @modal_exit()
    def close_container(self):
        logger.info("Shutting down WhisperX container")
