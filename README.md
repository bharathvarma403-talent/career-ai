# CareerAI — AI Career Guidance & Resume Intelligence Platform

CareerAI is an AI-powered career development platform that performs deterministic ATS section audits on resumes, maps candidate competencies against high-demand engineering tracks, and provides context-grounded career mentorship.

---

## Key Features

- **ATS Document Diagnostics:** Evaluates PDF and DOCX documents across formatting hygiene, contact completeness, experience depth, and quantified impact metrics.
- **Annotated Document Review & Diff:** Delivers line-by-line before/after bullet rewrites with quantifiable metrics and explanations.
- **Competency Taxonomy & Skill Gap Architecture:** Benchmarks candidate skills against target engineering tracks (*AI / Machine Learning Engineer*, *Senior Full-Stack*, *Cloud Architect*, *DevOps / SRE*, etc.) and provides structured 3-phase learning trajectories.
- **Contextual Mentorship Studio:** Multi-turn conversational career guidance pre-loaded with candidate resume scores, verified skills, and target career goals.
- **Candidate Dossier:** Dynamic profile management with real-time skill chip management.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router 7
- **Styling:** Tailwind CSS v4 (with `@tailwindcss/vite` plugin)
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI
- **Database:** SQLAlchemy ORM (SQLite local fallback + PostgreSQL support)
- **Authentication:** Standard JWT Bearer token authentication via `OAuth2PasswordBearer` and `bcrypt`
- **Document Processing:** PyMuPDF (`fitz`) and `python-docx`
- **AI Engine:** Google Gemini Flash integration with heuristic fallbacks

---

## Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\activate  # Windows
# or source venv/bin/activate  # Linux/macOS

# Install dependencies (if not already installed)
pip install -r requirements.txt  # or install fastapi uvicorn sqlalchemy pydantic pyjwt bcrypt pymupdf python-docx

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your GEMINI_API_KEY and SECRET_KEY

# Run FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
Web application will be accessible at [http://localhost:5173/](http://localhost:5173/).

---

## Testing

Run the automated test suite:
```bash
# Run unit & integration tests
python -m unittest tests/test_career_ai.py

# Run live server endpoint tests
python test_server.py
```

---

## License
MIT

