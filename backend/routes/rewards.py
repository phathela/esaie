from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

@router.get("/my-rewards")
async def my_rewards(current_user=Depends(get_current_user)):
    return {"balance": current_user.get("credits", 0), "rewards": []}

@router.get("/competitions")
async def get_competitions(current_user=Depends(get_current_user)):
    return {"competitions": []}

@router.get("/offers")
async def get_offers(current_user=Depends(get_current_user)):
    return {"offers": []}

@router.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    return {"transactions": []}
