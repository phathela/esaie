from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

class DocumentRequest(BaseModel):
    title: str
    description: str
    category: str
    content: str
    tags: list[str] = []
    is_public: bool = False

class TemplateRequest(BaseModel):
    name: str
    description: str
    category: str
    content: str
    fields: list[dict] = []

class SearchRequest(BaseModel):
    query: str
    category: str = ""
    doc_type: str = ""

@router.post("/documents")
async def create_document(req: DocumentRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "doc_id": "doc_" + secrets.token_hex(6),
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "content": req.content,
        "tags": req.tags,
        "is_public": req.is_public,
        "author_id": current_user["user_id"],
        "author_name": current_user.get("name", ""),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "views": 0,
        "helpful_count": 0,
    }
    await db.kb_documents.insert_one(doc)
    doc.pop("_id", None)
    return {"document": doc}

@router.get("/documents")
async def list_documents(category: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {"is_public": True}
    if category:
        query["category"] = category
    cursor = db.kb_documents.find(query, {"_id": 0}).sort("created_at", -1)
    documents = await cursor.to_list(200)
    return {"documents": documents}

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    doc = await db.kb_documents.find_one({"doc_id": doc_id}, {"_id": 0})
    if not doc:
        return {"error": "Document not found"}
    if not doc["is_public"] and doc["author_id"] != current_user["user_id"]:
        return {"error": "Not authorized"}
    await db.kb_documents.update_one({"doc_id": doc_id}, {"$inc": {"views": 1}})
    return {"document": doc}

@router.post("/documents/{doc_id}/helpful")
async def mark_helpful(doc_id: str, helpful: bool, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db.kb_documents.find_one({"doc_id": doc_id})
    if not doc:
        return {"error": "Document not found"}
    if helpful:
        await db.kb_documents.update_one({"doc_id": doc_id}, {"$inc": {"helpful_count": 1}})
    return {"ok": True}

@router.post("/templates")
async def create_template(req: TemplateRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    template = {
        "template_id": "tmpl_" + secrets.token_hex(6),
        "name": req.name,
        "description": req.description,
        "category": req.category,
        "content": req.content,
        "fields": req.fields,
        "creator_id": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
        "usage_count": 0,
    }
    await db.kb_templates.insert_one(template)
    template.pop("_id", None)
    return {"template": template}

@router.get("/templates")
async def list_templates(category: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if category:
        query["category"] = category
    cursor = db.kb_templates.find(query, {"_id": 0}).sort("usage_count", -1)
    templates = await cursor.to_list(100)
    return {"templates": templates}

@router.get("/templates/{template_id}")
async def get_template(template_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    template = await db.kb_templates.find_one({"template_id": template_id}, {"_id": 0})
    if not template:
        return {"error": "Template not found"}
    await db.kb_templates.update_one({"template_id": template_id}, {"$inc": {"usage_count": 1}})
    return {"template": template}

@router.post("/search")
async def search_knowledge(req: SearchRequest, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {"is_public": True, "$text": {"$search": req.query}}
    if req.category:
        query["category"] = req.category
    cursor = db.kb_documents.find(query, {"_id": 0}).sort("views", -1)
    documents = await cursor.to_list(100)
    return {"results": documents}

@router.get("/categories")
async def get_categories(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    categories = await db.kb_documents.distinct("category")
    return {"categories": sorted(categories)}

@router.post("/documents/{doc_id}/share")
async def share_document(doc_id: str, user_ids: list[str], current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db.kb_documents.find_one({"doc_id": doc_id})
    if not doc:
        return {"error": "Document not found"}
    if doc["author_id"] != current_user["user_id"]:
        return {"error": "Not authorized"}
    shared_with = doc.get("shared_with", [])
    for uid in user_ids:
        if uid not in shared_with:
            shared_with.append(uid)
    await db.kb_documents.update_one({"doc_id": doc_id}, {"$set": {"shared_with": shared_with}})
    return {"ok": True}

@router.get("/dashboard/knowledge")
async def get_knowledge_dashboard(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    total_docs = await db.kb_documents.count_documents({"is_public": True})
    my_docs = await db.kb_documents.count_documents({"author_id": current_user["user_id"]})
    total_templates = await db.kb_templates.count_documents({})
    recent_docs = await db.kb_documents.find({"is_public": True}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return {
        "stats": {
            "total_documents": total_docs,
            "my_documents": my_docs,
            "total_templates": total_templates,
        },
        "recent_documents": recent_docs,
    }
