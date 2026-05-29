from databases import Database
from fastapi import FastAPI

from backend.config import settings

database = Database(settings.database_url)


async def connect_db(app: FastAPI):
    await database.connect()


async def disconnect_db(app: FastAPI):
    await database.disconnect()
