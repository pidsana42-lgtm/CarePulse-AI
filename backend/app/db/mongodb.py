import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_instance = MongoDB()


async def connect_to_mongo():
    """Establish connection to MongoDB."""
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
        db_instance.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000
        )
        db_instance.db = db_instance.client[settings.MONGO_DB_NAME]
        
        # Test connection
        await db_instance.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.warning(f"MongoDB connection warning (will retry on demand): {e}")


async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency or helper to access the MongoDB database instance."""
    return db_instance.db
