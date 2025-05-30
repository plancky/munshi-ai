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
            #low_cpu_mem_usage=True,
            attn_implementation="flash_attention_2",
        ).to(self.device)
        processor = AutoProcessor.from_pretrained(MODEL_DIR)
        # Enable static cache and compile the forward pass
        #model.generation_config.cache_implementation = "static"
        #model.generation_config.max_new_tokens = 256
        #model.forward = torch.compile(
        #    model.forward, mode="reduce-overhead", fullgraph=True
        #)
        self.pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            torch_dtype=self.torch_dtype,
            chunk_length_s=30,
            batch_size=24,
            return_timestamps=True,
            model_kwargs={"use_flash_attention_2": True, "return_timestamps": True},
            device=0,
        )

        self.generate_kwargs = {
            "max_new_tokens": 128,
            "task": "translate",
            "return_timestamps": True,
            # "num_beams": 1,
            # "condition_on_prev_tokens": False,
            # "compression_ratio_threshold": 1.35,  # zlib compression ratio threshold (in token space)
            # "temperature": (0.0, 0.2, 0.4, 0.6, 0.8, 1.0),
            # "logprob_threshold": -1.0,
            # "no_speech_threshold": 0.6,
        }

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
