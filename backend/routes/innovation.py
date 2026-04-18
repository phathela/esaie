from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

class IdeaRequest(BaseModel):
    title: str
    description: str
    category: str
    expected_impact: str = ""
    resources_needed: str = ""

class IdeaStatusUpdate(BaseModel):
    status: str

class VoteRequest(BaseModel):
    idea_id: str

@router.post("/ideas")
async def create_idea(req: IdeaRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    idea = {
        "idea_id": "idea_" + secrets.token_hex(6),
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "expected_impact": req.expected_impact,
        "resources_needed": req.resources_needed,
        "submitter_id": current_user["user_id"],
        "submitter_name": current_user.get("name", ""),
        "status": "submitted",
        "votes": 0,
        "voters": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.ideas.insert_one(idea)
    idea.pop("_id", None)
    return {"idea": idea}

@router.get("/ideas")
async def list_ideas(status: str = "", category: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    cursor = db.ideas.find(query, {"_id": 0}).sort("votes", -1).sort("created_at", -1)
    ideas = await cursor.to_list(200)
    uid = current_user["user_id"]
    for idea in ideas:
        idea["voted_by_user"] = uid in idea.get("voters", [])
    return {"ideas": ideas}

@router.get("/ideas/{idea_id}")
async def get_idea(idea_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"idea_id": idea_id}, {"_id": 0})
    if not idea:
        return {"error": "Idea not found"}
    idea["voted_by_user"] = current_user["user_id"] in idea.get("voters", [])
    comments = await db.idea_comments.find({"idea_id": idea_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"idea": idea, "comments": comments}

@router.post("/ideas/{idea_id}/vote")
async def vote_idea(idea_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    idea = await db.ideas.find_one({"idea_id": idea_id})
    if not idea:
        return {"error": "Idea not found"}
    uid = current_user["user_id"]
    voters = idea.get("voters", [])
    if uid in voters:
        voters.remove(uid)
        await db.ideas.update_one({"idea_id": idea_id}, {"$set": {"voters": voters, "votes": len(voters)}})
        return {"voted": False, "votes": len(voters)}
    else:
        voters.append(uid)
        await db.ideas.update_one({"idea_id": idea_id}, {"$set": {"voters": voters, "votes": len(voters)}})
        return {"voted": True, "votes": len(voters)}

@router.post("/ideas/{idea_id}/comment")
async def add_comment(idea_id: str, content: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    comment = {
        "comment_id": "comment_" + secrets.token_hex(6),
        "idea_id": idea_id,
        "user_id": current_user["user_id"],
        "user_name": current_user.get("name", ""),
        "content": content,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.idea_comments.insert_one(comment)
    comment.pop("_id", None)
    return {"comment": comment}

@router.put("/ideas/{idea_id}/status")
async def update_idea_status(idea_id: str, req: IdeaStatusUpdate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    idea = await db.ideas.find_one({"idea_id": idea_id})
    if not idea:
        return {"error": "Idea not found"}
    if idea["submitter_id"] != current_user["user_id"] and not current_user.get("is_admin"):
        return {"error": "Not authorized"}
    await db.ideas.update_one({"idea_id": idea_id}, {"$set": {"status": req.status, "updated_at": datetime.utcnow().isoformat()}})
    return {"ok": True}

@router.get("/ideas/{idea_id}/pipeline")
async def get_pipeline_details(idea_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"idea_id": idea_id}, {"_id": 0})
    if not idea:
        return {"error": "Idea not found"}
    pipeline_history = await db.idea_pipeline.find({"idea_id": idea_id}, {"_id": 0}).sort("updated_at", -1).to_list(50)
    return {"idea": idea, "pipeline": pipeline_history}

@router.get("/pipeline")
async def get_pipeline(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    stages = ["submitted", "under_review", "approved", "in_progress", "completed", "rejected"]
    pipeline = {}
    for stage in stages:
        ideas = await db.ideas.find({"status": stage}, {"_id": 0}).sort("votes", -1).to_list(100)
        pipeline[stage] = ideas
    return {"pipeline": pipeline}

@router.get("/dashboard/innovation")
async def get_innovation_dashboard(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    total_ideas = await db.ideas.count_documents({})
    my_ideas = await db.ideas.count_documents({"submitter_id": current_user["user_id"]})
    voted_ideas = await db.ideas.count_documents({"voters": current_user["user_id"]})
    approved_ideas = await db.ideas.count_documents({"status": "approved"})
    recent_ideas = await db.ideas.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)
    top_ideas = await db.ideas.find({}, {"_id": 0}).sort("votes", -1).to_list(5)
    return {
        "stats": {
            "total_ideas": total_ideas,
            "my_ideas": my_ideas,
            "voted_ideas": voted_ideas,
            "approved_ideas": approved_ideas,
        },
        "recent": recent_ideas,
        "top_voted": top_ideas,
    }
