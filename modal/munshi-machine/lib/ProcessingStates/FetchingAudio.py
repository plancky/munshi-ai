from ... import config

logger = config.get_logger(__name__)
from ..utils import updateOutputJson, updateOutputJsonDict, audio_path, get_url_from_vid
from .Transcribing import TranscribingProcessingState


class FetchingAudioProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "FetchingAudio"
        pass

    def _next_state(self):
        return TranscribingProcessingState()

    async def run_job(self, vid: str) -> int | bytes:
        from ..download_audio import get_stored_audio, download_audio, get_metadata

        logger.info(f"Fetching Audio...")
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)

        # call = get_audio.spawn(get_url_from_vid(vid), self)

        audiofile_path = audio_path(vid)
        if audiofile_path.exists():
            await self._next_state().run_job(vid)
            return get_stored_audio(audiofile_path)
        try:
            download_audio(get_url_from_vid(vid))

            logger.info(f"Updating Metadata...")
            updateOutputJsonDict(vid, get_metadata(vid))
            await self._next_state().run_job(vid)
            return get_stored_audio(audiofile_path)

        except Exception as err:
            print("Error occured while downloading the audio file.", err)
            # set error on output_file file
            return 0

    
