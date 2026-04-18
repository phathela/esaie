from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user
from services.ai import innovation_bot

router = APIRouter()

PIPELINE_STAGES = ["Submitted", "Under Review", "Approved", "In Development", "Launched", "Rejected"]

class IdeaRequest(BaseModel):
    title: str
    description: str
    category: str = "General"
    impact: str = "medium"
    tags: list[str] = []

class VoteRequest(BaseModel):
    idea_id: str

class BotRequest(BaseModel):
    message: str
    history: list = []
    idea_context: str = ""

class UpdateStageRequest(BaseModel):
    stage: str
    notes: str = ""

@router.post("/ideas")
async def submit_idea(req: IdeaRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    idea = {
        "idea_id": "idea_" + secrets.token_hex(6),
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "impact": req.impact,
        "tags": req.tags,
        "submitter_id": current_user["user_id"],
        "submitter_name": current_user["name"],
        "stage": "Submitted",
        "votes": 0,
        "voters": [],
        "comments": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.ideas.insert_one(idea)
    idea.pop("_id", None)
    return {"idea": idea}

@router.get("/ideas")
async def get_ideas(stage: str = "", category: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if stage:
        query["stage"] = stage
    if category:
        query["category"] = category
    cursor = db.ideas.find(query, {"_id": 0}).sort("votes", -1)
    ideas = await cursor.to_list(100)
    return {"ideas": ideas}

@router.post("/ideas/vote")
async def vote_idea(req: VoteRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    idea = await db.ideas.find_one({"idea_id": req.idea_id})
    if not idea:
        from fastapi import HTTPException
        raise HTTPException(404, "Idea not found")
    if uid in idea.get("voters", []):
        await db.ideas.update_one({"idea_id": req.idea_id}, {"$pull": {"voters": uid}, "$inc": {"votes": -1}})
        return {"voted": False}
    else:
        await db.ideas.update_one({"idea_id": req.idea_id}, {"$push": {"voters": uid}, "$inc": {"votes": 1}})
        return {"voted": True}

@router.put("/ideas/{idea_id}/stage")
async def update_stage(idea_id: str, req: UpdateStageRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.ideas.update_one(
        {"idea_id": idea_id},
        {"$set": {"stage": req.stage, "stage_notes": req.notes, "updated_at": datetime.utcnow().isoformat()}}
    )
    return {"ok": True}

@router.post("/bot")
async def chat_with_bot(req: BotRequest, current_user: dict = Depends(get_current_user)):
    history = [{"role": m["role"], "content": m["content"]} for m in req.history[-8:]]
    history.append({"role": "user", "content": req.message})
    reply = await innovation_bot(history, req.idea_context)
    return {"reply": reply}

@router.get("/stats")
async def get_stats(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    total = await db.ideas.count_documents({})
    pipeline = {}
    for stage in PIPELINE_STAGES:
        pipeline[stage] = await db.ideas.count_documents({"stage": stage})
    return {"total": total, "pipeline": pipeline, "stages": PIPELINE_STAGES}
