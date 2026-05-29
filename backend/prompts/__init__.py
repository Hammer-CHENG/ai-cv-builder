from pathlib import Path

PROMPTS_DIR = Path(__file__).parent

TAILOR_CV_PROMPT = (PROMPTS_DIR / "tailor_cv.txt").read_text()
COVER_LETTER_PROMPT = (PROMPTS_DIR / "cover_letter.txt").read_text()
INTERVIEW_QUESTIONS_PROMPT = (PROMPTS_DIR / "interview_questions.txt").read_text()
MATCH_SCORING_PROMPT = (PROMPTS_DIR / "match_scoring.txt").read_text()
