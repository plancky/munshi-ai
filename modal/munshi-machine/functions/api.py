from __future__ import unicode_literals
from fastapi import Request, FastAPI, responses

from ..volumes import transcriptions_vol
from .. import config

# import modal functions and classes into this namespace for modal
from .transcribe import WhisperX
from .functions import init_transcription
from ..lib.utils import output_handler

from .middleware import add_cors


# Logger
logger = config.get_logger("MAIN")

# FastAPI config
web_app = FastAPI()
add_cors(web_app)

WhisperXCls = WhisperX

from fastapi import (
    FastAPI,
    UploadFile,
    Form,
    File,
    Header,
    Depends,
    HTTPException,
    status,
)
from ..lib.upload_utils import upload_chunk


async def valid_content_length(content_length: int = Header(..., lt=524_288_000)):
    return content_length


@web_app.post("/upload_file", dependencies=[Depends(valid_content_length)])
async def upload_file(
    chunk: UploadFile = File(...),
    chunkIndex: int = Form(...),
    totalChunks: int = Form(...),
    fileName: str = Form(...),
):

    try:
        if totalChunks > 60:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="too many chunks"
            )

        result = await upload_chunk(
            chunk,
            chunkIndex,
            totalChunks,
            fileName,
        )

        uploaded, fileId, is_existing = result[:3]

        if uploaded:
            if is_existing:
                # File already exists, return special status to redirect
                return responses.JSONResponse(
                    content={
                        "status": "transcript_exists", 
                        "id": fileId,
                        "message": "Transcript already exists for this file"
                    }, 
                    status_code=200
                )
            else:
                # New file uploaded successfully
                return responses.JSONResponse(
                    content={"status": "chunk received", "id": fileId}, status_code=200
                )
        else:
            return responses.JSONResponse(
                content={"status": "chunk not received"}, status_code=403
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="something went wrong")


@web_app.post("/transcribe_local")
async def transcribe_local(request: Request):
    from ..lib.ProcessingStates.init_job import InitProcessingState

    logger.info(f"Received a request {request.client}")

    payload = await request.json()
    try:
        vid = payload.get("vid")
        enable_speakers = payload.get("enable_speakers", True)  # Default to True
        num_speakers = payload.get("num_speakers", 2)          # Default to 2
        
        # Validate speaker settings
        if not isinstance(enable_speakers, bool):
            enable_speakers = True
        if not isinstance(num_speakers, int) or num_speakers < 1 or num_speakers > 10:
            num_speakers = 2
            
        logger.info(f"Processing transcription for {vid} - Speaker detection: {enable_speakers}, Expected speakers: {num_speakers}")
        
    except KeyError:
        return responses.PlainTextResponse(
            content="bad request. vid missing", status_code=400
        )

    try:
        # Initialize the transcription job first (creates proper JSON with status)
        await InitProcessingState().run_job(vid, chained=False)
        
        # Then store speaker settings in the properly initialized file
        from ..lib.utils import store_speaker_settings
        store_speaker_settings(vid, enable_speakers, num_speakers)
        
        call = init_transcription.spawn(vid)
        return responses.JSONResponse(
            content={"vid": vid, "call_id": call.object_id}, status_code=200
        )
    except RuntimeError as error:
        print(error)
        return responses.JSONResponse(
            content={"error": "Server error occurred"}, status_code=500
        )


@web_app.post("/fetch_data")
async def fetch_output(request: Request):
    logger.info(f"Received a request from {request.client}")

    payload = await request.json()
    try:
        vid = payload["vid"]
    except KeyError:
        return responses.PlainTextResponse(
            content="bad request. vid missing", status_code=400
        )
    try:
        transcriptions_vol.reload()
        oh = output_handler(vid)
        status, data, metadata = oh.status, oh.data, oh.get_metadata()
        pass
    except RuntimeError as Error:
        return responses.JSONResponse(
            content={
                "error": "Could not find output log, You must initiate the transcription first."
            },
            status_code=406,
        )
    return responses.JSONResponse(
        content={"status": status, "data": data, "metadata": metadata}, status_code=200
    )


@web_app.post("/update_speakers")
async def update_speakers(request: Request):
    """Update speaker name mappings for a transcript"""
    transcriptions_vol.reload()
    logger.info(f"Received speaker update request from {request.client}")

    payload = await request.json()
    try:
        vid = payload["vid"]
        speaker_mappings = payload["speaker_mappings"]
    except KeyError as e:
        return responses.PlainTextResponse(
            content=f"bad request. missing: {e}", status_code=400
        )

    try:
        oh = output_handler(vid)
        
        # Update speaker mappings in the data
        if not hasattr(oh, 'data') or oh.data is None:
            oh.data = {}
        oh.data["speaker_mappings"] = speaker_mappings
        
        # Save the updated data
        oh.write_transcription_data()
        transcriptions_vol.commit()
        
        logger.info(f"Updated speaker mappings for {vid}: {speaker_mappings}")
        
        return responses.JSONResponse(
            content={"status": "success", "message": "Speaker mappings updated"}, 
            status_code=200
        )

    except Exception as e:
        logger.error(f"Error updating speaker mappings for {vid}: {e}")
        return responses.JSONResponse(
            content={"error": "Failed to update speaker mappings"}, 
            status_code=500
        )

@web_app.get("/health")
async def health():
    return True

if __name__ == "__main__":
    pass
