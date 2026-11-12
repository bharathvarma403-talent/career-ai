from datetime import datetime
from backend.database import Base
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Float
)
from sqlalchemy.orm import relationship


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    """User profile containing education, skills, experience, etc."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Personal information
    full_name = Column(String(255))
    education = Column(Text)  # JSON or serialized
    degree = Column(String(255))
    specialization = Column(String(255))
    current_skills = Column(Text)  # JSON or serialized
    technical_skills = Column(JSON)  # JSON
    soft_skills = Column(JSON)  # JSON
    work_experience = Column(JSON)  # JSON
    projects = Column(JSON)  # JSON
    certifications = Column(JSON)  # JSON
    interests = Column(JSON)  # JSON
    preferred_industries = Column(JSON)  # JSON
    career_goals = Column(Text)
    desired_job_roles = Column(JSON)  # JSON

    # Relationships
    user = relationship("User", back_populates="profile")
    skills = relationship("UserSkill", back_populates="profile", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", cascade="all, delete-orphan", primaryjoin="UserProfile.id == SkillGap.profile_id")
    career_recommendations = relationship("CareerRecommendation", cascade="all, delete-orphan", primaryjoin="UserProfile.id == CareerRecommendation.profile_id")


class Resume(Base):
    """Uploaded resume document."""
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True, default="")
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer)
    status = Column(String(50), default="pending") # pending, processed, error
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="resumes")
    analysis = relationship("ResumeAnalysis", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class ResumeAnalysis(Base):
    """Analysis results for a resume."""
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    overall_score = Column(Float, nullable=True)
    section_scores = Column(JSON, nullable=True)  # Dict of section -> score

    # AI-generated results
    detected_mistakes = Column(JSON, nullable=True)  # List of detected issues
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    improved_bullets = Column(JSON, nullable=True)  # List of improved bullet points
    section_assessment = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analysis")


class ResumeIssue(Base):
    """Individual issue found in a resume analysis."""
    __tablename__ = "resume_issues"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("resume_analyses.id"), nullable=False)
    category = Column(String(100), nullable=False)  # grammar, spelling, formatting, etc.
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high
    location = Column(String(255), nullable=True)  # section or line reference
    suggestion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    analysis = relationship("ResumeAnalysis", back_populates="issues")


# Extend ResumeAnalysis to have back_populates for issues
ResumeAnalysis.issues = relationship("ResumeIssue", order_by=ResumeIssue.id, back_populates="analysis", cascade="all, delete-orphan")


class Skill(Base):
    """Generic skill definitions."""
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    category = Column(String(100), nullable=True)  # technical, soft, tool, etc.
    description = Column(Text, nullable=True)


class UserSkill(Base):
    """User's claimed skills with proficiency levels."""
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    proficiency = Column(String(50), nullable=True)  # beginner, intermediate, advanced, expert
    years_experience = Column(Integer, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", back_populates="skills")
    skill = relationship("Skill")


class SkillGap(Base):
    """Record of a skill gap for a user targeting a specific role."""
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    target_role = Column(String(255), nullable=False)
    skill_name = Column(String(255), nullable=False)
    current_status = Column(String(50), nullable=False)  # possessed, partial, missing, not_demonstrated
    gap_description = Column(Text, nullable=True)
    priority = Column(String(50), nullable=True)  # high, medium, low
    recommended_learning = Column(Text, nullable=True)  # resources, courses, etc.
    created_at = Column(DateTime, default=datetime.utcnow)


class CareerRecommendation(Base):
    """Career recommendation for a user."""
    __tablename__ = "career_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    target_role = Column(String(255), nullable=False)
    match_percentage = Column(Float, nullable=True)
    reason = Column(Text, nullable=True)
    existing_skills = Column(JSON, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    learning_priorities = Column(JSON, nullable=True)
    project_suggestions = Column(JSON, nullable=True)
    next_steps = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatConversation(Base):
    """Chat conversation history."""
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)  # Auto-generated or last topic
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_conversations")
    messages = relationship("ChatMessage", order_by="ChatMessage.timestamp", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Individual chat message."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")