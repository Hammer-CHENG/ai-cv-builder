from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.database import connect_db, disconnect_db
from backend.routes import resume, jd, edit_log, export  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(title="CV Builder MVP", lifespan=lifespan)

app.include_router(resume.router)
app.include_router(jd.router)
app.include_router(edit_log.router)
app.include_router(export.router)


@app.get("/health")
def health():
    return {"status": "ok"}
