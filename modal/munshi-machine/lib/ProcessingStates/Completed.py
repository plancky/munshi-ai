from ..utils import updateOutputJson

class CompletedProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Completed"
        pass

    def _next_state(self):
        pass

    async def run_job(self, vid: str) -> None:
        import asyncio
        await asyncio.sleep(0.01)
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)
        return 0