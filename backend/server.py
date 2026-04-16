from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager

# Import routes
try:
    from routes.smart_office import router as smart_office_router
except ImportError:
    smart_office_router = None

try:
    from routes.comms import router as comms_router
except ImportError:
    comms_router = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ ESAIE Server Starting...")
    yield
    print("🛑 ESAIE Server Shutting Down...")

app = FastAPI(
    title="ESAIE - Expandable Secure AI Engine",
    description="AI-powered collaboration platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ESAIE"}

@app.get("/")
async def root():
    return {
        "message": "ESAIE API Server",
        "version": "1.0.0",
        "status": "running"
    }

# Include routers if they exist
if smart_office_router:
    app.include_router(smart_office_router)
if comms_router:
    app.include_router(comms_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
