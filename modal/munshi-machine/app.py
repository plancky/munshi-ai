from modal import App
from .secrets import custom_secret

app = App(name="munshi-machine-for-chirag", secrets=[custom_secret])
