from ..utils import updateOutputJson, output_handler
from .completed import CompletedProcessingState
from ... import config
import time

logger = config.get_logger(__name__)

class SummarizingGeminiProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Summarizing"
        self._next_state_obj = CompletedProcessingState()

    def _next_state(self):
        return self._next_state_obj

    async def run_job(self, vid: str) -> None:
        from ..gemini import processor
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)
        summarize_start = time.time()
        try:
            logger.info(f"Starting summary generation for video {vid}")
            # Use the processor directly and await it properly
            summary = await processor.get_summary(vid)
            logger.info(f"Summary generated successfully for video {vid}")
        except Exception as e:
            logger.error(f"Error generating summary for video {vid}: {e}")
            # Continue to next state even if summary fails

        # Add summarization time to processing_time
        summarize_elapsed = time.time() - summarize_start
        oh = output_handler(vid)
        if oh.data is not None:
            prev_time = oh.data.get("processing_time", 0)
            total_time = prev_time + summarize_elapsed
            oh.data["processing_time"] = total_time
            oh.write_transcription_data()
            logger.info(f"[PROCESSING_TIME] vid={vid} total_processing_time={total_time:.2f}s (transcribe+clean+summarize)")

        await self._next_state_obj.run_job(vid)

        return 0
