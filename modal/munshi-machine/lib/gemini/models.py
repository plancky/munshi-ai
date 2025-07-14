from pydantic import BaseModel

class GeminiResponse(BaseModel):
    cleaned_text: str
    corrections_applied: list[str]

class GeminiSpeakerResponse(BaseModel):
    cleaned_transcript: str
    speaker_ids: list[str]
    speaker_names: list[str]

