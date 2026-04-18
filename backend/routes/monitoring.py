from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

class CameraRequest(BaseModel):
    name: str
    location: str
    stream_url: str = ""
    type: str = "ip"

class LPREventRequest(BaseModel):
    camera_id: str
    plate: str
    image_url: str = ""

@router.post("/cameras")
async def add_camera(req: CameraRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    camera = {"camera_id": "cam_" + secrets.token_hex(6), "name": req.name, "location": req.location,
              "stream_url": req.stream_url, "type": req.type, "status": "online",
              "added_by": current_user["user_id"], "created_at": datetime.utcnow().isoformat()}
    await db.cameras.insert_one(camera)
    camera.pop("_id", None)
    return {"camera": camera}

@router.get("/cameras")
async def get_cameras(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.cameras.find({}, {"_id": 0})
    cameras = await cursor.to_list(100)
    return {"cameras": cameras}

@router.delete("/cameras/{camera_id}")
async def delete_camera(camera_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.cameras.delete_one({"camera_id": camera_id})
    return {"ok": True}

@router.post("/lpr")
async def log_lpr(req: LPREventRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    event = {"event_id": "lpr_" + secrets.token_hex(6), "camera_id": req.camera_id,
             "plate": req.plate.upper(), "image_url": req.image_url, "flagged": False,
             "created_at": datetime.utcnow().isoformat()}
    watchlist = await db.lpr_watchlist.find_one({"plate": req.plate.upper()})
    if watchlist:
        event["flagged"] = True
        event["flag_reason"] = watchlist.get("reason", "On watchlist")
    await db.lpr_events.insert_one(event)
    event.pop("_id", None)
    return {"event": event}

@router.get("/lpr")
async def get_lpr_events(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.lpr_events.find({}, {"_id": 0}).sort("created_at", -1).limit(100)
    return {"events": await cursor.to_list(100)}

@router.post("/lpr/watchlist")
async def add_watchlist(plate: str, reason: str = "", current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.lpr_watchlist.update_one({"plate": plate.upper()},
        {"$set": {"plate": plate.upper(), "reason": reason, "added_by": current_user["user_id"]}}, upsert=True)
    return {"ok": True}

@router.get("/lpr/watchlist")
async def get_watchlist(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.lpr_watchlist.find({}, {"_id": 0})
    return {"watchlist": await cursor.to_list(200)}

@router.get("/v2/lpr/analytics")
async def lpr_analytics(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    total = await db.lpr_events.count_documents({})
    flagged = await db.lpr_events.count_documents({"flagged": True})
    return {"total": total, "flagged": flagged, "clean": total - flagged}
