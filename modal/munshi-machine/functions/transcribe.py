from modal import method, enter, exit as modal_exit
import modal
import os
import tempfile

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
        self.batch_size = 16
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
        self.diarize_model = whisperx.DiarizationPipeline(
            use_auth_token=os.environ.get("HF_TOKEN"),
            device=self.device
        )
        
        logger.info("✅ WhisperX setup complete")

    @method()
    def transcribe_and_diarize(self, audio_file_path: str, min_speakers: int = 1, max_speakers: int = 10):
        """Simple WhisperX pipeline: transcribe + align + diarize"""
        import whisperx
        import time
        
        start_time = time.time()
        logger.info(f"🎯 Processing: {audio_file_path}")
        
        try:
            # Load and transcribe
            audio = whisperx.load_audio(audio_file_path)
            result = self.model.transcribe(audio, batch_size=self.batch_size)
            
            logger.info(f"📝 Raw transcription completed: {len(result.get('segments', []))} segments")
            logger.info(f"🔍 Language detected: {result.get('language', 'unknown')}")
            
            # Align for precise timestamps
            result = whisperx.align(
                result["segments"], 
                self.model_a, 
                self.metadata, 
                audio, 
                self.device, 
                return_char_alignments=False
            )
            
            # Assign speakers
            diarize_segments = self.diarize_model(
                audio_file_path,
                min_speakers=min_speakers,
                max_speakers=max_speakers
            )
            
            # Assign speakers to transcription
            logger.info(f"🎭 Diarization completed: {len(diarize_segments)} speaker segments")
            
            result = whisperx.assign_word_speakers(diarize_segments, 
                                                   result,
                                                   fill_nearest=True)

            total_time = time.time() - start_time
            formatted_result = self._format_result(result, total_time)
            
            logger.info(f"✅ Completed in {total_time:.2f}s")
            return [formatted_result, total_time]
            
        except Exception as e:
            logger.error(f"❌ Failed: {e}")
            raise e

    def _format_result(self, whisperx_result, processing_time):
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
        
        logger.info(f"DEBUG: Full speaker_transcript after formatting: {speaker_transcript}")
        
        return {
            "text": full_text,
            "speaker_transcript": speaker_transcript,
            "language": whisperx_result.get("language", "en"),
            "processing_time": processing_time
        }

    @modal_exit()
    def close_container(self):
        logger.info("Shutting down WhisperX container")
