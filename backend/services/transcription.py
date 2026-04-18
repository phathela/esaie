import os
import httpx
import asyncio

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
BASE_URL = "https://api.assemblyai.com/v2"

def _auth_headers():
    return {"authorization": ASSEMBLYAI_API_KEY or ""}

async def transcribe_url(audio_url: str, language_code: str = "en") -> dict:
    payload = {
        "audio_url": audio_url,
        "speech_models": ["universal-2"],
    }
    if language_code and language_code != "en":
        payload["language_code"] = language_code

    async with httpx.AsyncClient(timeout=180) as client:
        resp = await client.post(
            f"{BASE_URL}/transcript",
            headers={**_auth_headers(), "content-type": "application/json"},
            json=payload,
        )
        job = resp.json()
        if "error" in job and "id" not in job:
            return {"text": "", "status": "error", "error": job["error"]}

        transcript_id = job["id"]

        for _ in range(120):
            await asyncio.sleep(3)
            poll = await client.get(
                f"{BASE_URL}/transcript/{transcript_id}",
                headers=_auth_headers(),
            )
            result = poll.json()
            if result["status"] == "completed":
                return {
                    "text": result.get("text", ""),
                    "words": result.get("words", []),
                    "status": "completed",
                }
            if result["status"] == "error":
                return {"text": "", "status": "error", "error": result.get("error")}

    return {"text": "", "status": "timeout"}

async def upload_audio(file_bytes: bytes) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{BASE_URL}/upload",
            headers=_auth_headers(),
            content=file_bytes,
        )
        data = resp.json()
        if "upload_url" not in data:
            raise ValueError(f"AssemblyAI upload failed: {data}")
        return data["upload_url"]
