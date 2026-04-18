import os
import httpx
import asyncio

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
BASE_URL = "https://api.assemblyai.com/v2"

HEADERS = {
    "authorization": ASSEMBLYAI_API_KEY or "",
    "content-type": "application/json",
}

async def transcribe_url(audio_url: str, language_code: str = "en") -> dict:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{BASE_URL}/transcript",
            headers=HEADERS,
            json={"audio_url": audio_url, "language_code": language_code},
        )
        job = resp.json()
        transcript_id = job["id"]

        for _ in range(120):
            await asyncio.sleep(3)
            poll = await client.get(f"{BASE_URL}/transcript/{transcript_id}", headers=HEADERS)
            result = poll.json()
            if result["status"] == "completed":
                return {"text": result["text"], "words": result.get("words", []), "status": "completed"}
            if result["status"] == "error":
                return {"text": "", "status": "error", "error": result.get("error")}

    return {"text": "", "status": "timeout"}

async def upload_audio(file_bytes: bytes) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{BASE_URL}/upload",
            headers={"authorization": ASSEMBLYAI_API_KEY or ""},
            content=file_bytes,
        )
        return resp.json()["upload_url"]
