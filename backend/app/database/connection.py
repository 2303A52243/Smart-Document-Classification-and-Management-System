"""
MongoDB database connection and collection accessors.
Uses Motor (async MongoDB driver) for FastAPI async support.
Falls back gracefully if MongoDB is not running.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()


def init_db():
    """Initialize MongoDB client if not already initialized."""
    if db_instance.client is None:
        client_kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
        }
        try:
            import certifi
            client_kwargs["tlsCAFile"] = certifi.where()
        except ImportError:
            pass

        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            **client_kwargs,
        )
        db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
    return db_instance.db


async def connect_db():
    """Connect to MongoDB and create indexes."""
    try:
        init_db()

        # Verify connection
        await db_instance.client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")

        # Create indexes
        await create_indexes()
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        logger.warning("Running without verified MongoDB ping — client remains initialized for incoming requests.")


async def create_indexes():
    """Create MongoDB indexes for performance."""
    if db_instance.db is None:
        return
    try:
        # Users collection
        await db_instance.db.users.create_indexes([
            IndexModel([("email", ASCENDING)], unique=True),
        ])

        # Documents collection
        await db_instance.db.documents.create_indexes([
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("predicted_category", ASCENDING)]),
            IndexModel([("uploaded_at", DESCENDING)]),
            IndexModel([("original_filename", ASCENDING)]),
        ])

        # Activity logs
        await db_instance.db.activity_logs.create_indexes([
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
        ])
        logger.info("✅ MongoDB indexes created.")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


async def disconnect_db():
    """Close MongoDB connection."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")


def get_db():
    """Return the database instance."""
    if db_instance.db is None:
        init_db()
    return db_instance.db


def get_users_collection():
    db = get_db()
    if db is None:
        return None
    return db.users


def get_documents_collection():
    db = get_db()
    if db is None:
        return None
    return db.documents


def get_activity_logs_collection():
    db = get_db()
    if db is None:
        return None
    return db.activity_logs


def get_categories_collection():
    db = get_db()
    if db is None:
        return None
    return db.categories

