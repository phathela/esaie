from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

@router.get("/organization/levels")
async def get_levels(current_user=Depends(get_current_user)):
    return {"levels": ["DG", "DDG", "DIR", "DDIR", "MGR", "ANL", "OFF"]}

@router.get("/members")
async def get_members(current_user=Depends(get_current_user)):
    return {"members": []}

@router.get("/positions")
async def get_positions(current_user=Depends(get_current_user)):
    return {"positions": []}

@router.get("/organogram")
async def get_organogram(current_user=Depends(get_current_user)):
    return {"organogram": []}

@router.post("/bot/chat")
async def hr_bot(current_user=Depends(get_current_user)):
    return {"response": "HR Bot coming soon"}
