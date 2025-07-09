from ..app import app
from ..images import base_image
from ..secrets import custom_secret
from ..volumes import (
    audio_storage_vol,
    transcriptions_vol,
)
from .. import config
from ..lib.utils import (
    output_handler,
)
from ..lib.ProcessingStates.init_job import InitProcessingState, processingStateFactory

logger = config.get_logger(__name__)

@app.function(
    image=base_image,
    volumes={
        str(config.RAW_AUDIO_DIR): audio_storage_vol,
        str(config.TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
    secrets=[custom_secret],
    timeout=2000,
)
async def init_transcription(vid: str = None):
    from ..lib.utils import output_handler

    transcriptions_vol.reload()
    audio_storage_vol.reload()

    logger.info("Running init_transcription function")
    # refresh volumes
    oh = output_handler(vid)
    try:
        if oh.get_output() == -1:
            await InitProcessingState().run_job(vid)
        else:
            await processingStateFactory(oh.status).run_job(vid)

    except Exception as E:
        logger.info(f"Unknown error occurred: {E}")
        return "Unknown Error"



@app.function(
    image=base_image,
    volumes={
        str(config.RAW_AUDIO_DIR): audio_storage_vol,
        str(config.TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
    timeout=10,
)
def delete_cache(vid: str, mode="t"):
    import os

    transcriptions_vol.reload()
    oh = output_handler(vid)
    try:
        os.remove(oh.out_path)
    except FileNotFoundError:
        print("Error occured while deleting the transcription file.")

    if mode != "f":
        return True

    try:
        os.remove(oh.audio_path)
        return True
    except FileNotFoundError:
        print("Error occured while deleting the audio file.")





@app.function(
    image=base_image,
    volumes={
        str(config.RAW_AUDIO_DIR): audio_storage_vol,
        str(config.TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
    timeout=2000,
)
async def gen_summary(vid: str) -> str:
    from ..lib.gemini import get_summary

    return get_summary(vid)
