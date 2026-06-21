"""
VoiceClaude – Media-Dienst (laeuft nur lokal auf 127.0.0.1)
-----------------------------------------------------------
Stellt zwei Endpunkte bereit:
  POST /transcribe   Audio (multipart "audio") -> {"text": "..."}   (Whisper, offline)
  POST /tts          JSON {"text": "..."}      -> audio/wav         (Piper, offline)

Beide Modelle werden EINMAL beim Start geladen und bleiben im Speicher,
damit jede Anfrage schnell ist und nichts "abreisst".
"""

import io
import os
import wave
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

# ---- Konfiguration aus Umgebungsvariablen ----
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
WHISPER_COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")
PIPER_MODEL = os.environ.get("PIPER_MODEL", "./voices/de_DE-thorsten-medium.onnx")
MEDIA_PORT = int(os.environ.get("MEDIA_PORT", "8001"))

app = FastAPI(title="VoiceClaude Media")

_whisper = None
_piper = None


def get_whisper():
    """Whisper-Modell lazy laden (faster-whisper, CPU)."""
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        print(f"[media] Lade Whisper-Modell '{WHISPER_MODEL}' ({WHISPER_COMPUTE}) ...", flush=True)
        _whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type=WHISPER_COMPUTE)
        print("[media] Whisper bereit.", flush=True)
    return _whisper


def get_piper():
    """Piper-Stimme lazy laden."""
    global _piper
    if _piper is None:
        from piper import PiperVoice
        if not os.path.exists(PIPER_MODEL):
            raise RuntimeError(
                f"Piper-Stimme nicht gefunden: {PIPER_MODEL}. "
                f"Bitte zuerst scripts/install.sh ausfuehren."
            )
        config_path = PIPER_MODEL + ".json"
        config_path = config_path if os.path.exists(config_path) else None
        print(f"[media] Lade Piper-Stimme '{PIPER_MODEL}' ...", flush=True)
        _piper = PiperVoice.load(PIPER_MODEL, config_path=config_path)
        print("[media] Piper bereit.", flush=True)
    return _piper


@app.on_event("startup")
def _warmup():
    # Modelle direkt beim Start laden, damit die erste echte Anfrage schnell ist.
    try:
        get_whisper()
    except Exception as e:  # noqa: BLE001
        print(f"[media] WARN Whisper-Warmup: {e}", flush=True)
    try:
        get_piper()
    except Exception as e:  # noqa: BLE001
        print(f"[media] WARN Piper-Warmup: {e}", flush=True)


@app.get("/health")
def health():
    return {"ok": True, "whisper": WHISPER_MODEL, "piper": os.path.basename(PIPER_MODEL)}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Leere Audiodatei")

    # In temporaere Datei schreiben – faster-whisper dekodiert (webm/opus, wav, ...) via PyAV.
    suffix = os.path.splitext(audio.filename or "")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        model = get_whisper()
        segments, info = model.transcribe(
            tmp_path,
            language="de",
            beam_size=5,
            vad_filter=True,  # Stille/Rauschen herausfiltern -> stabiler
        )
        text = "".join(seg.text for seg in segments).strip()
        return {"text": text, "language": info.language}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


class TTSRequest(BaseModel):
    text: str


@app.post("/tts")
def tts(req: TTSRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Kein Text")
    voice = get_piper()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        # piper-tts 1.2.0: synthesize(text, wav_file) schreibt 16-bit Mono-WAV
        voice.synthesize(text, wav_file)
    return Response(content=buf.getvalue(), media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=MEDIA_PORT)
