from fastapi import APIRouter, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets, httpx
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

CATEGORIES = ["Breaking News", "Weather Warnings", "Traffic Updates", "Jobs/Funding",
              "Deals", "Stock Market", "Property", "Security Alerts", "Health Updates", "Sports News"]

class CreateAlertRequest(BaseModel):
    title: str
    body: str
    category: str = "General"
    severity: str = "info"
    location: str = ""

@router.post("/")
async def create_alert(req: CreateAlertRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    alert = {
        "alert_id": "alert_" + secrets.token_hex(6),
        "title": req.title,
        "body": req.body,
        "category": req.category,
        "severity": req.severity,
        "location": req.location,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.alerts.insert_one(alert)
    alert.pop("_id", None)
    return {"alert": alert}

@router.get("/")
async def get_alerts(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.alerts.find({}, {"_id": 0}).sort("created_at", -1).limit(50)
    alerts = await cursor.to_list(50)
    return {"alerts": alerts}

@router.get("/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    return {"categories": CATEGORIES}

@router.get("/news")
async def get_news(current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get("https://gnews.io/api/v4/top-headlines",
                params={"category": "general", "lang": "en", "max": 10, "apikey": "free"})
            if resp.status_code == 200:
                return {"articles": resp.json().get("articles", [])}
    except Exception:
        pass
    return {"articles": SAMPLE_NEWS}

@router.get("/weather")
async def get_weather(city: str = "Johannesburg", current_user: dict = Depends(get_current_user)):
    return {"city": city, "weather": SAMPLE_WEATHER}

SAMPLE_NEWS = [
    {"title": "Tech Innovation Drives Economic Growth", "description": "AI and automation continue to reshape industries worldwide.", "publishedAt": datetime.utcnow().isoformat(), "source": {"name": "Tech News"}, "url": "#"},
    {"title": "Global Markets Show Resilience", "description": "Markets recover amid positive economic indicators.", "publishedAt": datetime.utcnow().isoformat(), "source": {"name": "Financial Times"}, "url": "#"},
    {"title": "Climate Initiative Gains Momentum", "description": "Nations commit to new environmental targets.", "publishedAt": datetime.utcnow().isoformat(), "source": {"name": "Environment Daily"}, "url": "#"},
]

SAMPLE_WEATHER = {"temperature": 22, "feels_like": 20, "humidity": 55, "description": "Partly cloudy", "wind_speed": 15, "icon": "⛅"}
