from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

CATEGORIES = [
    "Breaking News","Weather Warnings","Traffic Updates","Jobs/Funding",
    "Deals","Stock Market","Property","Security Alerts","Health Updates","Sports News",
]

@router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

@router.get("/feed")
async def get_feed(current_user=Depends(get_current_user)):
    return {"alerts": []}

@router.get("/filters")
async def get_filters(current_user=Depends(get_current_user)):
    return {"filters": []}
