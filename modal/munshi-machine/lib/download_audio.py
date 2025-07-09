from ..config import RAW_AUDIO_DIR, get_logger

logger = get_logger("DOWNLOAD_AUDIO", 10)


def get_stored_audio(path: str):
    with open(path, "rb") as f:
        audio = f.read()
    return audio


def get_metadata(vid):
    try:
        from mutagen.easyid3 import EasyID3

        path = f"{RAW_AUDIO_DIR}/{vid}.mp3"
        audio = EasyID3(path)
        logger.info(f"Found ID3 tags: {audio}")
        
        # Safely extract metadata with fallbacks
        title = audio.get("title", [None])[0] 
        artist = audio.get("artist", [None])[0]
        return {"title": title, "author": artist}

    except Exception as e:
        logger.warning(f"Could not extract metadata from {vid}: {e}")
        return {"title": None, "author": None}
