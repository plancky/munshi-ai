from modal import App, Secret

from . import config
from .volumes import transcriptions_vol, audio_storage_vol
from .images import base_image, cuda_image

custom_secret = Secret.from_name("custom-secret")
app = App(name="munshi-machine", secrets=[custom_secret])
