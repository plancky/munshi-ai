from ..utils import (
    output_handler,
    updateOutputJson,
)

from .summarizing import SummarizingGeminiProcessingState
from .transcribing import TranscribingProcessingState
from .completed import CompletedProcessingState
from .fetching_audio import FetchingAudioProcessingState

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

    def _next_state():
        return None

    def run_job(vid):
        return None


class InitProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Init"

    def _next_state(self):
        return FetchingAudioProcessingState()

    async def run_job(self, vid: str, audiofile: str = None, chained=True):
        from ...volumes import transcriptions_vol, audio_storage_vol

        # initate output json
        outputHandler = output_handler(vid)

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

        if audiofile is not None:
            # save audiofile
            logger.info("Audiofile parameter provided but not implemented")

        if chained:
            await self._next_state().run_job(vid)
        else:
            await asyncio.sleep(0.001)

        return 0


class FailedProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Failed"

    def _next_state(self):
        return InitProcessingState()

    def run_job(self, vid: str) -> None:
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)
