from .Summarizing import SummarizingGeminiProcessingState
from ..utils import updateOutputJson, audio_path
from ... import config
import pathlib
import asyncio
from typing import Iterator, Tuple

logger = config.get_logger(__name__)


class TranscribingProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Transcribing"
        self._next_state_obj = SummarizingGeminiProcessingState()
        pass

    def _next_state(self):
        return self._next_state_obj

    async def run_job(self, vid: str) -> None:
        from ..download_audio import get_stored_audio
        from ...functions.transcribe import WhisperV3
        from ..gemini import get_cleaned_transcript

        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)

        audiofile_path = audio_path(vid)
        if audiofile_path.exists():
            audio = get_stored_audio(audiofile_path)
        else:
            raise RuntimeError(f"Audiofile is missing. {audiofile_path}")

        # spawns the generate function instance which does the transcription in async
        model = WhisperV3()
        try:
            output_data, time_elapsed = transcribe_episode(audiofile_path)
            # output_data, time_elapsed = await transcribe_episode(audio_filepath=audiofile_path)
            print(output_data)
            # output_data["text"] = await get_cleaned_transcript(output_data["text"])
            updateOutputJson(vid, self._next_state_obj.StateSymbol, output_data)
            await self._next_state_obj.run_job(vid)
            return 0
        except Exception as E:
            logger.error(f"Error occurred while transcibing: {E}")
            return -1


def split_silences(
    path: str, min_segment_length: float = 480.0, min_silence_length: float = 1.0
) -> Iterator[Tuple[float, float]]:
    """Split audio file into contiguous chunks using the ffmpeg `silencedetect` filter.
    Yields tuples (start, end) of each chunk in seconds."""

    import re

    import ffmpeg

    silence_end_re = re.compile(
        r" silence_end: (?P<end>[0-9]+(\.?[0-9]*)) \| silence_duration: (?P<dur>[0-9]+(\.?[0-9]*))"
    )

    metadata = ffmpeg.probe(path)
    duration = float(metadata["format"]["duration"])

    reader = (
        ffmpeg.input(str(path))
        .filter("silencedetect", n="-12dB", d=min_silence_length)
        .output("pipe:", format="null")
        .run_async(pipe_stderr=True)
    )

    cur_start = 0.0
    num_segments = 0
    segments = []

    while True:
        line = reader.stderr.readline().decode("utf-8")
        if not line:
            break
        match = silence_end_re.search(line)
        if match:
            silence_end, silence_dur = match.group("end"), match.group("dur")
            split_at = float(silence_end) - (float(silence_dur) / 2)

            if (split_at - cur_start) < min_segment_length:
                continue

            segments.append((cur_start, split_at))
            cur_start = split_at
            num_segments += 1

    # silencedetect can place the silence end *after* the end of the full audio segment.
    # Such segments definitions are negative length and invalid.
    if duration > cur_start:
        # yield cur_start, duration
        segments.append((cur_start, duration))
        num_segments += 1
    logger.info(f"Split {path} into {num_segments} segments")

    return segments


def transcribe_segment(
    start: float,
    end: float,
    audio_filepath: pathlib.Path,
    # model: config.ModelSpec,
):
    import tempfile
    import time

    import concurrent.futures
    import ffmpeg

    # import torch
    # import whisper
    t0 = time.time()
    # loop = asyncio.get_running_loop()

    from ...functions.transcribe import WhisperV3

    model = WhisperV3()
    with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
        (
            ffmpeg.input(str(audio_filepath))
            .filter("atrim", start=start, end=end)
            .output(f.name)
            .overwrite_output()
            .run(quiet=True)
        )
        f.seek(0)
        audio = f.read()
        print("transcribing segment", start, end, audio_filepath)
        # 3. Run in a custom process pool:
        # result, time_elapsed = await loop.run_in_executor(
        #    pool, model.generate.remote, audio
        # )
        result, time_elapsed = model.generate.remote(audio)

    logger.info(
        f"Transcribed segment {start:.2f} to {end:.2f} ({end - start:.2f}s duration) in {time.time() - t0:.2f} seconds."
    )
    print(result)

    return [result, time_elapsed]


def transcribe_episode(
    audio_filepath: pathlib.Path,
) -> list[object, int]:
    from multiprocessing import Pool, TimeoutError
    from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

    segment_gen = split_silences(str(audio_filepath))

    output_text = ""
    output_segments = []
    total_time_elapsed = 0

    with ThreadPoolExecutor(max_workers=50) as executor:
        tasks = [
            executor.submit(
                transcribe_segment, *(segment_start, segment_end, audio_filepath)
            )
            for segment_start, segment_end in segment_gen
        ]
        res = [task.result() for task in tasks]

    for result, time_elapsed in res:
        output_text += result["text"]
        total_time_elapsed += time_elapsed

    result = {
        "text": output_text,
        "language": "en",
    }

    return [result, total_time_elapsed]
