import httpx

from backend.config import settings

LLM_TIMEOUT = httpx.Timeout(45.0, connect=10.0)


async def call_qwen(
    system_prompt: str,
    user_content: str,
    response_schema: dict | None = None,
    max_retries: int = 1,
) -> dict:
    """Call Qwen LLM with JSON Schema constraint and retry on failure."""
    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
    }
    if response_schema:
        body["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "response",
                "schema": response_schema,
                "strict": True,
            },
        }

    last_error = None
    for attempt in range(1 + max_retries):
        try:
            async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
                resp = await client.post(
                    f"{settings.llm_api_base}/chat/completions",
                    headers=headers,
                    json=body,
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return {"content": content, "usage": data.get("usage", {})}
        except (httpx.HTTPError, KeyError, IndexError) as e:
            last_error = e
            continue

    raise RuntimeError(f"LLM call failed after {1 + max_retries} attempts: {last_error}")


SYSTEM_PREFERENCES = (
    "Always use strong action verbs at the start of bullet points. "
    "Keep output concise — aim for single page where possible. "
    "Maintain ATS-friendly structure: no tables, no images, standard fonts."
)


async def tailor_cv(profile_json: dict, jd_text: str) -> dict:
    """Tailor CV to JD, return tailored CV JSON with annotations."""
    from backend.prompts import TAILOR_CV_PROMPT

    system = f"{TAILOR_CV_PROMPT}\n\n{SYSTEM_PREFERENCES}"
    user = f"Resume Profile:\n{profile_json}\n\nJob Description:\n{jd_text}"
    result = await call_qwen(system, user)
    import json
    return json.loads(result["content"])


async def generate_cover_letter(tailored_cv: dict, jd_text: str) -> str:
    """Generate cover letter text."""
    from backend.prompts import COVER_LETTER_PROMPT

    system = COVER_LETTER_PROMPT
    user = f"Tailored CV:\n{tailored_cv}\n\nJob Description:\n{jd_text}"
    result = await call_qwen(system, user)
    return result["content"]


async def generate_interview_questions(tailored_cv: dict, jd_text: str) -> dict:
    """Generate 3 JD-based + 2 CV-based interview questions."""
    from backend.prompts import INTERVIEW_QUESTIONS_PROMPT

    system = INTERVIEW_QUESTIONS_PROMPT
    user = f"Tailored CV:\n{tailored_cv}\n\nJob Description:\n{jd_text}"
    result = await call_qwen(system, user)
    import json
    return json.loads(result["content"])


async def score_match(profile_json: dict, jd_text: str) -> int:
    """Score CV-JD match percentage (0-100)."""
    from backend.prompts import MATCH_SCORING_PROMPT

    system = MATCH_SCORING_PROMPT
    user = f"Resume Profile:\n{profile_json}\n\nJob Description:\n{jd_text}"
    result = await call_qwen(system, user)
    import json
    parsed = json.loads(result["content"])
    return parsed.get("score", 0)
