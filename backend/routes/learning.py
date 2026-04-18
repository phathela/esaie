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
    difficulty: str = "beginner"
    duration_hours: int = 0
    image_url: str = ""

class ModuleRequest(BaseModel):
    course_id: str
    title: str
    description: str
    order: int
    content: str
    duration_minutes: int = 0

class QuizSubmissionRequest(BaseModel):
    quiz_id: str
    answers: list[dict]

@router.post("/courses")
async def create_course(req: CourseRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    course = {
        "course_id": "course_" + secrets.token_hex(6),
        "title": req.title,
        "description": req.description,
        "category": req.category,
        "difficulty": req.difficulty,
        "duration_hours": req.duration_hours,
        "image_url": req.image_url,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
        "student_count": 0,
    }
    await db.courses.insert_one(course)
    course.pop("_id", None)
    return {"course": course}

@router.get("/courses")
async def list_courses(category: str = "", difficulty: str = "", db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    query = {}
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    cursor = db.courses.find(query, {"_id": 0}).sort("created_at", -1)
    courses = await cursor.to_list(100)
    uid = current_user["user_id"]
    enroll_cursor = db.enrollments.find({"user_id": uid}, {"course_id": 1})
    enrollments = await enroll_cursor.to_list(200)
    enrolled_ids = {e["course_id"] for e in enrollments}
    for c in courses:
        c["enrolled"] = c["course_id"] in enrolled_ids
    return {"courses": courses}

@router.get("/courses/{course_id}")
async def get_course(course_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    course = await db.courses.find_one({"course_id": course_id}, {"_id": 0})
    modules = await db.modules.find({"course_id": course_id}, {"_id": 0}).sort("order", 1).to_list(100)
    enrolled = await db.enrollments.find_one({"course_id": course_id, "user_id": current_user["user_id"]})
    return {"course": course, "modules": modules, "enrolled": enrolled is not None}

@router.post("/modules")
async def create_module(req: ModuleRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    module = {
        "module_id": "module_" + secrets.token_hex(6),
        "course_id": req.course_id,
        "title": req.title,
        "description": req.description,
        "order": req.order,
        "content": req.content,
        "duration_minutes": req.duration_minutes,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.modules.insert_one(module)
    module.pop("_id", None)
    return {"module": module}

@router.get("/modules/{course_id}")
async def get_modules(course_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    modules = await db.modules.find({"course_id": course_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return {"modules": modules}

@router.post("/enroll")
async def enroll_course(course_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.enrollments.find_one({"course_id": course_id, "user_id": current_user["user_id"]})
    if existing:
        return {"enrolled": True, "message": "Already enrolled"}
    enrollment = {
        "enrollment_id": "enr_" + secrets.token_hex(6),
        "course_id": course_id,
        "user_id": current_user["user_id"],
        "user_name": current_user.get("name", ""),
        "progress": 0,
        "enrolled_at": datetime.utcnow().isoformat(),
        "modules_completed": [],
    }
    await db.enrollments.insert_one(enrollment)
    await db.courses.update_one({"course_id": course_id}, {"$inc": {"student_count": 1}})
    return {"enrolled": True, "enrollment_id": enrollment["enrollment_id"]}

@router.get("/progress/{user_id}")
async def get_progress(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    enrollments = await db.enrollments.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    progress_data = []
    for enrollment in enrollments:
        course = await db.courses.find_one({"course_id": enrollment["course_id"]}, {"_id": 0})
        progress_data.append({**enrollment, "course": course})
    return {"progress": progress_data}

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

@router.post("/quiz-submission")
async def submit_quiz(req: QuizSubmissionRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    quiz = await db.quizzes.find_one({"quiz_id": req.quiz_id})
    module = await db.modules.find_one({"module_id": quiz["module_id"]})
    score = 0
    correct_count = 0
    for i, answer in enumerate(req.answers):
        if i < len(quiz["questions"]) and answer.get("answer") == quiz["questions"][i].get("correct_answer"):
            correct_count += 1
    score = (correct_count / len(quiz["questions"]) * 100) if quiz["questions"] else 0
    passed = score >= quiz.get("passing_score", 70)
    submission = {
        "submission_id": "sub_" + secrets.token_hex(6),
        "quiz_id": req.quiz_id,
        "user_id": current_user["user_id"],
        "score": round(score, 2),
        "passed": passed,
        "submitted_at": datetime.utcnow().isoformat(),
    }
    await db.quiz_submissions.insert_one(submission)
    if passed:
        await db.enrollments.update_one(
            {"course_id": module["course_id"], "user_id": current_user["user_id"]},
            {"$addToSet": {"modules_completed": module["module_id"]}}
        )
    return {"submission": submission, "passed": passed}

@router.get("/certificates/{user_id}")
async def get_certificates(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    certificates = await db.certificates.find({"user_id": user_id}, {"_id": 0}).sort("issued_at", -1).to_list(100)
    return {"certificates": certificates}

@router.get("/dashboard/learning")
async def get_learning_dashboard(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    total_enrollments = await db.enrollments.count_documents({"user_id": current_user["user_id"]})
    completed_courses = await db.enrollments.count_documents({"user_id": current_user["user_id"], "progress": 100})
    certificates = await db.certificates.count_documents({"user_id": current_user["user_id"]})
    recent_enrollments = await db.enrollments.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("enrolled_at", -1).to_list(5)
    return {"stats": {"total_enrollments": total_enrollments, "completed_courses": completed_courses, "certificates_earned": certificates}, "recent_enrollments": recent_enrollments}
