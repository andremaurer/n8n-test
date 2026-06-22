"""
VoiceClaude – Media-Dienst (laeuft nur lokal auf 127.0.0.1)
-----------------------------------------------------------
Stellt zwei Endpunkte bereit:
  POST /transcribe   Audio (multipart "audio") -> {"text": "..."}   (Whisper, offline)
  POST /tts          JSON {"text": "..."}      -> audio/wav         (Piper, offline)

Whisper wird einmal beim Start geladen und bleibt im Speicher.
Piper laeuft als Standalone-Binary (kein pip noetig) -> robust auf jeder Python-Version.
"""

import os
import subprocess
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

# ---- Konfiguration aus Umgebungsvariablen ----
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
WHISPER_COMPUTE = os.environ.get("WHISPER_COMPUTE", "int8")
PIPER_MODEL = os.path.abspath(os.environ.get("PIPER_MODEL", "./voices/de_DE-thorsten-medium.onnx"))
PIPER_BIN = os.path.abspath(os.environ.get("PIPER_BIN", "./piper/piper"))
PIPER_DIR = os.path.dirname(PIPER_BIN)
MEDIA_PORT = int(os.environ.get("MEDIA_PORT", "8001"))

app = FastAPI(title="VoiceClaude Media")

_whisper = None


def get_whisper():
    """Whisper-Modell lazy laden (faster-whisper, CPU)."""
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        print(f"[media] Lade Whisper-Modell '{WHISPER_MODEL}' ({WHISPER_COMPUTE}) ...", flush=True)
        _whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type=WHISPER_COMPUTE)
        print("[media] Whisper bereit.", flush=True)
    return _whisper


@app.on_event("startup")
def _warmup():
    # Whisper direkt beim Start laden, damit die erste echte Anfrage schnell ist.
    try:
        get_whisper()
    except Exception as e:  # noqa: BLE001
        print(f"[media] WARN Whisper-Warmup: {e}", flush=True)
    if not os.path.exists(PIPER_BIN):
        print(f"[media] WARN Piper-Binary fehlt: {PIPER_BIN}", flush=True)
    if not os.path.exists(PIPER_MODEL):
        print(f"[media] WARN Piper-Stimme fehlt: {PIPER_MODEL}", flush=True)


@app.get("/health")
def health():
    return {
        "ok": True,
        "whisper": WHISPER_MODEL,
        "piper_bin": os.path.exists(PIPER_BIN),
        "piper_voice": os.path.exists(PIPER_MODEL),
    }


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
    if not os.path.exists(PIPER_BIN):
        raise HTTPException(status_code=500, detail=f"Piper-Binary fehlt: {PIPER_BIN}")
    if not os.path.exists(PIPER_MODEL):
        raise HTTPException(status_code=500, detail=f"Piper-Stimme fehlt: {PIPER_MODEL}")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        out_path = tmp.name
    try:
        proc = subprocess.run(
            [PIPER_BIN, "--model", PIPER_MODEL, "--output_file", out_path],
            input=text.encode("utf-8"),
            capture_output=True,
            cwd=PIPER_DIR,            # damit das Binary seine espeak-ng-Daten findet
            timeout=120,
        )
        if proc.returncode != 0:
            msg = proc.stderr.decode("utf-8", "ignore")[:500] or "Piper-Fehler"
            raise HTTPException(status_code=500, detail=msg)
        with open(out_path, "rb") as f:
            audio_bytes = f.read()
        return Response(content=audio_bytes, media_type="audio/wav")
    finally:
        try:
            os.unlink(out_path)
        except OSError:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=MEDIA_PORT)
