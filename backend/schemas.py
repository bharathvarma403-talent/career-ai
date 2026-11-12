from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    access_token: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class UserProfileCreate(BaseModel):
    full_name: Optional[str] = None
    education: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    technical_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    interests: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    career_goals: Optional[str] = None
    desired_job_roles: Optional[List[str]] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    education: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    technical_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    interests: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    career_goals: Optional[str] = None
    desired_job_roles: Optional[List[str]] = None


class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    education: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    technical_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    interests: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    career_goals: Optional[str] = None
    desired_job_roles: Optional[List[str]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Resume schemas
class ResumeUpload(BaseModel):
    filename: str
    original_name: str
    file_type: str
    file_size: int


class ResumeCreate(BaseModel):
    filename: str
    original_name: str
    file_type: str
    file_size: int


class ResumeResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_type: str
    file_size: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeAnalysisResponse(BaseModel):
    id: int
    overall_score: Optional[float] = None
    section_scores: Optional[Dict[str, float]] = None
    detected_mistakes: Optional[List[Dict[str, Any]]] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    improved_bullets: Optional[List[Dict[str, Any]]] = None
    section_assessment: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Skill schemas
class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int

    class Config:
        from_attributes = True


class UserSkillBase(BaseModel):
    proficiency: Optional[str] = None
    years_experience: Optional[int] = None


class UserSkillCreate(UserSkillBase):
    skill_id: int


class UserSkillResponse(UserSkillBase):
    id: int
    skill_id: int
    profile_id: int

    class Config:
        from_attributes = True


# Skill gap schemas
class SkillGapAnalyzeRequest(BaseModel):
    target_role: Optional[str] = "Software Engineer"


class SkillGapCreate(BaseModel):
    target_role: str
    skill_name: str
    current_status: str  # possessed, partial, missing, not_demonstrated
    gap_description: Optional[str] = None
    priority: Optional[str] = None  # high, medium, low
    recommended_learning: Optional[str] = None


class SkillGapResponse(SkillGapCreate):
    id: int
    profile_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Career recommendation schemas
class CareerRecommendationRequest(BaseModel):
    target_role: Optional[str] = "Software Engineer"


class CareerRecommendationCreate(BaseModel):
    target_role: str
    match_percentage: Optional[float] = None
    reason: Optional[str] = None
    existing_skills: Optional[List[str]] = None
    missing_skills: Optional[List[str]] = None
    learning_priorities: Optional[List[str]] = None
    project_suggestions: Optional[List[str]] = None
    next_steps: Optional[str] = None


class CareerRecommendationResponse(CareerRecommendationCreate):
    id: int
    profile_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Chat schemas
class ChatMessageCreate(BaseModel):
    role: str  # user or assistant
    content: str


class ChatMessageResponse(ChatMessageCreate):
    id: int
    conversation_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatConversationCreate(BaseModel):
    pass


class ChatConversationResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True