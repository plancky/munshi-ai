from ..config import RAW_AUDIO_DIR, get_logger, COBALT_API_URL

logger = get_logger("DOWNLOAD_AUDIO", 10)


def get_stored_audio(path: str):
    with open(path, "rb") as f:
        audio = f.read()
    return audio


def download_audio(url: str):
    watch_id = url.split("watch?v=")[-1]
    path = f"{RAW_AUDIO_DIR}/{watch_id}"
    logger.info(f"Setting up Downloader... {path}")
    # pytubeDownload(url)
    DownloadYTAudio(url, path, COBALT_API_URL)


def custom_po_token_verifier():
    data = {
        "visitorData": "CgszUFpPa3NFRkRBcyjZ6-63BjIKCgJJThIEGgAgGQ%3D%3D",
        "poToken": "MnSZrXDt6isWRZmVvXMY9LgIwfASBFdaFglQ8lJOeKAhxXR7a27pkqEuFpJnpNpCP5HfBJKn64y9heyZUi0j7HGDu6wZ9jYXYRJZGtSpwNMSdS6hWEJcfouh6xyM7rqU1E6WqP4BiH_d4RNW5Kv31SgjfI9VkQ==",
    }
    return data["visitorData"], data["poToken"]


def setupPytube(url):
    from pytubefix import YouTube

    for _i in range(3):
        try:
            ytc = YouTube(
                url,
                use_po_token=True,
                allow_oauth_cache=True,
                po_token_verifier=custom_po_token_verifier,
            )

            audio_streams = ytc.streams.filter(only_audio=True, file_extension="webm")

            video_title = YouTube(url).title
            logger.info(
                f"\nVideo found: {video_title},\n Audio streams found: {audio_streams}"
            )
            return ytc, audio_streams, video_title
            break
        except:
            if _i == 2:
                logger.error(f"Error occurred while trying to setup pytube")
                return None, None, None
                raise RuntimeError("unable to handle error")
            continue


async def pytubeDownload(url: str):
    watch_id = url.split("watch?v=")[-1]
    path = f"{RAW_AUDIO_DIR}/{watch_id}"
    logger.info(f"Setting up pytube... {path}")
    ytc, audio_streams, entry = setupPytube(url)
    if audio_streams == None:
        logger.info(f"Audiostream not found, Aborting download")
        return -1
    logger.info(f"Downloading Audio at {path}")
    audio_streams[0].download(filename=path, mp3=True)
    logger.info(f"Audio Downloaded {path}")


def DownloadYTAudio(url, path, gc_hosted_url):
    import requests as reqs

    """
    Downloads YouTube audio using a hypothetical external service.

    Args:
      url: The YouTube video URL.
      gc_hosted_url: The URL of the external service.

    Returns:
      None (the function prints the response to the console).
    """

    payload = {
        "url": url,
        "downloadMode": "audio",
        "audioBitrate": "64",
        "youtubeHLS": True,
    }

    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    logger.debug(f"Requesting with payload: {payload}")
    try:
        response = reqs.post(gc_hosted_url, json=payload, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        response_data = response.json()
        res_status = response_data["status"]
        if res_status == "tunnel":
            tunnel_url = response_data["url"]
            logger.info(f"Downloading Audio at {path}")
            response = download_audio_from_tunnel_stream(tunnel_url, path)

    except reqs.exceptions.RequestException as e:
        logger.error(f"An error occurred during the request: {e} {response.json()}")


def download_audio_from_tunnel_stream(url, filename="audio.mp3"):
    """
    Downloads an audio file from the given URL.

    Args:
      url: The URL of the audio file.
      filename: The desired filename for the downloaded file.

    Returns:
      None
    """
    import requests as reqs

    try:
        response = reqs.get(url, stream=True)
        response.raise_for_status()  # Raise an exception for bad status codes

        with open(filename + ".mp3", "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:  # filter out keep-alive new chunks
                    f.write(chunk)

        logger.info(f"Audio downloaded successfully to '{filename}'")

    except reqs.exceptions.RequestException as e:
        print(f"An error occurred during the download: {e}")


def get_metadata(vid):
    from mutagen.easyid3 import EasyID3

    path = f"{RAW_AUDIO_DIR}/{vid}.mp3"

    audio = EasyID3(path)
    logger.info(f"Found ID3 tags: {audio}")
    return {"title": audio.get("title", None), "author": audio.get("artist", None)}


if __name__ == "__main__":
    # url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"
    # pytubeDownload(url)

    # Example usage
    youtube_url = "https://www.youtube.com/watch?v=kG5Qb9sr0YQ"

    DownloadYTAudio(youtube_url, "cobalt-test-audio.mp3", COBALT_API_URL)
