from typing import Annotated
import hashlib
import os
import json

from fastapi import UploadFile, Form, File
from ..config import RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR, UPLOAD_CHUNK_DIR
from ..volumes import audio_storage_vol


def generate_file_id_from_content(file_content: bytes) -> str:
    """Generate deterministic file ID based on content hash."""
    # Create hash of file content
    hash_obj = hashlib.sha256(file_content)
    file_hash = hash_obj.hexdigest()[:16]  # First 16 chars
    return f"local_{file_hash}"


def check_existing_transcript(file_id: str) -> bool:
    """Check if a completed transcript already exists for this file ID."""
    transcript_path = os.path.join(TRANSCRIPTIONS_DIR, f"{file_id}.json")
    
    # Check if file exists
    if not os.path.exists(transcript_path):
        return False
    
    try:
        # Read the transcript file
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript_data = json.load(f)
        
        # Check if transcript is actually completed
        status = transcript_data.get("status", "")
        data = transcript_data.get("data", {})
        
        # Only consider it "existing" if status is "Completed" and we have actual transcript text
        if status == "Completed" and data.get("text"):
            print(f"✅ Found completed transcript for {file_id}")
            return True
        else:
            print(f"⚠️ Found incomplete transcript for {file_id} (status: {status})")
            return False
            
    except (json.JSONDecodeError, KeyError, Exception) as e:
        print(f"❌ Error reading transcript file for {file_id}: {e}")
        return False


async def upload_chunk(
    chunk: Annotated[UploadFile, File()],
    chunkIndex: Annotated[int, Form()],
    total_chunks: Annotated[int, Form()],
    fileName: Annotated[str, Form()],
):
    fileId = None
    chunk_dir = None  # Track for cleanup

    try:
        # Use hash of filename to avoid path length issues
        file_id_hash = hashlib.md5(fileName.encode()).hexdigest()[:16]
        chunk_dir = os.path.join(UPLOAD_CHUNK_DIR, file_id_hash)
        os.makedirs(chunk_dir, exist_ok=True)

        # Validate chunk index
        if chunkIndex < 0 or chunkIndex >= total_chunks:
            raise Exception(f"Invalid chunk index: {chunkIndex} (expected 0-{total_chunks-1})")

        chunk_path = os.path.join(chunk_dir, f"{chunkIndex}.part")

        with open(chunk_path, "wb") as f:
            f.write(await chunk.read())

        # Check if all chunks are present
        uploaded_chunks = os.listdir(chunk_dir)
        print(f"🔍 Upload debug - Chunk {chunkIndex+1}/{total_chunks}, uploaded_chunks: {len(uploaded_chunks)}, files: {sorted(uploaded_chunks)}")

        if len(uploaded_chunks) == total_chunks:
            print("✅ All chunks received! Reconstructing file...")
            
            # Validate that all expected chunks exist
            expected_chunks = set(f"{i}.part" for i in range(total_chunks))
            actual_chunks = set(uploaded_chunks)
            missing_chunks = expected_chunks - actual_chunks
            extra_chunks = actual_chunks - expected_chunks
            
            if missing_chunks:
                print(f"❌ Missing chunks: {sorted(missing_chunks)}")
                print(f"❌ Expected: {sorted(expected_chunks)}")
                print(f"❌ Actual: {sorted(actual_chunks)}")
                raise Exception(f"Missing chunks: {missing_chunks}")
            
            if extra_chunks:
                print(f"⚠️ Extra chunks found: {sorted(extra_chunks)} - these will be ignored")
            
            # Read all chunks to generate content hash
            file_content = bytearray()
            for i in range(total_chunks):
                chunk_file_path = os.path.join(chunk_dir, f"{i}.part")
                with open(chunk_file_path, "rb") as chunk_file:
                    file_content.extend(chunk_file.read())
                            
            # Generate deterministic file ID based on content
            fileId = generate_file_id_from_content(bytes(file_content))
            print(f"🔑 Generated deterministic file ID: {fileId}")

            # Check if transcript already exists
            if check_existing_transcript(fileId):
                print(f"🎯 Completed transcript found for {fileId}! Redirecting to existing transcript.")
                # Clean up chunks
                await cleanup_chunks(chunk_dir, total_chunks)
                return [True, fileId, True]  # Third parameter indicates existing transcript
            
            # Write directly to final location (no cross-filesystem move needed)
            final_path = os.path.join(RAW_AUDIO_DIR, fileId + ".mp3")
            with open(final_path, "wb") as output_file:
                output_file.write(file_content)

            # Clean up chunks
            await cleanup_chunks(chunk_dir, total_chunks)
            audio_storage_vol.commit()
            print(f"🎉 File upload complete! New file stored as: {fileId}")
            return [True, fileId, False]  # Third parameter indicates new file
        
        # Not all chunks uploaded yet - don't clean up, wait for more chunks
        return [True, fileId, False]
    except Exception as e:
        print(f"❌ Upload error: {e}")

        # Remove audio and transcript files
        if fileId and os.path.exists(os.path.join(RAW_AUDIO_DIR, f"{fileId}.mp3")):
            os.remove(os.path.join(RAW_AUDIO_DIR, f"{fileId}.mp3"))
        if fileId and os.path.exists(os.path.join(TRANSCRIPTIONS_DIR, f"{fileId}.json")):
            os.remove(os.path.join(TRANSCRIPTIONS_DIR, f"{fileId}.json"))

        # Only try to clean up if the directory exists
        if chunk_dir and os.path.exists(chunk_dir):
            await cleanup_chunks(chunk_dir, total_chunks)
        return [False, None, False]


async def cleanup_chunks(chunk_dir: str, total_chunks: int):
    """Clean up chunk files and directory."""
    try:
        # Remove all chunk files
        for i in range(total_chunks):
            chunk_path = os.path.join(chunk_dir, f"{i}.part")
            if os.path.exists(chunk_path):
                os.remove(chunk_path)
        
        # Remove any other files that might be in the directory
        if os.path.exists(chunk_dir):
            for file in os.listdir(chunk_dir):
                file_path = os.path.join(chunk_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            
            # Now try to remove the directory
            os.rmdir(chunk_dir)
    except Exception as e:
        print(f"❌ Error cleaning up chunks: {e}")
        # If we can't remove the directory, at least try to remove all files
        try:
            if os.path.exists(chunk_dir):
                import shutil
                shutil.rmtree(chunk_dir, ignore_errors=True)
        except Exception as cleanup_error:
            print(f"❌ Failed to force cleanup directory: {cleanup_error}")
