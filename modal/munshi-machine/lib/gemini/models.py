from pydantic import BaseModel

class GeminiResponse(BaseModel):
    cleaned_text: list[str]
    corrections_applied: list[str]

class GeminiSpeakerResponse(BaseModel):
    cleaned_transcript: list[str]
    speaker_ids: list[str]
    speaker_names: list[str]

