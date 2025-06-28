from modal import App
from .secrets import custom_secret
from . import config
from .volumes import transcriptions_vol, audio_storage_vol
from .images import base_image, cuda_image

app = App(name="munshi-machine-for-chirag", secrets=[custom_secret])
