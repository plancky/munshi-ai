from urllib.parse import urlparse, parse_qs
from ..config import RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR
import pathlib
import json

from .. import config

# Logger
logger = config.get_logger("UTILS")


def get_vid_from_url(url: str) -> str:
    return parse_qs(urlparse(url).query)["v"][0]


def get_url_from_vid(vid: str) -> str:
    if vid.startswith("local_"):
        return ""
    return f"https://www.youtube.com/watch?v={vid}"


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
    "downloading_audio": "downloading_audio",
    "transcribing": "transcribing",
    "completed": "completed",
}


class output_handler:
    def __init__(self, vid):
        self.vid = vid
        self.out_path = f"{TRANSCRIPTIONS_DIR}/{vid}.json"
        self.audio_path = f"{RAW_AUDIO_DIR}/{vid}.mp3"
        self.get_output()
        pass

    def next_status(self):
        _states = list(MUNSHI_TRANSCRIPTION_STATUS.keys())
        self.status = MUNSHI_TRANSCRIPTION_STATUS[
            _states[_states.index(self.status) + 1]
        ]
        self.write_transcription_data()

    def initiate(self):
        if not pathlib.Path(self.out_path).exists():
            logger.log(
                f"Output file doesn't exist, initiating new output file {self.out_path}"
            )
            self.status = "Init"
            self.data = {}
            self.write_transcription_data()
            logger.log(f"Initiated new output file {self.out_path}")
            pass
        else:
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
        pass

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


if __name__ == "__main__":
    print(get_vid_from_url("https://www.youtube.com/watch?v=tAGnKpE4NCI"))
