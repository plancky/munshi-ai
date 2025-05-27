import google.generativeai as genai
import os
from .utils import updateOutputJson, output_handler

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
GEMINI_MODEL = "gemini-2.0-flash-exp"


def ask_gemini(*inputs):
    model = genai.GenerativeModel(GEMINI_MODEL)
    try:
        response = model.generate_content(inputs)
        return response.text
    except Exception as E:
        return "Error"


def get_summary(vid):
    oh = output_handler(vid)
    transcript = oh.data["text"]
    try:
        return oh.data["summary_gemini"]
    except:
        prompt = f"""
        You are an expert in the fields of Buisness, Sports and Technology. 
       
        INSTRUCTIONS:

        You are tasked with giving a comprehensive summary of transcripts of experts talking.

        Give me an abstract of this conversation in less than 50 words, also make bullet points for important topics covered in this transcript.

        OUTPUT FORMAT:

        Do not put filler text like "here is your summary".

        Do not put filler end notes. Just provide the summary as is.

        format the output in safe html. HTML only, no wrappers characters, only output html.

        The transcript is passed in the next input.
        """
        summary_gemini = ask_gemini(prompt, transcript)
        oh.data["summary_gemini"] = summary_gemini
        oh.write_transcription_data()
        return summary_gemini


async def get_cleaned_transcript(transcript_text):
    from .test_gemini import clean_transcript

    return await clean_transcript(transcript_text)


if __name__ == "__main__":
    print(ask_gemini("Hi gemini"))
