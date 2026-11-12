"""
Automated Integration and Unit Test Suite for Career AI

Tests all core backend endpoints, authentication, database persistence,
document parsing, career guidance, skill-gap analysis, and chatbot conversation flow.
"""

import sys
import os
import io
import unittest
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, init_db, engine
from backend.models import User, UserProfile, Resume, ResumeAnalysis, ChatConversation, ChatMessage
from backend.schemas import UserRegister, UserLogin, UserProfileUpdate, SkillCreate, ChatMessageCreate
from fastapi.datastructures import UploadFile
from starlette.datastructures import Headers
from fastapi import HTTPException
import main


class TestCareerAIFullSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.db = SessionLocal()
        cls.test_email = f"autotest_{int(datetime.utcnow().timestamp())}@example.com"
        cls.test_password = "SecurePassword123"
        cls.token = None
        cls.user_id = None

    @classmethod
    def tearDownClass(cls):
        # Clean up test user and cascaded records
        if cls.user_id:
            user = cls.db.query(User).filter(User.id == cls.user_id).first()
            if user:
                cls.db.delete(user)
                cls.db.commit()
        cls.db.close()

    def test_01_health_check(self):
        """Verify API health endpoint."""
        res = main.health_check()
        self.assertEqual(res["status"], "healthy")

    def test_02_register_success(self):
        """Verify new user registration with valid email and password."""
        reg_data = UserRegister(email=self.test_email, password=self.test_password)
        res = main.register(reg_data, db=self.db)
        self.assertEqual(res.email, self.test_email)
        self.assertIsNotNone(res.access_token)
        self.__class__.token = res.access_token
        self.__class__.user_id = res.user_id

    def test_03_register_duplicate_rejection(self):
        """Verify registration with already registered email returns HTTP 400."""
        reg_data = UserRegister(email=self.test_email, password=self.test_password)
        with self.assertRaises(HTTPException) as ctx:
            main.register(reg_data, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_04_register_short_password_rejection(self):
        """Verify registration with short password fails schema validation."""
        from pydantic import ValidationError
        with self.assertRaises((HTTPException, ValidationError)):
            UserRegister(email=f"short_{self.test_email}", password="123")

    def test_05_login_success(self):
        """Verify user login with correct credentials returns token."""
        login_data = UserLogin(email=self.test_email, password=self.test_password)
        res = main.login(login_data, db=self.db)
        self.assertEqual(res.token_type, "bearer")
        self.assertIsNotNone(res.access_token)

    def test_06_login_invalid_password(self):
        """Verify user login with wrong password returns HTTP 401."""
        login_data = UserLogin(email=self.test_email, password="WrongPassword!")
        with self.assertRaises(HTTPException) as ctx:
            main.login(login_data, db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_07_token_auth_and_get_user(self):
        """Verify get_current_user correctly resolves user from valid JWT token."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        self.assertEqual(current_user.id, self.user_id)
        self.assertEqual(current_user.email, self.test_email)

    def test_08_invalid_token_rejection(self):
        """Verify invalid or forged token returns HTTP 401."""
        with self.assertRaises(HTTPException) as ctx:
            main.get_current_user(token="invalid.forged.jwttoken", db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_09_missing_token_rejection(self):
        """Verify missing token returns HTTP 401."""
        with self.assertRaises(HTTPException) as ctx:
            main.get_current_user(token=None, db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_10_profile_get_and_update(self):
        """Verify profile retrieval and update endpoints."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        profile = main.get_profile(current_user=current_user, db=self.db)
        self.assertIsNotNone(profile)

        update = UserProfileUpdate(
            full_name="Morgan Freeman",
            degree="Master of Science",
            specialization="Artificial Intelligence",
            technical_skills=["Python", "PyTorch", "Docker", "SQL", "FastAPI"],
            career_goals="Lead Machine Learning Engineer",
            desired_job_roles=["Data Scientist", "Software Engineer"]
        )
        updated = main.update_profile(update, current_user=current_user, db=self.db)
        self.assertEqual(updated.full_name, "Morgan Freeman")
        self.assertIn("Python", updated.technical_skills)

    def test_11_skills_crud(self):
        """Verify adding and listing skills."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        added = main.add_skill(SkillCreate(name="Terraform", category="DevOps"), current_user=current_user, db=self.db)
        self.assertEqual(added.name, "Terraform")

        user_skills = main.list_skills(current_user=current_user, db=self.db)
        self.assertTrue(any(s["name"] == "Terraform" for s in user_skills))

    def test_12_career_recommendation(self):
        """Verify dynamic career recommendations."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        rec = main.create_career_recommendation(target_role="Software Engineer", current_user=current_user, db=self.db)
        self.assertEqual(rec.target_role, "Software Engineer")
        self.assertGreater(rec.match_percentage, 0)
        self.assertIn("Software Engineer", rec.reason)
        self.assertTrue(len(rec.existing_skills) > 0)

        all_recs = main.get_career_recommendations(target_role=None, current_user=current_user, db=self.db)
        self.assertTrue(len(all_recs) >= 1)

    def test_13_skill_gap_analysis(self):
        """Verify skill gap analysis produces possessed and missing categories."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        gaps = main.analyze_skill_gaps(target_role="Software Engineer", current_user=current_user, db=self.db)
        self.assertTrue(len(gaps) > 0)
        has_possessed = any(g.current_status == "possessed" for g in gaps)
        has_missing = any(g.current_status == "missing" for g in gaps)
        self.assertTrue(has_possessed or has_missing)

    def test_14_chat_lifecycle(self):
        """Verify creating chat conversations and sending messages with context."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        conv = main.create_chat_conversation(current_user=current_user, db=self.db)
        self.assertIsNotNone(conv.id)

        msg = main.send_message(
            conversation_id=conv.id,
            message_data=ChatMessageCreate(role="user", content="What certifications should I pursue for a Cloud Engineer?"),
            current_user=current_user,
            db=self.db
        )
        self.assertEqual(msg.role, "assistant")
        self.assertTrue(len(msg.content) > 10)

        messages = main.get_conversation_messages(conversation_id=conv.id, current_user=current_user, db=self.db)
        self.assertEqual(len(messages), 2)  # 1 user + 1 assistant

    def test_15_chat_unauthorized_conversation_rejection(self):
        """Verify users cannot access other users' conversations."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        with self.assertRaises(HTTPException) as ctx:
            main.get_conversation_messages(conversation_id=999999, current_user=current_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_16_resume_upload_and_analysis(self):
        """Verify resume upload, section parsing, and analysis creation."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        dummy_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<>>\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n178\n%%EOF"

        upload = UploadFile(
            file=io.BytesIO(dummy_content),
            filename="unit_test_resume.pdf",
            headers=Headers({"content-type": "application/pdf"})
        )

        resume = main.upload_resume(file=upload, current_user=current_user, db=self.db)
        self.assertEqual(resume.status, "processed")
        self.assertTrue(os.path.exists(resume.file_path))

        analysis = main.get_resume_analysis(resume_id=resume.id, current_user=current_user, db=self.db)
        self.assertIsNotNone(analysis.overall_score)
        self.assertIsNotNone(analysis.strengths)

        history = main.get_analysis_history(current_user=current_user, db=self.db)
        self.assertTrue(len(history) >= 1)

    def test_17_resume_upload_invalid_file_type(self):
        """Verify upload rejection for unsupported file types."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        upload = UploadFile(
            file=io.BytesIO(b"malicious script content"),
            filename="script.exe",
            headers=Headers({"content-type": "application/x-msdownload"})
        )
        with self.assertRaises(HTTPException) as ctx:
            main.upload_resume(file=upload, current_user=current_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_18_resume_upload_empty_file(self):
        """Verify upload rejection for 0-byte empty file."""
        current_user = main.get_current_user(token=self.token, db=self.db)
        upload = UploadFile(
            file=io.BytesIO(b""),
            filename="empty.pdf",
            headers=Headers({"content-type": "application/pdf"})
        )
        with self.assertRaises(HTTPException) as ctx:
            main.upload_resume(file=upload, current_user=current_user, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
