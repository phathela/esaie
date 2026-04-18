from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user
from services.ai import hr_assistant

router = APIRouter()

class StaffMemberRequest(BaseModel):
    name: str
    email: str
    position: str
    department: str
    reports_to: str = ""
    phone: str = ""
    picture: str = ""

class PerformanceContractRequest(BaseModel):
    employee_id: str
    period: str
    objectives: list[dict] = []
    notes: str = ""

class HRChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/staff")
async def create_staff(req: StaffMemberRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    member = {"staff_id": "staff_" + secrets.token_hex(6), "name": req.name, "email": req.email,
              "position": req.position, "department": req.department, "reports_to": req.reports_to,
              "phone": req.phone, "picture": req.picture, "created_by": current_user["user_id"],
              "created_at": datetime.utcnow().isoformat()}
    await db.staff.insert_one(member)
    member.pop("_id", None)
    return {"member": member}

@router.get("/staff")
async def get_staff(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.staff.find({}, {"_id": 0}).sort("department", 1)
    return {"staff": await cursor.to_list(200)}

@router.put("/staff/{staff_id}")
async def update_staff(staff_id: str, req: StaffMemberRequest, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    await db.staff.update_one({"staff_id": staff_id}, {"$set": req.dict()})
    return {"ok": True}

@router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    await db.staff.delete_one({"staff_id": staff_id})
    return {"ok": True}

@router.get("/departments")
async def get_departments(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return {"departments": await db.staff.distinct("department")}

@router.get("/organogram")
async def get_organogram(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.staff.find({}, {"_id": 0})
    staff = await cursor.to_list(200)
    return {"organogram": staff}

@router.post("/performance")
async def create_contract(req: PerformanceContractRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    contract = {"contract_id": "perf_" + secrets.token_hex(6), "employee_id": req.employee_id,
                "period": req.period, "objectives": req.objectives, "notes": req.notes,
                "status": "active", "created_by": current_user["user_id"],
                "created_at": datetime.utcnow().isoformat()}
    await db.performance.insert_one(contract)
    contract.pop("_id", None)
    return {"contract": contract}

@router.get("/performance")
async def get_performance(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.performance.find({}, {"_id": 0}).sort("created_at", -1)
    return {"contracts": await cursor.to_list(100)}

@router.post("/bot/chat")
async def hr_chat(req: HRChatRequest, current_user: dict = Depends(get_current_user)):
    history = [{"role": m["role"], "content": m["content"]} for m in req.history[-8:]]
    history.append({"role": "user", "content": req.message})
    reply = await hr_assistant(history)
    return {"reply": reply}

@router.get("/organization/levels")
async def get_levels(current_user: dict = Depends(get_current_user)):
    return {"levels": ["DG", "DDG", "DIR", "DDIR", "MGR", "ANL", "OFF"]}

# ── Goals & Development ────────────────────────────────────────────────────

class GoalRequest(BaseModel):
    staff_id: str
    title: str
    description: str
    target_date: str
    priority: str = "medium"

@router.post("/goals")
async def create_goal(req: GoalRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    goal = {
        "goal_id": "goal_" + secrets.token_hex(6),
        "staff_id": req.staff_id,
        "title": req.title,
        "description": req.description,
        "target_date": req.target_date,
        "priority": req.priority,
        "status": "active",
        "progress": 0,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.goals.insert_one(goal)
    goal.pop("_id", None)
    return {"goal": goal}

@router.get("/goals/{staff_id}")
async def get_staff_goals(staff_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    goals = await db.goals.find({"staff_id": staff_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"goals": goals}

@router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, status: str = "", progress: int = None, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    update = {}
    if status:
        update["status"] = status
    if progress is not None:
        update["progress"] = progress
    await db.goals.update_one({"goal_id": goal_id}, {"$set": update})
    return {"ok": True}

# ── Performance Reviews ────────────────────────────────────────────────────

class PerformanceReviewRequest(BaseModel):
    staff_id: str
    rating: float  # 1-5
    feedback: str
    period: str = ""

@router.post("/reviews")
async def create_review(req: PerformanceReviewRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    review = {
        "review_id": "rev_" + secrets.token_hex(6),
        "staff_id": req.staff_id,
        "rating": min(5, max(1, req.rating)),
        "feedback": req.feedback,
        "period": req.period,
        "reviewed_by": current_user["user_id"],
        "reviewed_by_name": current_user["name"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.performance_reviews.insert_one(review)
    review.pop("_id", None)
    return {"review": review}

@router.get("/reviews/{staff_id}")
async def get_staff_reviews(staff_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    reviews = await db.performance_reviews.find({"staff_id": staff_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    return {"reviews": reviews, "average_rating": round(avg_rating, 2), "total_reviews": len(reviews)}

# ── HR Dashboard ────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_hr_dashboard(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    total_staff = await db.staff.count_documents({})
    departments_count = await db.staff.aggregate([
        {"$group": {"_id": "$department", "count": {"$sum": 1}}}
    ]).to_list(100)

    recent_reviews = await db.performance_reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    active_goals = await db.goals.count_documents({"status": "active"})

    return {
        "stats": {
            "total_staff": total_staff,
            "departments": len(departments_count),
            "active_goals": active_goals,
            "recent_reviews": len(recent_reviews),
        },
        "departments": departments_count,
        "recent_reviews": recent_reviews,
    }
