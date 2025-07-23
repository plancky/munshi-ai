from typing import Tuple
import hashlib
import os
import json
import uuid
import time

from fastapi import UploadFile
from ..config import RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR
from ..volumes import audio_storage_vol


def generate_upload_id() -> str:
    """Generate a unique upload ID for tracking."""
    return str(uuid.uuid4())


def generate_file_id_from_hash(content_hash: str) -> str:
    """Generate deterministic file ID from content hash."""
    return f"local_{content_hash[:16]}"


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


async def stream_upload(
    file: UploadFile,
    fileName: str,
) -> Tuple[bool, str, bool]:
    """
    Stream upload handler that replaces chunked upload system.
    
    Returns:
        Tuple[bool, str, bool]: (success, file_id, is_existing_transcript)
    """
    upload_id = generate_upload_id()
    temp_file_path = None
    file_id = None
    
    try:
        print(f"🚀 Starting streaming upload for {fileName} (upload_id: {upload_id})")

        start_time = time.time()
        
        if not fileName:
            raise ValueError("No fileName provided")
        
        # Validate file object
        if not hasattr(file, 'read'):
            raise ValueError("Invalid file object - missing read method")
        
        print(f"📋 File info - name: {fileName}, content_type: {getattr(file, 'content_type', 'unknown')}")
        
        # Validate file type (basic check)
        if not fileName.lower().endswith(('.mp3', '.wav', '.m4a', '.mp4', '.mov', '.avi')):
            raise ValueError(f"Unsupported file type: {fileName}")
        
        # Generate temporary file path
        temp_file_path = os.path.join(RAW_AUDIO_DIR, f"{upload_id}.uploading")
        
        # Stream the file and calculate hash simultaneously
        hasher = hashlib.sha256()
        total_bytes = 0
        
        print(f"📥 Streaming to temporary file: {temp_file_path}")
        
        # Stream upload with simultaneous hashing
        with open(temp_file_path, "wb") as temp_file:
            try:
                while True:
                    # Read in 64KB chunks for optimal performance
                    chunk = await file.read(65536)  # 64KB
                    if not chunk:
                        break
                        
                    # Write chunk to disk
                    temp_file.write(chunk)
                    
                    # Update hash
                    hasher.update(chunk)
                    
                    # Track progress
                    total_bytes += len(chunk)
                    
            except Exception as read_error:
                raise ValueError(f"Error reading file data: {read_error}")
        
        print(f"✅ Upload completed: {total_bytes} bytes in {time.time() - start_time:.2f} seconds")
        
        # Validate file size
        if total_bytes == 0:
            raise ValueError("File is empty (0 bytes)")
        
        if total_bytes > 524_288_000:  # 500MB
            raise ValueError(f"File too large: {total_bytes} bytes (max 500MB)")
        
        # Generate deterministic file ID from content hash
        content_hash = hasher.hexdigest()
        file_id = generate_file_id_from_hash(content_hash)
        print(f"🔑 Generated file ID: {file_id} (from hash: {content_hash[:16]})")
        
        # Check if transcript already exists before moving file
        if check_existing_transcript(file_id):
            print(f"🎯 Completed transcript found for {file_id}! Redirecting to existing transcript.")
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return [True, file_id, True]  # Third parameter indicates existing transcript
        
        # Extract file extension from original filename
        file_extension = os.path.splitext(fileName)[1].lower()

        
        # Move to final location with atomic operation (preserve original extension)
        final_path = os.path.join(RAW_AUDIO_DIR, f"{file_id}{file_extension}")
        
        # Check if final file already exists (edge case protection)
        if os.path.exists(final_path):
            print(f"⚠️ File already exists at {final_path}, removing temporary file")
            os.remove(temp_file_path)
            return [True, file_id, False]
        
        # Atomic move operation
        os.rename(temp_file_path, final_path)
        
        # Commit volume changes
        audio_storage_vol.commit()
        
        print(f"🎉 File successfully uploaded and stored as: {file_id}{file_extension}")
        return [True, file_id, False]
        
    except (ValueError, TypeError) as validation_error:
        print(f"❌ Validation error: {validation_error}")
        # Clean up temporary file on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"🧹 Cleaned up temporary file: {temp_file_path}")
            except Exception as cleanup_error:
                print(f"⚠️ Failed to cleanup temporary file: {cleanup_error}")
        
        # Re-raise validation errors for better error messages
        raise validation_error
        
    except Exception as e:
        print(f"❌ Unexpected upload error: {e}")
        
        # Clean up temporary file on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"🧹 Cleaned up temporary file: {temp_file_path}")
            except Exception as cleanup_error:
                print(f"⚠️ Failed to cleanup temporary file: {cleanup_error}")
        
        # Clean up any partial final files
        if file_id:
            # Extract file extension for cleanup
            file_extension = os.path.splitext(fileName)[1].lower() if fileName else '.mp3'
            final_path = os.path.join(RAW_AUDIO_DIR, f"{file_id}{file_extension}")
            if os.path.exists(final_path):
                try:
                    os.remove(final_path)
                    print(f"🧹 Cleaned up partial final file: {final_path}")
                except Exception as cleanup_error:
                    print(f"⚠️ Failed to cleanup final file: {cleanup_error}")
        
        return [False, None, False]


# 
