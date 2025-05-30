from ..utils import (
    output_handler,
    get_vid_from_url,
    MUNSHI_TRANSCRIPTION_STATUS,
    audio_path,
    get_url_from_vid,
    updateOutputJson,
)

from .Summarizing import SummarizingGeminiProcessingState
from .Transcribing import TranscribingProcessingState
from .Completed import CompletedProcessingState
from .FetchingAudio import FetchingAudioProcessingState

import asyncio
import pathlib
from ... import config

logger = config.get_logger(__name__)


def processingStateFactory(symbol):
    STATE_MAP = {
        "Init": InitProcessingState(),
        "initiated": InitProcessingState(),
        "FetchingAudio": FetchingAudioProcessingState(),
        "downloading_audio": FetchingAudioProcessingState(),
        "Transcribing": TranscribingProcessingState(),
        "Summarizing": SummarizingGeminiProcessingState(),
        "Completed": CompletedProcessingState(),
        "Failed": FailedProcessingState(),
    }

    return STATE_MAP[symbol]


class ProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = ""
        pass

    def _next_state():
        pass

    def run_job(vid):
        pass


class InitProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Init"

        pass

    def _next_state(self):
        return FetchingAudioProcessingState()

    async def run_job(self, vid: str, audiofile: str = None, chained=True):
        from ...volumes import transcriptions_vol, audio_storage_vol

        # initate output json
        outputHandler = output_handler(vid)
        # outputHandler.initiate()

        # update new state on the output json
        out_path = outputHandler.out_path
        if not pathlib.Path(out_path).exists():
            logger.info(
                f"Output file doesn't exist, initiating new output file {out_path}"
            )
            updateOutputJson(vid, symbol=self.StateSymbol, data={})
            logger.info(f"Initiated new output file {out_path}")
            transcriptions_vol.commit()
            audio_storage_vol.commit()

        if (audiofile is not None):
            # save audiofile
            pass

        if chained:
            await self._next_state().run_job(vid)
        else:
            await asyncio.sleep(0.001)

        return 0


class FailedProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Failed"
        pass

    def _next_state(self):
        return InitProcessingState()

    def run_job(self, vid: str) -> None:
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)
        pass
