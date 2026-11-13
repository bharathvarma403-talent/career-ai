"""
Career AI FastAPI Application

AI-powered career guidance and resume feedback chatbot backend.
"""

import os
import uuid
import logging
import json
import secrets
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status as status_codes
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import EmailStr
import jwt
import bcrypt

from backend.database import engine, SessionLocal, Base, init_db
from backend.models import (
    User, UserProfile, Resume, ResumeAnalysis, ResumeIssue,
    Skill, UserSkill, SkillGap, CareerRecommendation,
    ChatConversation, ChatMessage
)
from backend.schemas import (
    UserRegister, UserLogin, GoogleAuthRequest, UserLoginResponse, UserProfileCreate,
    UserProfileUpdate, UserProfileResponse, ResumeUpload,
    ResumeResponse, ResumeAnalysisResponse, SkillBase,
    SkillCreate, SkillResponse, UserSkillBase, UserSkillCreate,
    UserSkillResponse, SkillGapCreate, SkillGapResponse, SkillGapAnalyzeRequest,
    CareerRecommendationCreate, CareerRecommendationResponse, CareerRecommendationRequest,
    ChatMessageCreate, ChatMessageResponse, ChatConversationResponse
)
from backend.config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    GEMINI_API_KEY, GEMINI_MODEL, UPLOAD_DIR, GOOGLE_CLIENT_ID
)
from backend.ai import analyze_resume_file, build_fallback_analysis, detect_resume_sections

# Initialize database tables
init_db()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Career AI API",
    description="AI-powered career guidance and resume feedback chatbot",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 Scheme for Bearer Token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Authentication Helpers ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def authenticate_user(email: str, password: str, db: Session) -> Optional[User]:
    """Authenticate a user by email and password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if verify_password(password, user.hashed_password):
        return user
    return None

def create_access_token(subject: str = None, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES, **kwargs) -> str:
    """Create a JWT access token standardizing the user ID string in sub."""
    sub_val = str(kwargs.get("sub", subject))
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)
    to_encode = {"exp": expire, "sub": sub_val}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get the current authenticated user from JWT Bearer token."""
    if not token:
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    sub_val = payload.get("sub")
    if sub_val is None:
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = None
    try:
        user_id = int(sub_val)
        user = db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        pass

    if user is None:
        user = db.query(User).filter(User.email == str(sub_val)).first()

    if user is None:
        raise HTTPException(
            status_code=status_codes.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user


# --- Authentication Routes ---

@app.post("/api/auth/register", response_model=UserLoginResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    # Hash password
    hashed_pw = hash_password(user_data.password)
    
    # Create user
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create associated user profile
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()
    
    # Create access token with user ID
    access_token = create_access_token(subject=str(new_user.id))
    
    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email
    )

@app.post("/api/auth/login", response_model=UserLoginResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user."""
    user = authenticate_user(user_data.email, user_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=str(user.id))
    
    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )

@app.post("/api/auth/google", response_model=UserLoginResponse)
def google_auth(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register a user via Google OAuth."""
    email: Optional[str] = None
    name: Optional[str] = None

    # 1. Verify via Google ID token if provided
    if auth_data.credential:
        try:
            req_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={auth_data.credential}"
            req = urllib.request.Request(req_url, headers={"User-Agent": "CareerAI/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode())
                    email = payload.get("email")
                    name = payload.get("name")
        except Exception as e:
            logger.warning(f"Google ID token verification failed: {e}")

    # 2. Verify via Google access token if provided
    if not email and auth_data.access_token:
        try:
            req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {auth_data.access_token}", "User-Agent": "CareerAI/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode())
                    email = payload.get("email")
                    name = payload.get("name")
        except Exception as e:
            logger.warning(f"Google access token verification failed: {e}")

    # 3. Direct / demo Google identity fallback
    if not email and auth_data.email:
        clean_email = str(auth_data.email).strip().lower()
        if "@" in clean_email:
            email = clean_email
            name = auth_data.name or clean_email.split("@")[0].replace(".", " ").title()

    if not email:
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="Unable to verify Google credentials. Please try signing in again."
        )

    # Normalize email
    email = email.lower()

    # Look up existing user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        random_pw = secrets.token_urlsafe(32)
        hashed_pw = hash_password(random_pw)
        user = User(
            email=email,
            hashed_password=hashed_pw
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        user_profile = UserProfile(
            user_id=user.id,
            full_name=name or email.split("@")[0].title()
        )
        db.add(user_profile)
        db.commit()

    access_token = create_access_token(subject=str(user.id))

    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )

@app.get("/api/auth/me", response_model=UserProfileResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# --- Profile Routes ---

@app.get("/api/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@app.put("/api/profile", response_model=UserProfileResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    field_map = {
        "full_name": profile_data.full_name,
        "education": profile_data.education,
        "degree": profile_data.degree,
        "specialization": profile_data.specialization,
        "technical_skills": profile_data.technical_skills,
        "soft_skills": profile_data.soft_skills,
        "work_experience": profile_data.work_experience,
        "projects": profile_data.projects,
        "certifications": profile_data.certifications,
        "interests": profile_data.interests,
        "preferred_industries": profile_data.preferred_industries,
        "career_goals": profile_data.career_goals,
        "desired_job_roles": profile_data.desired_job_roles,
    }
    
    for field, value in field_map.items():
        if value is not None:
            setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile


# --- Resume Routes ---

def validate_file_type(filename: str) -> bool:
    """Validate that the file has an allowed extension."""
    allowed_extensions = {"pdf", "docx"}
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in allowed_extensions

@app.post("/api/resumes/upload", response_model=ResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a resume file and trigger analysis."""
    if not file.filename or not validate_file_type(file.filename):
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF and DOCX files are allowed."
        )
    
    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB."
        )
    
    if len(content) == 0:
        raise HTTPException(
            status_code=status_codes.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    
    # Save file permanently to uploads directory
    os.makedirs(str(UPLOAD_DIR), exist_ok=True)
    file_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "unknown"
    secure_filename = f"{uuid.uuid4().hex}.{file_ext}"
    saved_file_path = str(UPLOAD_DIR / secure_filename)
    
    with open(saved_file_path, "wb") as f:
        f.write(content)
    
    # Create resume record with valid file_path
    resume = Resume(
        user_id=current_user.id,
        filename=secure_filename,
        original_name=file.filename,
        file_path=saved_file_path,
        file_type=file_ext,
        file_size=len(content),
        status="processing"
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    # Analyze resume
    try:
        api_key = GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        analysis_result = analyze_resume_file(saved_file_path, api_key)
        
        analysis = ResumeAnalysis(
            user_id=current_user.id,
            resume_id=resume.id,
            overall_score=analysis_result.get("overall_score"),
            section_scores=analysis_result.get("section_scores"),
            detected_mistakes=analysis_result.get("detected_mistakes"),
            strengths=analysis_result.get("strengths"),
            weaknesses=analysis_result.get("weaknesses"),
            suggestions=analysis_result.get("suggestions"),
            improved_bullets=analysis_result.get("improved_bullets"),
            section_assessment=analysis_result.get("section_assessment"),
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Save individual resume issues
        mistakes = analysis_result.get("detected_mistakes", [])
        for mistake in mistakes:
            issue = ResumeIssue(
                analysis_id=analysis.id,
                category=mistake.get("category", "other"),
                message=mistake.get("message", ""),
                severity=mistake.get("severity", "medium"),
                suggestion=mistake.get("suggestion", "")
            )
            db.add(issue)
        
        resume.status = "processed"
        db.commit()
        db.refresh(resume)
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        resume.status = "error"
        db.commit()
    
    return resume

@app.get("/api/resumes/{resume_id}/analysis", response_model=ResumeAnalysisResponse)
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get resume analysis results."""
    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id,
        ResumeAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        # Check if the resume exists and belongs to the user
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
        if not resume:
            raise HTTPException(
                status_code=status_codes.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
        raise HTTPException(
            status_code=status_codes.HTTP_404_NOT_FOUND,
            detail="Analysis not yet ready or failed for this resume"
        )
    
    return analysis

@app.get("/api/analyses/history", response_model=List[ResumeAnalysisResponse])
def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis history for the user."""
    analyses = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == current_user.id
    ).order_by(ResumeAnalysis.created_at.desc()).all()
    return analyses


# --- Skill Routes ---

@app.get("/api/skills", response_model=List[SkillResponse])
def list_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's skills."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        return []
    
    user_skills = db.query(UserSkill).filter(UserSkill.profile_id == profile.id).all()
    skills = []
    for us in user_skills:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        if skill:
            skills.append({
                "id": skill.id,
                "name": skill.name,
                "category": skill.category,
                "proficiency": us.proficiency,
                "years_experience": us.years_experience
            })
    return skills

@app.post("/api/skills", response_model=SkillResponse)
def add_skill(
    skill_data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a skill to user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    skill = db.query(Skill).filter(Skill.name.ilike(skill_data.name)).first()
    if not skill:
        skill = Skill(name=skill_data.name, category=skill_data.category)
        db.add(skill)
        db.commit()
        db.refresh(skill)
    
    # Check if user already has this skill
    user_skill = db.query(UserSkill).filter(
        UserSkill.profile_id == profile.id,
        UserSkill.skill_id == skill.id
    ).first()
    
    if not user_skill:
        user_skill = UserSkill(
            profile_id=profile.id,
            skill_id=skill.id,
            proficiency="intermediate"
        )
        db.add(user_skill)
        db.commit()
    
    return skill


# --- Skill Gap Analysis Routes ---

ROLE_CORE_SKILLS = {
    "ai / machine learning engineer": ["python", "pytorch", "vector dbs", "rag pipelines", "docker", "system design", "fastapi"],
    "machine learning engineer": ["python", "pytorch", "vector dbs", "rag pipelines", "docker", "system design"],
    "senior full-stack engineer": ["react", "typescript", "python", "fastapi", "postgresql", "docker", "microservices", "ci/cd"],
    "full-stack engineer": ["react", "typescript", "python", "fastapi", "postgresql", "docker", "git"],
    "cloud solutions architect": ["aws", "gcp", "terraform", "kubernetes", "security architecture", "cost optimization", "docker"],
    "devops & platform engineer": ["docker", "kubernetes", "ci/cd", "linux", "aws", "terraform", "monitoring"],
    "devops engineer": ["docker", "kubernetes", "ci/cd", "linux", "aws", "terraform", "monitoring"],
    "frontend specialist": ["javascript", "react", "html/css", "typescript", "responsive design", "tailwind", "performance", "git"],
    "frontend developer": ["javascript", "react", "html/css", "typescript", "responsive design", "tailwind", "git"],
    "data engineer": ["python", "sql", "spark", "kafka", "postgresql", "data pipelines", "airflow"],
    "data scientist": ["python", "statistics", "machine learning", "sql", "pandas", "data visualization", "scikit-learn"],
    "backend developer": ["python", "fastapi", "sql", "postgresql", "docker", "apis", "system design", "git"],
    "software engineer": ["python", "javascript", "git", "sql", "docker", "api design", "testing", "algorithms"],
    "product manager": ["product strategy", "roadmap planning", "user research", "agile", "analytics", "stakeholder management"]
}

@app.post("/api/skill-gaps/analyze", response_model=List[SkillGapResponse])
def analyze_skill_gaps(
    target_role: Optional[str] = Query(None),
    body_data: Optional[SkillGapAnalyzeRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze skill gaps for a target role dynamically."""
    role = target_role or (body_data.target_role if body_data else None) or "Software Engineer"
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    user_skills = set()
    # From technical_skills list in profile
    if profile.technical_skills and isinstance(profile.technical_skills, list):
        for s in profile.technical_skills:
            if isinstance(s, str):
                user_skills.add(s.strip().lower())
    
    # From user_skills table
    db_skills = db.query(UserSkill).filter(UserSkill.profile_id == profile.id).all()
    for us in db_skills:
        sk = db.query(Skill).filter(Skill.id == us.skill_id).first()
        if sk:
            user_skills.add(sk.name.lower())
    
    # Determine role requirement
    role_lower = role.lower()
    required_skills = []
    for r_key, skills in ROLE_CORE_SKILLS.items():
        if r_key in role_lower or any(part in role_lower for part in r_key.split()):
            required_skills.extend(skills)
            break
    if not required_skills:
        required_skills = ["core fundamentals", "git", "problem solving", "communication", "domain tools"]

    gaps = []
    for skill in required_skills:
        has_skill = any(skill in u_skill or u_skill in skill for u_skill in user_skills)
        if has_skill:
            gaps.append({
                "skill_name": skill.title(),
                "current_status": "possessed",
                "gap_description": f"Verified in your profile skills",
                "priority": "low",
                "recommended_learning": "Advanced project application & system architecture"
            })
        else:
            gaps.append({
                "skill_name": skill.title(),
                "current_status": "missing",
                "gap_description": f"Key requirement for {role} but not found in profile",
                "priority": "high",
                "recommended_learning": f"Foundational course or hands-on implementation project in {skill.title()}"
            })

    saved_gaps = []
    for gap in gaps:
        existing = db.query(SkillGap).filter(
            SkillGap.profile_id == profile.id,
            SkillGap.target_role == role,
            SkillGap.skill_name == gap["skill_name"]
        ).first()
        
        if not existing:
            rec = SkillGap(
                profile_id=profile.id,
                target_role=role,
                skill_name=gap["skill_name"],
                current_status=gap["current_status"],
                gap_description=gap["gap_description"],
                priority=gap["priority"],
                recommended_learning=gap["recommended_learning"]
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
        else:
            rec = existing

        saved_gaps.append(rec)
        
    return saved_gaps

@app.get("/api/skill-gaps", response_model=List[SkillGapResponse])
def get_user_skill_gaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved skill gaps for current user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return db.query(SkillGap).filter(SkillGap.profile_id == profile.id).all()


# --- Career Recommendation Routes ---

def generate_personalized_recommendation(target_role: str, profile: UserProfile, db: Session) -> Dict[str, Any]:
    """Generate dynamic career recommendation combining user profile and AI/deterministic logic."""
    target_role = target_role or "Software Engineer"
    role_lower = target_role.lower()

    # Extract user's technical skills
    user_skills = []
    if profile.technical_skills and isinstance(profile.technical_skills, list):
        user_skills.extend([s.strip().lower() for s in profile.technical_skills if isinstance(s, str)])
    
    db_skills = db.query(UserSkill).filter(UserSkill.profile_id == profile.id).all()
    for us in db_skills:
        sk = db.query(Skill).filter(Skill.id == us.skill_id).first()
        if sk:
            user_skills.append(sk.name.lower())
    user_skills = list(set(user_skills))

    # Check for recent resume analysis
    recent_analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == profile.user_id).order_by(ResumeAnalysis.created_at.desc()).first()

    # Required skills for role
    required = []
    for r_key, skills in ROLE_CORE_SKILLS.items():
        if r_key in role_lower or any(part in role_lower for part in r_key.split()):
            required = skills
            break
    if not required:
        required = ["core development", "git", "testing", "cloud platforms", "system design"]

    if not user_skills:
        return {
            "match_percentage": 0.0,
            "reason": f"No skills registered in your profile. Add your technical skills in your Profile to calculate an accurate role match score for {target_role}.",
            "existing_skills": [],
            "missing_skills": [m.title() for m in required],
            "learning_priorities": [f"Learn {m.title()}" for m in required[:3]],
            "project_suggestions": [
                f"Build a foundational project targeting {target_role} skills like {required[0]}"
            ],
            "next_steps": "Navigate to the Profile page to add your verified technical skills, then re-run recommendation analysis."
        }

    matched = [s for s in required if any(s in u or u in s for u in user_skills)]
    missing = [s for s in required if s not in matched]

    overlap_ratio = len(matched) / max(1, len(required))
    match_percentage = round(min(95.0, max(10.0, overlap_ratio * 90.0)), 1)
    
    reason = (
        f"Based on your profile with {len(user_skills)} registered skills "
        f"({', '.join(user_skills[:4]) if user_skills else 'general technical background'}), "
        f"you demonstrate {len(matched)} of {len(required)} primary competencies for {target_role}."
    )
    if recent_analysis and recent_analysis.overall_score:
        reason += f" Your resume reflects an indicative quality score of {recent_analysis.overall_score}/100."

    return {
        "match_percentage": match_percentage,
        "reason": reason,
        "existing_skills": [m.title() for m in matched],
        "missing_skills": [m.title() for m in missing] if missing else ["Advanced System Architecture"],
        "learning_priorities": [f"Deep dive into {m.title()}" for m in missing[:3]] if missing else ["Portfolio optimization", "Mock technical interviews"],
        "project_suggestions": [
            f"Build an end-to-end {target_role} project featuring {missing[0] if missing else 'production CI/CD'}",
            f"Design an open-source tool demonstrating clean code in {matched[0] if matched else 'core languages'}"
        ],
        "next_steps": f"Work through the missing skills priority list, update your resume with quantifiable metrics, and practice domain interviews."
    }

@app.post("/api/career/recommendations", response_model=CareerRecommendationResponse)
def create_career_recommendation(
    target_role: Optional[str] = Query(None),
    body_data: Optional[CareerRecommendationRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and save career recommendations for a target role."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    role = target_role or (body_data.target_role if body_data else None) or "Software Engineer"
    rec_data = generate_personalized_recommendation(role, profile, db)
    
    rec = CareerRecommendation(
        profile_id=profile.id,
        target_role=role,
        match_percentage=rec_data.get("match_percentage"),
        reason=rec_data.get("reason"),
        existing_skills=rec_data.get("existing_skills"),
        missing_skills=rec_data.get("missing_skills"),
        learning_priorities=rec_data.get("learning_priorities"),
        project_suggestions=rec_data.get("project_suggestions"),
        next_steps=rec_data.get("next_steps")
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@app.get("/api/career/recommendations", response_model=List[CareerRecommendationResponse])
def get_career_recommendations(
    target_role: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get career recommendations for user, creating a new recommendation if requested."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    if target_role:
        # Check if recent recommendation exists for this role
        existing = db.query(CareerRecommendation).filter(
            CareerRecommendation.profile_id == profile.id,
            CareerRecommendation.target_role.ilike(f"%{target_role}%")
        ).order_by(CareerRecommendation.created_at.desc()).first()
        
        if existing:
            return [existing]
        
        # Generate new one
        new_rec = create_career_recommendation(target_role=target_role, current_user=current_user, db=db)
        return [new_rec]

    # Return existing recommendations or generate default
    all_recs = db.query(CareerRecommendation).filter(
        CareerRecommendation.profile_id == profile.id
    ).order_by(CareerRecommendation.created_at.desc()).all()
    
    if not all_recs:
        default_role = "Software Engineer"
        if profile.desired_job_roles and isinstance(profile.desired_job_roles, list) and len(profile.desired_job_roles) > 0:
            default_role = profile.desired_job_roles[0]
        gen = create_career_recommendation(target_role=default_role, current_user=current_user, db=db)
        return [gen]

    return all_recs


# --- Chat Routes ---

@app.get("/api/chat/conversations", response_model=List[ChatConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all chat conversations for the current user."""
    conversations = db.query(ChatConversation).filter(
        ChatConversation.user_id == current_user.id
    ).order_by(ChatConversation.created_at.desc()).all()
    
    results = []
    for conv in conversations:
        msg_count = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).count()
        results.append(ChatConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title or "Conversation",
            created_at=conv.created_at,
            message_count=msg_count
        ))
    return results

@app.post("/api/chat/conversations", response_model=ChatConversationResponse)
def create_chat_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat conversation."""
    conversation = ChatConversation(user_id=current_user.id, title="New Conversation")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return ChatConversationResponse(
        id=conversation.id,
        user_id=current_user.id,
        title=conversation.title,
        created_at=conversation.created_at,
        message_count=0
    )

@app.get("/api/chat/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get message history for a conversation."""
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(
            status_code=status_codes.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).order_by(ChatMessage.timestamp.asc()).all()

@app.post("/api/chat/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
def send_message(
    conversation_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation and receive an advisor reply."""
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status_codes.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Save user message
    user_message = ChatMessage(
        conversation_id=conversation_id,
        role="user",
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Generate AI response
    ai_reply_text = generate_ai_chat_reply(conversation_id, message_data.content, current_user, db)
    
    # Save assistant message
    ai_message = ChatMessage(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_reply_text
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    # Update title from first message
    if conversation.title in ("New Conversation", "New conversation"):
        title_snippet = message_data.content[:45] + "..." if len(message_data.content) > 45 else message_data.content
        conversation.title = title_snippet
        db.commit()
        
    return ai_message

def generate_ai_chat_reply(
    conversation_id: int,
    user_message: str,
    current_user: User,
    db: Session
) -> str:
    """Generate contextual career advice using Gemini or fallback."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    recent_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
    analysis = None
    if recent_resume:
        analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == recent_resume.id).first()
        
    skill_gaps = []
    if profile:
        skill_gaps = db.query(SkillGap).filter(SkillGap.profile_id == profile.id).limit(3).all()
        
    # Get last 4 messages for multi-turn history
    prior_messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id,
        ChatMessage.content != user_message
    ).order_by(ChatMessage.timestamp.desc()).limit(4).all()
    prior_messages.reverse()

    # Assemble contextual prompt
    context_lines = []
    if profile:
        if profile.full_name:
            context_lines.append(f"Candidate Name: {profile.full_name}")
        if profile.degree:
            context_lines.append(f"Education: {profile.degree} in {profile.specialization or 'general studies'}")
        if profile.technical_skills:
            context_lines.append(f"Technical Skills: {', '.join(profile.technical_skills if isinstance(profile.technical_skills, list) else [str(profile.technical_skills)])}")
        if profile.desired_job_roles:
            context_lines.append(f"Target Roles: {', '.join(profile.desired_job_roles if isinstance(profile.desired_job_roles, list) else [str(profile.desired_job_roles)])}")

    if analysis and analysis.overall_score:
        context_lines.append(f"Resume Overall Score: {analysis.overall_score}/100")
        if analysis.strengths:
            context_lines.append(f"Resume Strengths: {analysis.strengths}")
        if analysis.weaknesses:
            context_lines.append(f"Resume Areas to Improve: {analysis.weaknesses}")

    if skill_gaps:
        gaps_str = ", ".join([f"{g.skill_name} ({g.current_status})" for g in skill_gaps])
        context_lines.append(f"Identified Skill Gaps: {gaps_str}")

    history_lines = []
    for pm in prior_messages:
        history_lines.append(f"{pm.role.title()}: {pm.content}")

    prompt = f"""You are Career AI, an empathetic, highly knowledgeable senior career advisor and technical coach.

Candidate Profile & Context:
{chr(10).join(context_lines) if context_lines else 'No profile information provided yet.'}

Recent Conversation History:
{chr(10).join(history_lines) if history_lines else 'None'}

User Message:
{user_message}

Guidelines:
1. Provide practical, actionable, personalized career guidance.
2. If the user asks about their resume, reference their actual score and feedback where applicable.
3. Keep the answer concise, encouraging, and focused (2-3 paragraphs maximum).
4. Never invent qualifications or experience not present in the profile.
5. Provide text only without raw Markdown code blocks."""

    # Try calling Gemini
    if GEMINI_API_KEY:
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL or 'gemini-flash-latest'}:generateContent?key={GEMINI_API_KEY}"
            resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=6.0)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                if text:
                    return text.strip()
        except Exception as e:
            logger.warning(f"Gemini API call failed in chat: {e}. Using intelligent fallback.")

    # Fallback response
    return fallback_chat_response(user_message, profile, analysis)

def fallback_chat_response(user_message: str, profile: Optional[UserProfile], analysis: Optional[ResumeAnalysis]) -> str:
    """Intelligent deterministic response when AI API is unavailable."""
    msg = user_message.lower()
    
    if any(k in msg for k in ["resume", "score", "feedback", "cv"]):
        if analysis and analysis.overall_score:
            return (
                f"Your latest uploaded resume received an overall score of {analysis.overall_score}/100. "
                f"Key strengths noted: {analysis.strengths or 'Good structure'}. "
                f"Areas to improve: {analysis.weaknesses or 'Expand on quantifiable achievements'}. "
                f"Would you like advice on tailoring your resume for a specific job title?"
            )
        return (
            "You haven't uploaded a resume yet, or analysis is still in progress. "
            "Head to the Resume Upload page to get your ATS compatibility and section-by-section breakdown!"
        )
    
    if any(k in msg for k in ["skill", "gap", "learn", "study"]):
        if profile and profile.technical_skills:
            skills = ", ".join(profile.technical_skills if isinstance(profile.technical_skills, list) else [str(profile.technical_skills)])
            return (
                f"You currently have these skills in your profile: {skills}. "
                f"To accelerate your career growth, I recommend focusing on building portfolio projects that combine these skills "
                f"with automated testing and cloud deployments."
            )
        return (
            "To get tailored skill recommendations, complete your profile with your current skills and target job roles. "
            "What specific technology or field are you interested in mastering?"
        )

    if any(k in msg for k in ["interview", "questions", "prepare"]):
        return (
            "For interview preparation, focus on the STAR method (Situation, Task, Action, Result) for behavioral questions. "
            "For technical questions, practice articulating your problem-solving process out loud. "
            "What type of role are you interviewing for?"
        )

    name = profile.full_name if profile and profile.full_name else "there"
    return (
        f"Hello {name}! I am your Career AI advisor. I can help you evaluate your resume, identify skill gaps for your dream jobs, "
        f"and prepare for upcoming interviews. What would you like to work on today?"
    )


# --- Health Check ---

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Career AI API is running"}


# --- Startup Event ---

@app.on_event("startup")
async def startup():
    """Run on startup."""
    logger.info("Career AI API started successfully.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
