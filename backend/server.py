from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ai_support_base")

db_client: AsyncIOMotorClient = None

def get_db():
    return db_client[DB_NAME]

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client
    db_client = AsyncIOMotorClient(MONGO_URL)
    app.state.db = db_client[DB_NAME]
    print("✅ ESAIE Server Starting — MongoDB connected")
    yield
    db_client.close()
    print("🛑 ESAIE Server Shutting Down")

app = FastAPI(
    title="ESAIE - AI Support BASE",
    description="Expandable Secure AI Engine",
    version="2.0.0",
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
from routes.smart_office import router as smart_office_router
from routes.comms import router as comms_router
from routes.alerts import router as alerts_router
from routes.rewards import router as rewards_router
from routes.hr import router as hr_router
from routes.monitoring import router as monitoring_router
from routes.credits import router as credits_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(smart_office_router, prefix="/api", tags=["smart-office"])
app.include_router(comms_router, prefix="/api/comms", tags=["comms"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["alerts"])
app.include_router(rewards_router, prefix="/api/rewards", tags=["rewards"])
app.include_router(hr_router, prefix="/api/hr", tags=["hr"])
app.include_router(monitoring_router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(credits_router, prefix="/api/credits", tags=["credits"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ESAIE", "version": "2.0.0"}

@app.get("/")
async def root():
    return {"message": "ESAIE API Server", "version": "2.0.0", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
