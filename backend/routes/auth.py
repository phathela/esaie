from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os, re, secrets
from server import get_db

router = APIRouter()
security = HTTPBearer(auto_error=False)
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "changeme_secret_key_32chars_min!")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

# ── Models ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    username: str
    country: str = "ZA"

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateLanguageRequest(BaseModel):
    language: str

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    country: str | None = None
    picture: str | None = None

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def user_out(u: dict) -> dict:
    u.pop("password_hash", None)
    u.pop("_id", None)
    return u

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not re.match(r"^[a-zA-Z0-9_]{3,20}$", req.username):
        raise HTTPException(400, "Username must be 3-20 alphanumeric characters")
    if await db.users.find_one({"email": req.email}):
        raise HTTPException(400, "Email already registered")
    if await db.users.find_one({"username": req.username}):
        raise HTTPException(400, "Username already taken")
    user_id = "user_" + secrets.token_hex(6)
    user = {
        "user_id": user_id,
        "email": req.email,
        "username": req.username,
        "name": req.name,
        "password_hash": hash_password(req.password),
        "picture": None,
        "role": "member",
        "country": req.country,
        "default_language": "en",
        "credits": 0,
        "push_subscriptions": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.users.insert_one(user)
    token = make_token(user_id)
    return {"token": token, "user": user_out(user)}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    token = make_token(user["user_id"])
    return {"token": token, "user": user_out(user)}

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return user_out(current_user)

@router.post("/logout")
async def logout():
    return {"message": "Logged out"}

@router.get("/check-username/{username}")
async def check_username(username: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    exists = await db.users.find_one({"username": username})
    return {"available": not exists}

@router.put("/language")
async def update_language(req: UpdateLanguageRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.users.update_one({"user_id": current_user["user_id"]}, {"$set": {"default_language": req.language}})
    return {"message": "Language updated"}

@router.put("/profile")
async def update_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    await db.users.update_one({"user_id": current_user["user_id"]}, {"$set": updates})
    return {"message": "Profile updated"}
