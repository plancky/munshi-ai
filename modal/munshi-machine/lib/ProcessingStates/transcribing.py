from .summarizing import SummarizingGeminiProcessingState
from ..utils import updateOutputJson, audio_path, get_speaker_settings
from ... import config
from ...volumes import transcriptions_vol

logger = config.get_logger(__name__)


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

        # Reload volume to ensure we get latest speaker settings
        transcriptions_vol.reload()

        # Get speaker settings
        enable_speakers, num_speakers = get_speaker_settings(vid)
        logger.info(f"Starting transcription for {vid} - Speakers: {enable_speakers}, Count: {num_speakers}")

        try:
            # Simple WhisperX call
            model = WhisperX()
            if enable_speakers:
                output_data, time_elapsed = model.transcribe_and_diarize.remote(
                    str(audiofile_path),
                    enable_speakers=True,
                    num_speakers=num_speakers
                )
            else:
                # No speakers - just transcribe
                output_data, time_elapsed = model.transcribe_and_diarize.remote(
                    str(audiofile_path),
                    enable_speakers=False,
                    num_speakers=1
                )

            logger.info(f"Transcription completed in {time_elapsed:.2f}s")

            # Clean transcripts through Gemini
            logger.info("Cleaning transcripts with Gemini...")
            from ..gemini import get_cleaned_transcript, get_cleaned_speaker_transcript

            # Clean regular transcript
            if output_data.get("text"):
                cleaned_result = await get_cleaned_transcript(output_data["text"])
                if isinstance(cleaned_result, dict) and "cleaned_text" in cleaned_result:
                    output_data["text"] = cleaned_result["cleaned_text"]
                else:
                    output_data["text"] = cleaned_result
                
            # Clean speaker transcript and get mappings ONLY if speakers are enabled
            if enable_speakers and output_data.get("speaker_transcript"):
                # Get cleaned speaker transcript with mappings from JSON response
                speaker_result = await get_cleaned_speaker_transcript(output_data["speaker_transcript"])
                
                # Extract data from JSON response
                output_data["speaker_transcript"] = speaker_result.get("cleaned_transcript", output_data["speaker_transcript"])
                speaker_mappings = speaker_result.get("speaker_mappings", {})
                
                # Add speaker mappings if detected
                if speaker_mappings:
                    output_data["speaker_mappings"] = speaker_mappings
                    logger.info(f"Detected speaker mappings: {speaker_mappings}")
                
                logger.info(f"DEBUG: Final speaker_transcript to be written: {output_data['speaker_transcript']}")

            # Update output and continue
            updateOutputJson(vid, self._next_state_obj.StateSymbol, output_data)
            await self._next_state_obj.run_job(vid)

            return 0

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return -1