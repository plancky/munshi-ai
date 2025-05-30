from modal import Volume

audio_storage_vol = Volume.from_name("audio_storage_vol")

upload_audio_vol = Volume.from_name("upload_audio_vol", create_if_missing=True)
chunk_storage_vol = Volume.from_name("chunk_storage_vol",create_if_missing=True)
transcriptions_vol = Volume.from_name("transcriptions_vol")
