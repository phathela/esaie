from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

PACKAGES = [
    {"id": "starter", "name": "Starter", "aipps": 50, "bonus": 0, "price_usd": 4.99},
    {"id": "standard", "name": "Standard", "aipps": 100, "bonus": 10, "price_usd": 9.99},
    {"id": "professional", "name": "Professional", "aipps": 250, "bonus": 30, "price_usd": 22.99},
    {"id": "enterprise", "name": "Enterprise", "aipps": 500, "bonus": 75, "price_usd": 44.99},
    {"id": "premium", "name": "Premium", "aipps": 1000, "bonus": 200, "price_usd": 84.99},
]

@router.get("/packages")
async def get_packages():
    return {"packages": PACKAGES}

@router.get("/balance")
async def get_balance(current_user=Depends(get_current_user)):
    return {"credits": current_user.get("credits", 0)}

@router.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    return {"transactions": []}
