from ..utils import updateOutputJson, output_handler
from .Completed import CompletedProcessingState

class SummarizingGeminiProcessingState:

    def __init__(self) -> None:
        self.StateSymbol = "Summarizing"
        self._next_state_obj = CompletedProcessingState()
        pass

    def _next_state(self):
        return self._next_state_obj

    async def run_job(self, vid: str) -> None:
        from ..gemini import get_summary

        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)
        try:
            get_summary(vid)
        except:
            pass

        await self._next_state_obj.run_job(vid)

        return 0
