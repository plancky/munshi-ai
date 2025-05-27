from __future__ import unicode_literals
from fastapi import Request, FastAPI, responses
from fastapi.middleware.cors import CORSMiddleware
from modal import (
    asgi_app,
)

from ..volumes import transcriptions_vol
from .. import config

# import modal functions and classes into this namespace for modal
from .transcribe import WhisperV3
from .functions import get_output, init_transcription, gen_summary

# Logger
logger = config.get_logger("MAIN")

# FastAPI config
web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WhisperV3Cls = WhisperV3


@web_app.post("/transcribe")
async def transcribe(request: Request):
    from ..lib.utils import get_vid_from_url
    from ..lib.ProcessingState import InitProcessingState

    logger.info(f"Received a request {request.client}")

    payload = await request.json()
    try:
        url = payload["url"]
        vid = payload.get("vid", get_vid_from_url(url))
    except KeyError:
        return responses.PlainTextResponse(
            content="bad request. url or vid missing", status_code=400
        )

    try:
        await InitProcessingState().run_job(vid, chained=False) 
        call = init_transcription.spawn(url)
        return responses.JSONResponse(
            content={"vid": vid, "call_id": call.object_id}, status_code=200
        )
    except RuntimeError as error:
        print(error)
        return responses.JSONResponse(
            content={"error": "Server error occurred"}, status_code=500
        )


@web_app.get("/stats")
def stats(request: Request):
    from .transcribe import WhisperV3

    print("Received a request from", request.client)

    model = WhisperV3()
    f = model.generate
    return f.get_current_stats()


@web_app.post("/fetch_data")
async def fetch_output(request: Request):
    transcriptions_vol.reload()
    # audio_storage_vol.reload()
    logger.info(f"Received a request from {request.client}")

    payload = await request.json()
    try:
        vid = payload["vid"]
    except KeyError:
        return responses.PlainTextResponse(
            content="bad request. vid missing", status_code=400
        )
    try:
        status, data = get_output.remote(vid)
        pass
    except RuntimeError as Error:
        return responses.JSONResponse(
            content={
                "error": "Could not find output log, You must initiate the transcription first."
            },
            status_code=406,
        )
    return responses.JSONResponse(
        content={"status": status, "data": data}, status_code=200
    )


@web_app.post("/summarize")
async def summarize(request: Request):
    transcriptions_vol.reload()
    # audio_storage_vol.reload()
    logger.info(f"Received a request from {request.client}")

    payload = await request.json()
    try:
        vid = payload["vid"]
    except KeyError:
        return responses.PlainTextResponse(
            content="bad request. vid missing", status_code=400
        )

    try:
        summary = await gen_summary.remote(vid)
        pass

    except RuntimeError as Error:
        return responses.JSONResponse(
            content={
                "error": "Could not find transcription, You must transcript first."
            },
            status_code=406,
        )

    return responses.JSONResponse(content={"data": summary}, status_code=200)


if __name__ == "__main__":
    pass
