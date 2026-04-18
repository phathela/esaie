from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets, os, stripe
from database import get_db
from routes.auth import get_current_user

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_API_KEY")

class AddCreditsRequest(BaseModel):
    amount_zar: int

class RedeemRequest(BaseModel):
    offer_id: str
    aipps_cost: int

OFFERS = [
    {"offer_id": "off_001", "title": "Coffee Voucher", "description": "R50 coffee voucher at any café", "aipps_cost": 100, "category": "Food", "icon": "☕"},
    {"offer_id": "off_002", "title": "Lunch Voucher", "description": "R150 lunch voucher", "aipps_cost": 300, "category": "Food", "icon": "🍽️"},
    {"offer_id": "off_003", "title": "Movie Ticket", "description": "1x Cinema ticket", "aipps_cost": 200, "category": "Entertainment", "icon": "🎬"},
    {"offer_id": "off_004", "title": "Gym Day Pass", "description": "1-day gym access", "aipps_cost": 150, "category": "Health", "icon": "💪"},
    {"offer_id": "off_005", "title": "Gift Card R100", "description": "R100 gift card", "aipps_cost": 500, "category": "Shopping", "icon": "🛍️"},
]

@router.get("/balance")
async def get_balance(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"credits": 1})
    return {"balance": user.get("credits", 0) if user else 0}

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.credit_history.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).limit(50)
    history = await cursor.to_list(50)
    return {"history": history}

@router.get("/offers")
async def get_offers(current_user: dict = Depends(get_current_user)):
    return {"offers": OFFERS}

@router.post("/redeem")
async def redeem_offer(req: RedeemRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"user_id": current_user["user_id"]})
    if not user or user.get("credits", 0) < req.aipps_cost:
        raise HTTPException(400, "Insufficient Aipps balance")
    await db.users.update_one({"user_id": current_user["user_id"]}, {"$inc": {"credits": -req.aipps_cost}})
    tx = {"tx_id": "tx_" + secrets.token_hex(6), "user_id": current_user["user_id"],
          "type": "debit", "amount": -req.aipps_cost,
          "description": f"Redeemed: {req.offer_id}", "created_at": datetime.utcnow().isoformat()}
    await db.credit_history.insert_one(tx)
    return {"ok": True, "new_balance": user["credits"] - req.aipps_cost}

@router.post("/buy")
async def buy_credits(req: AddCreditsRequest, current_user: dict = Depends(get_current_user)):
    aipps = req.amount_zar * 10
    try:
        intent = stripe.PaymentIntent.create(
            amount=req.amount_zar * 100, currency="zar",
            metadata={"user_id": current_user["user_id"], "aipps": aipps})
        return {"client_secret": intent.client_secret, "aipps": aipps}
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/award")
async def award_credits(user_id: str, amount: int, reason: str = "", current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.users.update_one({"user_id": user_id}, {"$inc": {"credits": amount}})
    tx = {"tx_id": "tx_" + secrets.token_hex(6), "user_id": user_id, "type": "credit",
          "amount": amount, "description": reason or f"Awarded by {current_user['name']}",
          "created_at": datetime.utcnow().isoformat()}
    await db.credit_history.insert_one(tx)
    return {"ok": True}
