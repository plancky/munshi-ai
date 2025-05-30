from ..app import app, base_image
from ..secrets import custom_secret
from ..volumes import (
    audio_storage_vol,
    transcriptions_vol,
    upload_audio_vol,
    chunk_storage_vol,
)
from .. import config
from ..lib.utils import (
    audio_path,
    MUNSHI_TRANSCRIPTION_STATUS,
    output_handler,
    get_vid_from_url,
)
from ..lib.ProcessingStates.InitJob import InitProcessingState, processingStateFactory

logger = config.get_logger(__name__)


from modal import concurrent


@app.function(
    image=base_image,
    volumes={
        str(config.RAW_AUDIO_DIR): audio_storage_vol,
        str(config.TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
    secrets=[custom_secret],
    timeout=2000,
)
async def init_transcription(url: str, vid: str = None):
    from ..lib.utils import get_vid_from_url, output_handler

    transcriptions_vol.reload()
    audio_storage_vol.reload()

    logger.info("Running init_transcription function")
    # refresh volumes
    if vid is None:
        vid = get_vid_from_url(url)
    oh = output_handler(vid)
    try:
        if oh.get_output() == -1:
            await InitProcessingState().run_job(vid)
        else:
            await processingStateFactory(oh.status).run_job(vid)

    except Exception as E:
        logger.info("Unkown error occured: ", E)
        return "Unkown Error"



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
async def get_audio(url: str, processingStateObj: object = None):
    from ..lib.download_audio import get_stored_audio, download_audio

    # transcriptions_vol.reload()
    # audio_storage_vol.reload()
    vid = get_vid_from_url(url)
    audiofile_path = audio_path(vid)

    if audiofile_path.exists():
        return get_stored_audio(audiofile_path)
    try:
        download_audio(url)
        if processingStateObj:
            processingStateObj._next_state().run_job(vid)
        return get_stored_audio(audiofile_path)
    except Exception as err:
        print("Error occured while downloading the audio file.", err)
        # set error on output_file file
        return None


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
