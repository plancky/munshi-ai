import google.generativeai as genai
import os, datetime, asyncio, aiohttp
from ..utils import updateOutputJson, output_handler

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
GEMINI_MODEL = "gemini-1.5-flash"


async def ask_gemini(*inputs):
    """Async Gemini API call with improved error handling and configuration"""
    model = genai.GenerativeModel(GEMINI_MODEL)
    try:
        response = model.generate_content(
            inputs,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,  # Lower temperature for transcript cleaning
                max_output_tokens=8192,
            ),
            request_options={"timeout": 240},
        )
        return response.text
    except Exception as E:
        print(f"Gemini API Error in transcript cleaning: {E}")
        return "Error processing transcript chunk"


async def clean_transcript(text):
    """Clean transcript using chunking and parallel processing"""
    from ..gemini_prompts import clean_transcript_prompt

    # Split transcript into manageable chunks
    chunks = split_string_by_max_tokens(text, max_tokens=6000)  # Reduced for better quality
    
    # Process chunks in parallel with improved error handling
    tasks = [ask_gemini(clean_transcript_prompt, chunk) for chunk in chunks]
    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors and join successful results
        cleaned_chunks = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Error processing chunk {i}: {result}")
                # Use original chunk if cleaning fails
                cleaned_chunks.append(chunks[i])
            else:
                cleaned_chunks.append(result)
        
        return ' '.join(cleaned_chunks)
    except Exception as e:
        print(f"Error in transcript cleaning: {e}")
        return text  # Return original text if all cleaning fails


def split_string_by_max_tokens(text, max_tokens, encoding_name="cl100k_base"):
    """
    Splits a string into chunks with a maximum number of tokens.
    Improved to maintain sentence boundaries when possible.
    """
    import tiktoken
    import re

    encoding = tiktoken.get_encoding(encoding_name)
    chunks = []
    current_chunk = ""
    current_chunk_tokens = 0

    # Split by sentences first to maintain coherence
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    for sentence in sentences:
        sentence_tokens = len(encoding.encode(sentence))
        
        # If single sentence exceeds max_tokens, split by tokens
        if sentence_tokens > max_tokens:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""
                current_chunk_tokens = 0
            
            # Split long sentence by tokens
            tokens = encoding.encode(sentence)
            for i in range(0, len(tokens), max_tokens):
                chunk_tokens = tokens[i:i + max_tokens]
                chunks.append(encoding.decode(chunk_tokens))
        
        # If adding sentence would exceed limit, save current chunk
        elif current_chunk_tokens + sentence_tokens > max_tokens:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
            current_chunk_tokens = sentence_tokens
        
        # Add sentence to current chunk
        else:
            current_chunk += sentence + " "
            current_chunk_tokens += sentence_tokens

    # Add final chunk if exists
    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


# Legacy functions kept for compatibility
def summarize(transcript_text, vid):
    """Legacy function for backward compatibility"""
    import tempfile
    from ..gemini_prompts import clean_transcript_prompt
    import pathlib

    _p = pathlib.Path(__file__).parent.resolve()
    fp = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
    fp.write(transcript_text.encode())
    fp.close()

    # Use asyncio.run for the async function
    response = asyncio.run(ask_gemini(clean_transcript_prompt, transcript_text))
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


if __name__ == "__main__":
    import pathlib
    from ..gemini_prompts import clean_transcript_prompt

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
