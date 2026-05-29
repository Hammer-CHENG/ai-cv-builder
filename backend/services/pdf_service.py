from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


def generate_pdf(cv_json: dict) -> bytes:
    """Render CV JSON to ATS-friendly PDF via Jinja2 + WeasyPrint."""
    template = env.get_template("cv_ats.html")

    # Extract data from cv_json
    contact = cv_json.get("contact", {})
    name = contact.get("name", "Your Name")
    sections = cv_json.get("sections", {})

    html_content = template.render(name=name, contact=contact, sections=sections)

    pdf = HTML(string=html_content).write_pdf()
    return pdf
