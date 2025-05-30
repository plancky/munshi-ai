from typing import Annotated

from fastapi import UploadFile, Form, File
from ..config import UPLOAD_CHUNK_DIR, UPLOAD_AUDIO_DIR, RAW_AUDIO_DIR
from ..volumes import audio_storage_vol


async def upload_chunk(
    chunk: Annotated[UploadFile, File()],
    chunkIndex: Annotated[int, Form()],
    totalChunks: Annotated[int, Form()],
    fileName: Annotated[str, Form()],
):
    from ..lib.upload_utils import reconstruct_file
    from ..config import UPLOAD_CHUNK_DIR, UPLOAD_AUDIO_DIR
    import os
    import uuid
    import base64

    fileId = None

    try:
        file_id = fileName  # You could add session ID or UUID here for uniqueness
        chunk_dir = os.path.join(UPLOAD_CHUNK_DIR, file_id)
        os.makedirs(chunk_dir, exist_ok=True)

        chunk_path = os.path.join(chunk_dir, f"{chunkIndex}.part")

        with open(chunk_path, "wb") as f:
            f.write(await chunk.read())

        # Check if all chunks are present
        uploaded_chunks = os.listdir(chunk_dir)

        if len(uploaded_chunks) == totalChunks:
            # chunk_storage_vol.reload()

            id1 = uuid.uuid4()
            fileId = "local_" + base64.urlsafe_b64encode(id1.bytes_le)[:16].decode(
                "utf-8"
            )
            output_path = os.path.join(RAW_AUDIO_DIR, fileId + ".mp3")
            await reconstruct_file(chunk_dir, output_path, totalChunks)
            audio_storage_vol.commit()
        return [True, fileId]
    except:
        return [False]


async def reconstruct_file(chunk_dir: str, output_path: str, total_chunks: int):
    import os

    with open(output_path, "wb") as output_file:
        for i in range(total_chunks):
            chunk_file_path = os.path.join(chunk_dir, f"{i}.part")
            with open(chunk_file_path, "rb") as chunk_file:
                output_file.write(chunk_file.read())

    # Clean up
    for i in range(total_chunks):
        os.remove(os.path.join(chunk_dir, f"{i}.part"))
    os.rmdir(chunk_dir)
    print(f"✅ File reconstructed: {output_path}")
