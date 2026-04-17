from motor.motor_asyncio import AsyncIOMotorClient
import os

_client: AsyncIOMotorClient = None

def get_client() -> AsyncIOMotorClient:
    return _client

def get_db():
    return _client[os.getenv("DB_NAME", "ai_support_base")]

def set_client(client: AsyncIOMotorClient):
    global _client
    _client = client
