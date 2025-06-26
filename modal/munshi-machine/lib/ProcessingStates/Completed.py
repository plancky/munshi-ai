from ..utils import updateOutputJson, audio_path

class CompletedProcessingState:
    def __init__(self) -> None:
        self.StateSymbol = "Completed"

    def _next_state(self):
        return None

    async def run_job(self, vid: str) -> None:
        import asyncio
        import os
        await asyncio.sleep(0.01)
        # update new state on the output json
        updateOutputJson(vid, self.StateSymbol)
        # Delete the audio file after processing is complete
        audiofile = audio_path(vid)
        if audiofile.exists():
            try:
                os.remove(audiofile)
                print(f"[CompletedProcessingState] Deleted audio file {audiofile}")
            except Exception as e:
                print(f"[CompletedProcessingState] Error deleting audio file {audiofile}: {e}")
        return 0