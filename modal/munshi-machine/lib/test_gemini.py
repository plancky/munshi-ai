import google.generativeai as genai
from google.generativeai import caching
import os, datetime, asyncio, aiohttp
from .utils import updateOutputJson, output_handler

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
GEMINI_MODEL = "gemini-1.5-flash"


async def ask_gemini(*inputs):
    model = genai.GenerativeModel(GEMINI_MODEL)
    try:
        response = model.generate_content(
            inputs,
            generation_config=genai.types.GenerationConfig(
                # Only one candidate for now.
                # candidate_count=1,
                # max_output_tokens=8192,
                temperature=1.0,
            ),
            request_options={"timeout": 240},
        )
        return response.text
    except Exception as E:
        return "Error"


def summarize(transcript_text, vid):
    import tempfile

    print(os.getcwd())
    from .gemini_prompts import clean_transcript_prompt
    import pathlib

    _p = pathlib.Path(__file__).parent.resolve()
    fp = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
    fp.write(transcript_text.encode())
    # document = genai.upload_file(path=f"{_p}/test.txt", mime_type="text/plain")
    print(transcript_text.encode())
    print(fp.read())
    document = genai.upload_file(path=fp.file, mime_type="text/plain")
    fp.close()

    response = ask_gemini(clean_transcript_prompt, transcript_text)

    """
    cache = caching.CachedContent.create(
        model=f"models/{GEMINI_MODEL}",
        display_name=f"{vid}",  # used to identify the cache
        system_instruction=(
            clean_transcript_prompt
        ),
        contents=[document],
        ttl=datetime.timedelta(minutes=5),
    )
    transcript_model = genai.GenerativeModel.from_cached_content(cached_content=cache)
    response = transcript_model.generate_content(
        "Give me the cleaned transcript"
    )
    """

    return response


async def main1():
    """
    Makes multiple asynchronous requests and waits for all of them to complete.
    """
    async with aiohttp.ClientSession() as session:
        tasks = []
        urls = [
            "https://www.example1.com",
            "https://www.example2.com",
            "https://www.example3.com",
        ]
        for url in urls:
            tasks.append(fetch(session, url))

        results = await asyncio.gather(*tasks)

        for result in results:
            print(result)


async def clean_transcript(text):
    from .gemini_prompts import clean_transcript_prompt

    chunks = split_string_by_max_tokens(text, max_tokens=7000)

    tasks = [ask_gemini(clean_transcript_prompt, chunk) for chunk in chunks]
    res = await asyncio.gather(*tasks)

    return ' '.join(res)


def split_string_by_max_tokens(text, max_tokens, encoding_name="cl100k_base"):
    import tiktoken

    """
    Splits a string into chunks with a maximum number of tokens.

    Args:
        text: The input string.
        max_tokens: The maximum number of tokens per chunk.
        encoding_name: The name of the tiktoken encoding to use.

    Returns:
        A list of string chunks.
    """

    encoding = tiktoken.get_encoding(encoding_name)
    chunks = []
    current_chunk = ""
    current_chunk_tokens = 0

    for token in encoding.encode(text):
        if current_chunk_tokens + 1 > max_tokens:
            chunks.append(current_chunk.strip())
            current_chunk = ""
            current_chunk_tokens = 0

        current_chunk += encoding.decode([token])
        current_chunk_tokens += 1

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


if __name__ == "__main__":
    import pathlib
    from .gemini_prompts import clean_transcript_prompt

    async def main():
        _p = pathlib.Path(__file__).parent.resolve()
        transcript_text = ""
        with open(f"{_p}/test.txt", "r") as _f:
            transcript_text = _f.read()

        with open("cleaned.txt", "+w") as f:
            s = await clean_transcript(transcript_text)
            print(s)
            print(len(s))
            f.write(' '.join(s))

    asyncio.run(main())
