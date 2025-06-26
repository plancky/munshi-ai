
from ..config import RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR
import pathlib
import json

from .. import config

logger = config.get_logger("UTILS")


def audio_path(vid: str) -> pathlib.Path:
    return pathlib.Path(RAW_AUDIO_DIR, f"{vid}.mp3")


def updateOutputJson(vid: str, symbol: str = None, data=None):
    outputHandler = output_handler(vid)
    if symbol != None:
        outputHandler.update_field("status", symbol)
    if data != None:
        outputHandler.update_field("data", data)
    outputHandler.write_transcription_data()


def updateOutputJsonDict(vid: str, fieldsDict):
    outputHandler = output_handler(vid)
    for fieldname in fieldsDict.keys():
        outputHandler.update_field(fieldname, fieldsDict[fieldname])
    outputHandler.write_transcription_data()


MUNSHI_TRANSCRIPTION_STATUS = {
    "initiated": "initiated",
    "transcribing": "transcribing",
    "completed": "completed",
}


class output_handler:
    def __init__(self, vid):
        self.vid = vid
        self.out_path = f"{TRANSCRIPTIONS_DIR}/{vid}.json"
        self.audio_path = f"{RAW_AUDIO_DIR}/{vid}.mp3"
        self.get_output()



    def write_output_data(self, data):
        self.data = data
        self.write_transcription_data()

    def update_field(self, fieldname, value):
        self.output[fieldname] = value

    def get_metadata(self):
        return {"title": self.output.get("title"), "author": self.output.get("author")}

    def write_transcription_data(self):
        with open(self.out_path, "w+", encoding="utf-8") as output_file:
            json.dump(
                self.output,
                output_file,
                ensure_ascii=False,
                indent=4,
            )

    def get_output(self):
        if not pathlib.Path(self.out_path).exists():
            self.output = {}
            return -1

        with open(self.out_path, "r", encoding="utf-8") as output_file:
            _output = json.load(output_file)
            self.status = _output.get("status")
            self.data = _output.get("data", None)
            self.output = _output

        return 0


def store_speaker_settings(vid: str, enable_speakers: bool, num_speakers: int):
    """Store speaker settings for a given video ID."""
    outputHandler = output_handler(vid)
    speaker_settings = {
        "enable_speakers": enable_speakers,
        "num_speakers": num_speakers
    }
    outputHandler.update_field("speaker_settings", speaker_settings)
    outputHandler.write_transcription_data()
    logger.info(f"Stored speaker settings for {vid}: {speaker_settings}")


def get_speaker_settings(vid: str):
    """Retrieve speaker settings for a given video ID."""
    outputHandler = output_handler(vid)
    speaker_settings = outputHandler.output.get("speaker_settings", {})
    
    # Default values if not found
    enable_speakers = speaker_settings.get("enable_speakers", True)
    num_speakers = speaker_settings.get("num_speakers", 2)
    
    logger.info(f"Retrieved speaker settings for {vid}: enable={enable_speakers}, num={num_speakers}")
    return enable_speakers, num_speakers


if __name__ == "__main__":
    print("Testing local file ID...")
    print(get_vid_from_url("local_test123"))
