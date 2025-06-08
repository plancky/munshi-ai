from modal import App, Secret
import os

custom_secret = (
    Secret.from_name("dev-secrets")
    if os.environ.get("ENV") == "development"
    else Secret.from_name("custom-secret")
)
