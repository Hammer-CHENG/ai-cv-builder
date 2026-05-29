from backend.utils.json_diff import compute_diff


def capture_diff(original: dict, edited: dict) -> dict:
    """Capture and structure the diff between LLM output and user-edited version."""
    return compute_diff(original, edited)
