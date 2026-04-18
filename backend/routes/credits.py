from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import os
from database import get_db
from routes.auth import get_current_user

router = APIRouter()

# Service pricing in credits per unit
SERVICE_PRICING = {
    "meet_ai_transcription": {"name": "MeetAI Transcription", "price_per_unit": 0.5, "unit": "minute"},
    "real_time_interpretation": {"name": "Real-time Interpretation", "price_per_unit": 1.0, "unit": "minute"},
    "ai_report_generation": {"name": "AI Report Generation", "price_per_unit": 5.0, "unit": "report"},
    "document_analysis": {"name": "Document Analysis", "price_per_unit": 2.0, "unit": "document"},
    "excel_analysis": {"name": "Excel Analysis", "price_per_unit": 1.0, "unit": "analysis"},
    "transcription": {"name": "Audio Transcription", "price_per_unit": 0.3, "unit": "minute"},
}

# Credit packages with ZAR pricing
CREDIT_PACKAGES = [
    {
        "id": "starter",
        "name": "Starter Pack",
        "aipps": 100,
        "bonus": 0,
        "price_zar": 99,
        "price_usd": 5.50,
        "description": "Perfect for getting started"
    },
    {
        "id": "standard",
        "name": "Standard Pack",
        "aipps": 500,
        "bonus": 50,
        "price_zar": 449,
        "price_usd": 25.00,
        "description": "Most popular option"
    },
    {
        "id": "professional",
        "name": "Professional Pack",
        "aipps": 1000,
        "bonus": 150,
        "price_zar": 799,
        "price_usd": 44.50,
        "description": "For professional users"
    },
    {
        "id": "enterprise",
        "name": "Enterprise Pack",
        "aipps": 5000,
        "bonus": 1000,
        "price_zar": 3499,
        "price_usd": 194.50,
        "description": "High-volume usage"
    },
]

class CreateCheckoutRequest(BaseModel):
    package_id: str

# ── Service Pricing ────────────────────────────────────────────────────────────

@router.get("/pricing")
async def get_pricing():
    """Get service pricing in Aipps credits"""
    return {
        "services": SERVICE_PRICING,
        "note": "Credits are deducted from user balance when services are used"
    }

# ── Credit Packages ────────────────────────────────────────────────────────────

@router.get("/packages")
async def get_packages():
    """Get available credit packages"""
    return {"packages": CREDIT_PACKAGES}

# ── User Balance ───────────────────────────────────────────────────────────────

@router.get("/balance")
async def get_balance(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user's current Aipps balance"""
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    balance = user.get("credits", 0)
    # Approximate USD conversion (1 ZAR ≈ 0.056 USD)
    usd_value = round(balance * 0.056, 2)

    return {
        "balance_aipps": balance,
        "balance_usd": usd_value,
        "user_id": current_user["user_id"],
        "username": user.get("username"),
    }

# ── Transaction History ────────────────────────────────────────────────────────

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user's transaction history"""
    transactions = await db.transactions.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    return {
        "transactions": transactions,
        "total": len(transactions)
    }

# ── Stripe Checkout Session ────────────────────────────────────────────────────

@router.post("/create-checkout-session")
async def create_checkout_session(
    req: CreateCheckoutRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a Stripe checkout session for purchasing credits"""

    # Validate package
    package = next((p for p in CREDIT_PACKAGES if p["id"] == req.package_id), None)
    if not package:
        raise HTTPException(400, f"Invalid package ID: {req.package_id}")

    try:
        import stripe
        stripe.api_key = os.getenv("STRIPE_API_KEY")

        user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(404, "User not found")

        # Create checkout session
        session = stripe.checkout.Session.create(
            customer_email=user["email"],
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "zar",
                    "product_data": {
                        "name": f"{package['name']}",
                        "description": f"{package['aipps']} Aipps + {package['bonus']} Bonus",
                    },
                    "unit_amount": int(package["price_zar"] * 100),  # ZAR in cents
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + f"/aipps/success?session_id={{CHECKOUT_SESSION_ID}}&package={req.package_id}",
            cancel_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/aipps/cancelled",
            metadata={
                "user_id": current_user["user_id"],
                "package_id": req.package_id,
                "aipps": package["aipps"],
                "bonus": package["bonus"],
            }
        )

        return {
            "session_id": session.id,
            "client_secret": session.client_secret,
            "url": session.url,
            "package": package,
        }
    except Exception as e:
        raise HTTPException(502, f"Stripe error: {str(e)}")

# ── Webhook Handler (called by Stripe) ─────────────────────────────────────────

@router.post("/webhook/stripe")
async def stripe_webhook(request: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Handle Stripe payment success webhook"""
    try:
        import stripe
        stripe.api_key = os.getenv("STRIPE_API_KEY")

        # In production, verify webhook signature using webhook secret
        # For now, assume it's valid (would be verified with webhook signing key)

        if request.get("type") == "checkout.session.completed":
            session = request["data"]["object"]
            metadata = session.get("metadata", {})

            user_id = metadata.get("user_id")
            package_id = metadata.get("package_id")
            aipps = int(metadata.get("aipps", 0))
            bonus = int(metadata.get("bonus", 0))
            total_credits = aipps + bonus

            if not user_id:
                return {"status": "error", "message": "No user_id in metadata"}

            # Update user credits
            await db.users.update_one(
                {"user_id": user_id},
                {"$inc": {"credits": total_credits}, "$set": {"updated_at": datetime.utcnow().isoformat()}}
            )

            # Record transaction
            transaction = {
                "user_id": user_id,
                "type": "purchase",
                "package_id": package_id,
                "aipps_purchased": aipps,
                "bonus": bonus,
                "total_credits": total_credits,
                "amount_zar": session.get("amount_total", 0) / 100,
                "stripe_session_id": session["id"],
                "status": "completed",
                "created_at": datetime.utcnow().isoformat(),
            }
            await db.transactions.insert_one(transaction)

            return {"status": "success", "credits_added": total_credits}

        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ── Deduct Credits (for internal use by other routes) ──────────────────────────

async def deduct_credits(user_id: str, amount: int, service: str, db: AsyncIOMotorDatabase):
    """Deduct credits from user account"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or user.get("credits", 0) < amount:
        raise HTTPException(400, f"Insufficient credits. Required: {amount}, Available: {user.get('credits', 0) if user else 0}")

    # Deduct credits
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"credits": -amount}, "$set": {"updated_at": datetime.utcnow().isoformat()}}
    )

    # Record transaction
    transaction = {
        "user_id": user_id,
        "type": "deduction",
        "service": service,
        "amount": amount,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.transactions.insert_one(transaction)

    return {"credits_deducted": amount, "balance_remaining": user.get("credits", 0) - amount}
