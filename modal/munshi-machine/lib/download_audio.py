from ..config import get_logger

logger = get_logger("DOWNLOAD_AUDIO", 10)


def get_stored_audio(path: str):
    with open(path, "rb") as f:
        audio = f.read()
    return audio


def get_metadata(vid):
    try:
        from mutagen.easyid3 import EasyID3
        from .utils import audio_path

        path = str(audio_path(vid))
        audio = EasyID3(path)
        logger.info(f"Found ID3 tags: {audio}")
        
        # Safely extract metadata with fallbacks
        title = audio.get("title", [None])[0] if audio.get("title") else None
        artist = audio.get("artist", [None])[0] if audio.get("artist") else None
        
        return {"title": title, "author": artist}
    except Exception as e:
        logger.warning(f"Could not extract metadata from {vid}: {e}")
        return {"title": None, "author": None}
