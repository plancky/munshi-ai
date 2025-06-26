from ..utils import updateOutputJson
from .completed import CompletedProcessingState
from ... import config

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
        
        try:
            logger.info(f"Starting summary generation for video {vid}")
            # Use the processor directly and await it properly
            summary = await processor.get_summary(vid)
            logger.info(f"Summary generated successfully for video {vid}")
        except Exception as e:
            logger.error(f"Error generating summary for video {vid}: {e}")
            # Continue to next state even if summary fails

        await self._next_state_obj.run_job(vid)

        return 0
