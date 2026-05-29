from fastapi import FastAPI

app = FastAPI(title="CV Builder MVP")


@app.get("/health")
def health():
    return {"status": "ok"}
