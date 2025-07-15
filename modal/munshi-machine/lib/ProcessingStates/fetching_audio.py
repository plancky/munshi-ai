from ... import config

logger = config.get_logger(__name__)
from ..utils import (
    updateOutputJson,
    updateOutputJsonDict,
    audio_path,
    output_handler,
)
from .transcribing import TranscribingProcessingState


class FetchingAudioProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "FetchingAudio"

    def _next_state(self):
        return TranscribingProcessingState()

    async def run_job(self, vid: str) -> int | bytes:
        from ..download_audio import get_stored_audio

        self.vid = vid

        logger.info(f"Fetching Audio...")
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)

        audiofile_path = audio_path(vid)
        oh = output_handler(vid)

        if audiofile_path.exists():
            if oh.output.get("title") is None:
                self.update_metadata()

            audio_data = get_stored_audio(audiofile_path)
            
            # Start processing chain
            await self._next_state().run_job(vid)
            
            return audio_data
        try:
            self.update_metadata()
            await self._next_state().run_job(vid)
            return get_stored_audio(audiofile_path)

        except Exception as err:
            print("Error occured while downloading the audio file.", err)
            # set error on output_file file
            return 0

    def update_metadata(self):
        from ..download_audio import get_metadata

        logger.info(f"Updating Metadata...")
        updateOutputJsonDict(self.vid, get_metadata(self.vid))
