from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.database import connect_db, database, disconnect_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db(app)
    yield
    await disconnect_db(app)


app = FastAPI(title="CV Builder MVP", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}
