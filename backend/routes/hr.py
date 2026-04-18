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
