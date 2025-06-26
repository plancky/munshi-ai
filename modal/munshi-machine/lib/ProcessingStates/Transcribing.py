from .summarizing import SummarizingGeminiProcessingState
from ..utils import updateOutputJson, audio_path, get_speaker_settings
from ... import config
import re

logger = config.get_logger(__name__)


def parse_speaker_mappings(cleaned_transcript: str) -> tuple[str, dict]:
    """
    Parse speaker mappings from cleaned transcript and return clean transcript + mappings
    Expected formats:
    - SPEAKER_MAPPINGS: SPEAKER_00=Name1, SPEAKER_01=Name2
    - # SPEAKER_00 = Name1 # SPEAKER_01 = Name2
    """
    lines = cleaned_transcript.strip().split('\n')
    mappings = {}
    
    # Check first few lines for speaker mappings
    cleaned_lines = []
    for line in lines:
        line_processed = False
        
        if line.startswith('SPEAKER_MAPPINGS:'):
            # Parse mappings: SPEAKER_MAPPINGS: SPEAKER_00=Name1, SPEAKER_01=Name2
            mapping_text = line.replace('SPEAKER_MAPPINGS:', '').strip()
            pairs = mapping_text.split(',')
            for pair in pairs:
                if '=' in pair:
                    speaker_id, name = pair.strip().split('=', 1)
                    mappings[speaker_id.strip()] = name.strip()
            line_processed = True
            
        elif line.startswith('#') and 'SPEAKER_' in line and '=' in line:
            # Handle format: # SPEAKER_00 = Name1 # SPEAKER_01 = Name2
            # Split by # first to handle multiple mappings in one line
            parts = line.split('#')
            for part in parts:
                part = part.strip()
                if part and 'SPEAKER_' in part and '=' in part:
                    # Parse each part: SPEAKER_00 = Name1
                    if '=' in part:
                        speaker_id, name = part.split('=', 1)
                        speaker_id = speaker_id.strip()
                        name = name.strip()
                        
                        # Extract speaker ID (remove any extra text)
                        speaker_match = re.search(r'SPEAKER_\d+', speaker_id)
                        if speaker_match:
                            clean_speaker_id = speaker_match.group()
                            # Clean up name (remove parentheses content if needed)
                            
                            clean_name = name.strip()
                          
                            mappings[clean_speaker_id] = clean_name
            line_processed = True
        
        # Only add line to cleaned transcript if it wasn't a mapping line
        if not line_processed:
            cleaned_lines.append(line)
    
    # Join back the cleaned transcript without mapping lines
    clean_transcript = '\n'.join(cleaned_lines).strip()
    
    logger.info(f"Parsed speaker mappings: {mappings}")
    return clean_transcript, mappings


class TranscribingProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Transcribing"
        self._next_state_obj = SummarizingGeminiProcessingState()

    def _next_state(self):
        return self._next_state_obj

    async def run_job(self, vid: str) -> None:
        from ...functions.transcribe import WhisperX
        
        # Update state
        updateOutputJson(vid, self.StateSymbol)
        
        # Check audio file exists
        audiofile_path = audio_path(vid)
        if not audiofile_path.exists():
            raise RuntimeError(f"Audio file missing: {audiofile_path}")
        
        # Get speaker settings
        enable_speakers, num_speakers = get_speaker_settings(vid)
        
        logger.info(f"Starting transcription for {vid} - Speakers: {enable_speakers}, Count: {num_speakers}")
        
        try:
            # Simple WhisperX call
            model = WhisperX()
            
            if enable_speakers:
                output_data, time_elapsed = model.transcribe_and_diarize.remote(
                    str(audiofile_path),
                    min_speakers=1,
                    max_speakers=min(10, max(num_speakers + 2, 5))
                )
            else:
                # No speakers - just transcribe
                output_data, time_elapsed = model.transcribe_and_diarize.remote(
                    str(audiofile_path),
                    min_speakers=1,
                    max_speakers=1
                )
                # Remove speaker info for non-speaker mode
                output_data["speaker_transcript"] = output_data["text"]
            
            logger.info(f"Transcription completed in {time_elapsed:.2f}s")
            
            # Clean transcripts through Gemini
            logger.info("Cleaning transcripts with Gemini...")
            from ..gemini import get_cleaned_transcript, get_cleaned_speaker_transcript
            
            # Clean regular transcript
            if output_data.get("text"):
                output_data["text"] = await get_cleaned_transcript(output_data["text"])
            
            # Clean speaker transcript and parse mappings
            if output_data.get("speaker_transcript") and output_data["speaker_transcript"] != output_data.get("text"):
                logger.info(f"DEBUG: Speaker transcript before Gemini: {output_data['speaker_transcript']}")
                cleaned_speaker_transcript = await get_cleaned_speaker_transcript(output_data["speaker_transcript"])
                logger.info(f"DEBUG: Speaker transcript after Gemini: {cleaned_speaker_transcript}")
                # Parse speaker mappings from cleaned transcript
                clean_transcript, speaker_mappings = parse_speaker_mappings(cleaned_speaker_transcript)
                output_data["speaker_transcript"] = clean_transcript
                if speaker_mappings:
                    output_data["speaker_mappings"] = speaker_mappings
                    logger.info(f"Detected speaker mappings: {speaker_mappings}")
                logger.info(f"DEBUG: Final speaker_transcript to be written: {output_data['speaker_transcript']}")
            
            logger.info("Transcript cleaning completed")
            
            # Update output and continue
            updateOutputJson(vid, self._next_state_obj.StateSymbol, output_data)
            await self._next_state_obj.run_job(vid)
            
            return 0
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return -1