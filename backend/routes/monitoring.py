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

class PTZCommandRequest(BaseModel):
    camera_id: str
    command: str  # pan_left, pan_right, tilt_up, tilt_down, zoom_in, zoom_out
    duration_seconds: int = 1

class RecordingRequest(BaseModel):
    camera_id: str
    duration_minutes: int = 60
    description: str = ""

class AlertRuleRequest(BaseModel):
    name: str
    trigger: str  # lpr_flagged, no_motion, motion_detected
    camera_id: str = ""
    action: str = "notify"  # notify, record, alert
    enabled: bool = True

class WatchlistRequest(BaseModel):
    plate: str
    reason: str = ""

@router.post("/lpr/watchlist")
async def add_watchlist(req: WatchlistRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.lpr_watchlist.update_one({"plate": req.plate.upper()},
        {"$set": {"plate": req.plate.upper(), "reason": req.reason, "added_by": current_user["user_id"]}}, upsert=True)
    return {"ok": True}

@router.get("/lpr/watchlist")
async def get_watchlist(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.lpr_watchlist.find({}, {"_id": 0})
    return {"watchlist": await cursor.to_list(200)}

@router.get("/lpr/analytics")
async def lpr_analytics(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    total = await db.lpr_events.count_documents({})
    flagged = await db.lpr_events.count_documents({"flagged": True})
    return {"total": total, "flagged": flagged, "clean": total - flagged}

# ── PTZ Controls ────────────────────────────────────────────────────────────────

@router.post("/cameras/{camera_id}/ptz")
async def send_ptz_command(camera_id: str, req: PTZCommandRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Send pan-tilt-zoom command to camera"""
    camera = await db.cameras.find_one({"camera_id": camera_id})
    if not camera:
        return {"error": "Camera not found"}

    command_log = {
        "log_id": "cmd_" + secrets.token_hex(6),
        "camera_id": camera_id,
        "command": req.command,
        "duration_seconds": req.duration_seconds,
        "sent_by": current_user["user_id"],
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.ptz_commands.insert_one(command_log)
    command_log.pop("_id", None)
    return {"command": command_log, "status": "executed"}

@router.get("/cameras/{camera_id}/ptz/history")
async def get_ptz_history(camera_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get PTZ command history for a camera"""
    history = await db.ptz_commands.find({"camera_id": camera_id}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return {"history": history}

# ── Recordings ──────────────────────────────────────────────────────────────────

@router.post("/cameras/{camera_id}/recordings")
async def start_recording(camera_id: str, req: RecordingRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Start or schedule a recording"""
    recording = {
        "recording_id": "rec_" + secrets.token_hex(6),
        "camera_id": camera_id,
        "duration_minutes": req.duration_minutes,
        "description": req.description,
        "status": "recording",
        "initiated_by": current_user["user_id"],
        "started_at": datetime.utcnow().isoformat(),
        "file_url": f"https://recordings.esaie.local/rec_{secrets.token_hex(4)}.mp4",
    }
    await db.recordings.insert_one(recording)
    recording.pop("_id", None)
    return {"recording": recording}

@router.get("/cameras/{camera_id}/recordings")
async def get_recordings(camera_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get recordings for a camera"""
    recordings = await db.recordings.find({"camera_id": camera_id}, {"_id": 0}).sort("started_at", -1).to_list(100)
    return {"recordings": recordings}

@router.get("/recordings")
async def get_all_recordings(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all recordings"""
    recordings = await db.recordings.find({}, {"_id": 0}).sort("started_at", -1).to_list(200)
    return {"recordings": recordings}

@router.delete("/recordings/{recording_id}")
async def delete_recording(recording_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Delete a recording"""
    await db.recordings.delete_one({"recording_id": recording_id})
    return {"ok": True}

# ── Alert Rules ─────────────────────────────────────────────────────────────────

@router.post("/alerts/rules")
async def create_alert_rule(req: AlertRuleRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create an alert rule"""
    rule = {
        "rule_id": "rule_" + secrets.token_hex(6),
        "name": req.name,
        "trigger": req.trigger,
        "camera_id": req.camera_id,
        "action": req.action,
        "enabled": req.enabled,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.alert_rules.insert_one(rule)
    rule.pop("_id", None)
    return {"rule": rule}

@router.get("/alerts/rules")
async def get_alert_rules(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all alert rules"""
    rules = await db.alert_rules.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"rules": rules}

@router.put("/alerts/rules/{rule_id}")
async def update_alert_rule(rule_id: str, req: AlertRuleRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Update an alert rule"""
    await db.alert_rules.update_one(
        {"rule_id": rule_id},
        {"$set": {"name": req.name, "trigger": req.trigger, "camera_id": req.camera_id, "action": req.action, "enabled": req.enabled}}
    )
    return {"ok": True}

@router.delete("/alerts/rules/{rule_id}")
async def delete_alert_rule(rule_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Delete an alert rule"""
    await db.alert_rules.delete_one({"rule_id": rule_id})
    return {"ok": True}

# ── Alert Events ────────────────────────────────────────────────────────────────

@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get recent alerts"""
    alerts = await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"alerts": alerts}

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Acknowledge an alert"""
    await db.alerts.update_one(
        {"alert_id": alert_id},
        {"$set": {"acknowledged": True, "acknowledged_by": current_user["user_id"], "acknowledged_at": datetime.utcnow().isoformat()}}
    )
    return {"ok": True}

# ── Monitoring Dashboard ────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_monitoring_dashboard(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get monitoring dashboard summary"""
    total_cameras = await db.cameras.count_documents({})
    online_cameras = await db.cameras.count_documents({"status": "online"})
    active_recordings = await db.recordings.count_documents({"status": "recording"})
    unacknowledged_alerts = await db.alerts.count_documents({"acknowledged": False})
    recent_lpr = await db.lpr_events.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    recent_alerts = await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

    return {
        "cameras": {
            "total": total_cameras,
            "online": online_cameras,
            "offline": total_cameras - online_cameras,
        },
        "recordings": {
            "active": active_recordings,
        },
        "alerts": {
            "unacknowledged": unacknowledged_alerts,
            "recent": recent_alerts,
        },
        "lpr": {
            "recent_event": recent_lpr,
        }
    }
