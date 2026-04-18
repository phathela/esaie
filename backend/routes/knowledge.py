from fastapi import APIRouter, Depends, UploadFile, File, Form
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

CATEGORIES = ["SOP", "Policy", "Template", "Form", "Report", "Guide", "Other"]

class KnowledgeDocRequest(BaseModel):
    title: str
    category: str
    description: str = ""
    content: str = ""
    tags: list[str] = []

@router.post("/")
async def create_doc(req: KnowledgeDocRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "doc_id": "kd_" + secrets.token_hex(6),
        "title": req.title,
        "category": req.category,
        "description": req.description,
        "content": req.content,
        "tags": req.tags,
        "author_id": current_user["user_id"],
        "author_name": current_user["name"],
        "views": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    await db.knowledge.insert_one(doc)
    doc.pop("_id", None)
    return {"doc": doc}

@router.get("/")
async def list_docs(category: str = "", search: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [{"title": {"$regex": search, "$options": "i"}}, {"tags": {"$in": [search]}}]
    cursor = db.knowledge.find(query, {"_id": 0, "content": 0}).sort("created_at", -1)
    docs = await cursor.to_list(100)
    return {"docs": docs}

@router.get("/{doc_id}")
async def get_doc(doc_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db.knowledge.find_one({"doc_id": doc_id}, {"_id": 0})
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(404, "Document not found")
    await db.knowledge.update_one({"doc_id": doc_id}, {"$inc": {"views": 1}})
    return {"doc": doc}

@router.put("/{doc_id}")
async def update_doc(doc_id: str, req: KnowledgeDocRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.knowledge.update_one({"doc_id": doc_id}, {"$set": {**req.dict(), "updated_at": datetime.utcnow().isoformat()}})
    return {"ok": True}

@router.delete("/{doc_id}")
async def delete_doc(doc_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.knowledge.delete_one({"doc_id": doc_id})
    return {"ok": True}

@router.get("/meta/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    return {"categories": CATEGORIES}
