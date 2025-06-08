from fastapi import Request, FastAPI, responses
from fastapi.middleware.cors import CORSMiddleware


def add_cors(app: FastAPI):
    import os

    frontend_app_url = os.environ.get("FRONTEND_APP_URL")
    origins = [frontend_app_url]
    local_url = os.environ.get("ENV", "development") 
    if (local_url == "development"): 
        origins = ["*"]
        print("Running in dev mode...")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["POST", "GET", "OPTIONS", "DELETE"],
        allow_headers=["*"],
    )
    return app
