from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import database

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ai_support_base")

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(MONGO_URL)
    database.set_client(client)
    db = client[DB_NAME]
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.messages.create_index([("conversation_id", 1), ("created_at", 1)])
    await db.group_messages.create_index([("group_id", 1), ("created_at", 1)])
    await db.tasks.create_index("assigned_to")
    await db.lpr_events.create_index("created_at")
    print("✅ ESAIE Server Starting — MongoDB connected")
    yield
    client.close()
    print("🛑 ESAIE Server Shutting Down")

app = FastAPI(
    title="ESAIE - AI Support BASE",
    description="Expandable Secure AI Engine",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes.auth import router as auth_router
from routes.comms import router as comms_router
from routes.smart_office import router as smart_office_router
from routes.alerts import router as alerts_router
from routes.rewards import router as rewards_router
from routes.hr import router as hr_router
from routes.monitoring import router as monitoring_router
from routes.credits import router as credits_router
from routes.knowledge import router as knowledge_router
from routes.learning import router as learning_router
from routes.innovation import router as innovation_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(comms_router, prefix="/api/comms", tags=["comms"])
app.include_router(smart_office_router, prefix="/api/smart-office", tags=["smart-office"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["alerts"])
app.include_router(rewards_router, prefix="/api/rewards", tags=["rewards"])
app.include_router(hr_router, prefix="/api/hr", tags=["hr"])
app.include_router(monitoring_router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(credits_router, prefix="/api/credits", tags=["credits"])
app.include_router(knowledge_router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(learning_router, prefix="/api/learning", tags=["learning"])
app.include_router(innovation_router, prefix="/api/innovation", tags=["innovation"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ESAIE", "version": "3.0.0"}

@app.get("/")
async def root():
    return {"message": "ESAIE API Server", "version": "3.0.0", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
