from fastapi import APIRouter, Depends
from routes.auth import get_current_user
router = APIRouter()

@router.get("/documents")
async def get_documents(current_user=Depends(get_current_user)):
    return {"documents": []}

@router.get("/smart-office/files/list")
async def list_files(current_user=Depends(get_current_user)):
    return {"files": []}
