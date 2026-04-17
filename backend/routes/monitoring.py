from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

@router.get("/cameras")
async def get_cameras(current_user=Depends(get_current_user)):
    return {"cameras": []}

@router.get("/v2/lpr/analytics")
async def lpr_analytics(current_user=Depends(get_current_user)):
    return {"total": 0, "registered": 0, "unknown": 0, "denied": 0}
