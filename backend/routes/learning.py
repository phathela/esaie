from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

class CourseRequest(BaseModel):
    title: str
    description: str
    category: str
    modules: list[dict] = []
    duration_hours: int = 1
    level: str = "beginner"

class EnrollRequest(BaseModel):
    course_id: str

class ProgressRequest(BaseModel):
    course_id: str
    module_index: int
    completed: bool = True

@router.post("/courses")
async def create_course(req: CourseRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    course = {
        "course_id": "course_" + secrets.token_hex(6),
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "modules": req.modules,
        "duration_hours": req.duration_hours,
        "level": req.level,
        "created_by": current_user["user_id"],
        "enrolled_count": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.courses.insert_one(course)
    course.pop("_id", None)
    return {"course": course}

@router.get("/courses")
async def list_courses(category: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {"category": category} if category else {}
    cursor = db.courses.find(query, {"_id": 0}).sort("created_at", -1)
    courses = await cursor.to_list(100)
    uid = current_user["user_id"]
    enrolled_ids = set()
    enroll_cursor = db.enrollments.find({"user_id": uid}, {"course_id": 1})
    enrollments = await enroll_cursor.to_list(200)
    enrolled_ids = {e["course_id"] for e in enrollments}
    for c in courses:
        c["enrolled"] = c["course_id"] in enrolled_ids
    return {"courses": courses}

@router.post("/enroll")
async def enroll(req: EnrollRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    exists = await db.enrollments.find_one({"user_id": uid, "course_id": req.course_id})
    if not exists:
        await db.enrollments.insert_one({
            "enrollment_id": "enr_" + secrets.token_hex(6),
            "user_id": uid,
            "course_id": req.course_id,
            "progress": [],
            "completed": False,
            "enrolled_at": datetime.utcnow().isoformat(),
        })
        await db.courses.update_one({"course_id": req.course_id}, {"$inc": {"enrolled_count": 1}})
    return {"ok": True}

@router.post("/progress")
async def update_progress(req: ProgressRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    enr = await db.enrollments.find_one({"user_id": uid, "course_id": req.course_id})
    if not enr:
        return {"ok": False, "error": "Not enrolled"}
    progress = enr.get("progress", [])
    if req.module_index not in progress and req.completed:
        progress.append(req.module_index)
    course = await db.courses.find_one({"course_id": req.course_id})
    total_modules = len(course.get("modules", [])) if course else 1
    completed = len(progress) >= total_modules
    await db.enrollments.update_one(
        {"user_id": uid, "course_id": req.course_id},
        {"$set": {"progress": progress, "completed": completed, "updated_at": datetime.utcnow().isoformat()}}
    )
    return {"ok": True, "progress": progress, "completed": completed}

@router.get("/my-courses")
async def my_courses(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    cursor = db.enrollments.find({"user_id": uid}, {"_id": 0})
    enrollments = await cursor.to_list(100)
    result = []
    for enr in enrollments:
        course = await db.courses.find_one({"course_id": enr["course_id"]}, {"_id": 0})
        if course:
            course["enrollment"] = {k: v for k, v in enr.items() if k != "course_id"}
            result.append(course)
    return {"courses": result}
