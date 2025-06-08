from modal import Image, App, method, asgi_app, functions, enter, exit as modal_exit
import modal

from ..app import app, cuda_image
from ..config import MODEL_DIR, RAW_AUDIO_DIR, TRANSCRIPTIONS_DIR, get_logger
import tempfile

from ..volumes import audio_storage_vol, transcriptions_vol

logger = get_logger(__name__)


@app.cls(
    image=cuda_image,
    gpu="A10G",
    scaledown_window=40,
    volumes={
        str(RAW_AUDIO_DIR): audio_storage_vol,
        str(TRANSCRIPTIONS_DIR): transcriptions_vol,
    },
)
@modal.concurrent(max_inputs=15)
class WhisperV3:
    @enter()
    def setup(self):
        import torch
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            MODEL_DIR,
            torch_dtype=self.torch_dtype,
            use_safetensors=True,
            # low_cpu_mem_usage=True,
            attn_implementation="flash_attention_2",
        ).to(self.device)
        processor = AutoProcessor.from_pretrained(MODEL_DIR)

        self.generate_kwargs = {
            "task": "translate",
            "return_timestamps": True,
            "num_beams": 1,  # on beam only (greedy decoding, forces determinism)
            # "max_new_tokens": 256,
            # "temperature": 0.0,
            # "compression_ratio_threshold": float("inf"),  # Disable filtering retries
            # "compression_ratio_threshold": 1.35,  # zlib compression ratio threshold (in token space)
            # "logprob_threshold": -float("inf"),  # Disable filtering retries
            "no_speech_threshold": 0.0,  # Forces decoding even if no speech detected
        }

        self.pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            torch_dtype=self.torch_dtype,
            chunk_length_s=30,  # Chunk audio into segments (in seconds) for long audio
            stride_length_s=1,  # Overlap between chunks to maintain context
            batch_size=1,
            return_timestamps=False,
            model_kwargs={
                "use_flash_attention_2": True,
                # "condition_on_prev_tokens": True,  # Optional: for contextual coherence
            },
            device=0,
        )

    @method()
    def generate(self, audio: bytes):
        import time
        import asyncio

        # make a temporary file for piping data into the language model
        fp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        fp.write(audio)
        fp.close()

        # await asyncio.sleep(0)
        start = time.time()
        output_data = self.pipe(
            fp.name,
            generate_kwargs=self.generate_kwargs,
        )
        elapsed = time.time() - start
        logger.info(f"Finished transcribing, \n time elapsed: {elapsed}")

        # write output_data to the output_file
        # if oh:
        #   oh.write_output_data(output_data)

        return [{"text": output_data["text"]}, elapsed]

    @modal_exit()
    def close_container(self):
        logger.info("Shutting-down transcription container.")
