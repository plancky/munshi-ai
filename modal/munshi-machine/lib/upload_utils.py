from typing import Annotated
import hashlib
import os

from fastapi import UploadFile, Form, File
from ..config import RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR, UPLOAD_CHUNK_DIR
from ..volumes import audio_storage_vol, transcriptions_vol


def generate_file_id_from_content(file_content: bytes) -> str:
    """Generate deterministic file ID based on content hash."""
    # Create hash of file content
    hash_obj = hashlib.sha256(file_content)
    file_hash = hash_obj.hexdigest()[:16]  # First 16 chars
    return f"local_{file_hash}"


def check_existing_transcript(file_id: str) -> bool:
    """Check if transcript already exists for this file ID."""
    # Reload volume to sync with latest data
    transcript_path = os.path.join(TRANSCRIPTIONS_DIR, f"{file_id}.json")
    return os.path.exists(transcript_path)


async def upload_chunk(
    chunk: Annotated[UploadFile, File()],
    chunkIndex: Annotated[int, Form()],
    totalChunks: Annotated[int, Form()],
    fileName: Annotated[str, Form()],
):
    fileId = None
    chunk_dir = None  # Track for cleanup

    try:
        file_id = fileName  # Temporary ID for chunking process
        chunk_dir = os.path.join(UPLOAD_CHUNK_DIR, file_id)
        os.makedirs(chunk_dir, exist_ok=True)

        chunk_path = os.path.join(chunk_dir, f"{chunkIndex}.part")

        with open(chunk_path, "wb") as f:
            f.write(await chunk.read())

        # Check if all chunks are present
        uploaded_chunks = os.listdir(chunk_dir)
        print(f"🔍 Upload debug - Chunk {chunkIndex+1}/{totalChunks}, uploaded_chunks: {len(uploaded_chunks)}, files: {sorted(uploaded_chunks)}")

        if len(uploaded_chunks) == totalChunks:
            print("✅ All chunks received! Reconstructing file...")
            # Read all chunks to generate content hash
            file_content = bytearray()
            for i in range(totalChunks):
                chunk_file_path = os.path.join(chunk_dir, f"{i}.part")
                with open(chunk_file_path, "rb") as chunk_file:
                    file_content.extend(chunk_file.read())
                            
            # Generate deterministic file ID based on content
            fileId = generate_file_id_from_content(bytes(file_content))
            print(f"🔑 Generated deterministic file ID: {fileId}")

            # Check if transcript already exists
            if check_existing_transcript(fileId):
                print(f"🎯 Transcript already exists for {fileId}! Redirecting to existing.")
                # Clean up chunks
                await cleanup_chunks(chunk_dir, totalChunks)
                return [True, fileId, True]  # Third parameter indicates existing transcript
            
            # Write directly to final location (no cross-filesystem move needed)
            final_path = os.path.join(RAW_AUDIO_DIR, fileId + ".mp3")
            with open(final_path, "wb") as output_file:
                output_file.write(file_content)

            # Clean up chunks
            await cleanup_chunks(chunk_dir, totalChunks)
            audio_storage_vol.commit()
            print(f"🎉 File upload complete! New file stored as: {fileId}")
            return [True, fileId, False]  # Third parameter indicates new file
        
        return [True, fileId, False]  # Third parameter indicates new file
    except Exception as e:
        print(f"❌ Upload error: {e}")

        # Remove audio and transcript files
        if fileId and os.path.exists(os.path.join(RAW_AUDIO_DIR, f"{fileId}.mp3")):
            os.remove(os.path.join(RAW_AUDIO_DIR, f"{fileId}.mp3"))
        if fileId and os.path.exists(os.path.join(TRANSCRIPTIONS_DIR, f"{fileId}.json")):
            os.remove(os.path.join(TRANSCRIPTIONS_DIR, f"{fileId}.json"))

        # Only try to clean up if the directory exists
        if chunk_dir and os.path.exists(chunk_dir):
            await cleanup_chunks(chunk_dir, totalChunks)
        return [False, None, False]


async def cleanup_chunks(chunk_dir: str, total_chunks: int):
    """Clean up chunk files and directory."""
    for i in range(total_chunks):
        chunk_path = os.path.join(chunk_dir, f"{i}.part")
        if os.path.exists(chunk_path):
            os.remove(chunk_path)
    try:
        if os.path.exists(chunk_dir):
            os.rmdir(chunk_dir)
    except Exception as e:
        print(f"❌ Error cleaning up chunks: {e}")
