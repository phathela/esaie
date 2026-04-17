from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

@router.get("/chat/conversations")
async def get_conversations(current_user=Depends(get_current_user)):
    return {"conversations": []}

@router.get("/chat/users/search")
async def search_users(q: str = "", current_user=Depends(get_current_user)):
    return {"users": []}

@router.get("/groups")
async def get_groups(current_user=Depends(get_current_user)):
    return {"groups": []}

@router.get("/meetings")
async def get_meetings(current_user=Depends(get_current_user)):
    return {"meetings": []}

@router.get("/meetings/invites")
async def get_invites(current_user=Depends(get_current_user)):
    return {"invites": []}

@router.get("/tasks")
async def get_tasks(current_user=Depends(get_current_user)):
    return {"tasks": []}

@router.get("/calls/history")
async def call_history(current_user=Depends(get_current_user)):
    return {"calls": []}

@router.get("/notifications/summary")
async def notifications_summary(current_user=Depends(get_current_user)):
    return {"unread_messages": 0, "unread_groups": 0, "pending_invites": 0, "missed_calls": 0}

@router.get("/notifications/unread-count")
async def unread_count(current_user=Depends(get_current_user)):
    return {"count": 0}
