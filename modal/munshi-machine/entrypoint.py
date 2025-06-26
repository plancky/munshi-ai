from .app import app, custom_secret
from modal import asgi_app
from .volumes import transcriptions_vol, audio_storage_vol
from . import config
from .functions.api import web_app
import modal


# Mount FastApi web api app
@app.function(
    volumes={
        str(config.RAW_AUDIO_DIR): audio_storage_vol,
        str(config.TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
    secrets=[custom_secret],
    max_containers=4,
    scaledown_window=200,
    timeout=2000,
)
@modal.concurrent(max_inputs=100)
@asgi_app()
def entrypoint():
    return web_app


# Local entrypoint for testing
@app.local_entrypoint()
def main():
    from .functions.functions import init_transcription

    test_id = "local_test123"
    audio = init_transcription.remote(test_id)
    print(audio)
