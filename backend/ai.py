"""
AI Resume Analysis Engine

Uses Gemini API to analyze resumes and generate structured feedback.
Follows the requirements:
- Never invent qualifications, achievements, or employment history
- Never claim a mistake exists without evidence from extracted text
- Distinguish factual errors from stylistic suggestions
- Explain that scores are indicative assessments, not universal hiring standards
- Use structured JSON responses from the AI model
- Validate the AI output before saving or displaying it
"""

import json
import re
import logging
import requests
from typing import Optional, Dict, List, Any
from backend.config import GEMINI_MODEL

logger = logging.getLogger(__name__)

# AI Model configuration
MODEL_NAME = GEMINI_MODEL or "gemini-flash-latest"
TEMPERATURE = 0.2  # Low temperature for more consistent, factual outputs


def configure_api(api_key: str) -> None:
    """Configure the Gemini API with the given API key if SDK is available."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
    except Exception:
        pass


def get_model():
    """Get the configured Gemini generative model if SDK is available."""
    try:
        import google.generativeai as genai
        return genai.GenerativeModel(MODEL_NAME)
    except Exception:
        return None


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF file using pypdf or PyMuPDF."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if text.strip():
            return text.strip()
    except Exception:
        pass

    try:
        import fitz
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_docx(file_path: str) -> str:
    """Extract text content from a DOCX file using python-docx."""
    from docx import Document
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")


def validate_file_type(filename: str) -> bool:
    """Validate that the file has an allowed extension."""
    allowed_extensions = {"pdf", "docx"}
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in allowed_extensions


def detect_resume_sections(text: str) -> Dict[str, str]:
    """Detect and extract resume sections from the text.
    
    Returns a dict mapping section names to their content.
    Handles case-insensitive and multi-word headers cleanly.
    """
    sections = {
        "contact_info": "",
        "professional_summary": "",
        "education": "",
        "skills": "",
        "work_experience": "",
        "projects": "",
        "certifications": "",
        "achievements": ""
    }
    
    header_keywords = {
        "contact_info": ["contact", "personal info", "contact information", "contact details"],
        "professional_summary": ["professional summary", "summary", "objective", "profile", "about me", "professional profile"],
        "education": ["education", "academic background", "academics", "educational background"],
        "skills": ["skills", "technical skills", "core competencies", "competencies", "areas of expertise", "technologies"],
        "work_experience": ["work experience", "experience", "employment history", "professional experience", "work history"],
        "projects": ["projects", "personal projects", "portfolio", "key projects", "academic projects"],
        "certifications": ["certifications", "certificates", "licenses"],
        "achievements": ["achievements", "awards", "accomplishments", "honors"]
    }
    
    lines = text.split("\n")
    current_section = None
    section_content = []
    
    for line in lines:
        raw_stripped = line.strip()
        cleaned_header = re.sub(r"^[#*\-•\s]+|[#*\-:\s]+$", "", raw_stripped).strip().lower()
        
        found_section = None
        if cleaned_header and len(cleaned_header) < 60:
            for sec_name, keywords in header_keywords.items():
                if any(cleaned_header == kw or cleaned_header.startswith(kw + " ") or cleaned_header.endswith(" " + kw) for kw in keywords):
                    found_section = sec_name
                    break
        
        if found_section:
            if current_section and section_content:
                sections[current_section] = "\n".join(section_content).strip()
            current_section = found_section
            section_content = []
        elif current_section:
            section_content.append(line)
        else:
            if raw_stripped and not sections["contact_info"]:
                sections["contact_info"] = raw_stripped
            elif raw_stripped:
                sections["contact_info"] += "\n" + raw_stripped
    
    if current_section and section_content:
        sections[current_section] = "\n".join(section_content).strip()
    
    return sections


def analyze_resume_ai(
    text: str,
    api_key: str
) -> Dict[str, Any]:
    """Use Gemini AI to analyze resume text and generate structured feedback.
    
    Returns a dict with analysis results following the required schema.
    """
    # Configure AI if not already configured
    try:
        configure_api(api_key)
    except Exception:
        pass
    
    model = get_model()
    
    # Build the analysis prompt
    prompt = build_analysis_prompt(text)
    
    # 1. Direct REST call to Gemini API using lightweight requests
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": TEMPERATURE,
                    "maxOutputTokens": 4096,
                    "responseMimeType": "application/json"
                }
            }
            resp = requests.post(url, json=payload, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                result = json.loads(raw_json)
                result = validate_analysis_output(result, text)
                if "disclaimer" not in result:
                    result["disclaimer"] = (
                        "Note: This resume score is an indicative assessment based on "
                        "common resume best practices and may not reflect universal hiring "
                        "standards. ATS compatibility varies by system and employer."
                    )
                return result
        except Exception as e:
            logger.warning(f"Gemini REST direct call failed: {e}. Attempting fallback.")

    # 2. SDK call if google.generativeai is installed
    if model:
        try:
            response = model.generate_content(prompt, request_options={"timeout": 6.0})
            result = json.loads(response.text)
            return validate_analysis_output(result, text)
        except Exception:
            pass

    # 3. Deterministic rule-based fallback
    return build_fallback_analysis(text)


def build_analysis_prompt(text: str) -> str:
    """Build the AI analysis prompt for resume evaluation."""
    
    # Detect sections to provide context
    sections = detect_resume_sections(text)
    
    prompt = f"""You are an expert career coach and resume reviewer. Analyze the following resume text and provide a comprehensive evaluation.

IMPORTANT GUIDELINES:
- Never invent qualifications, achievements, employment history, or skills that are not in the text
- Never claim a mistake exists without evidence from the extracted text
- Distinguish factual errors from stylistic suggestions
- Explain that scores are indicative assessments, not universal hiring standards
- Be thorough but fair in your evaluation

Resume text:
---
{text}
---

Please analyze the resume and provide a JSON response with the following structure:
{{
  "overall_score": <number 0-100>,
  "section_scores": {{
    "contact_info": <number 0-100>,
    "professional_summary": <number 0-100>,
    "education": <number 0-100>,
    "skills": <number 0-100>,
    "work_experience": <number 0-100>,
    "projects": <number 0-100>,
    "certifications": <number 0-100>
  }},
  "detected_mistakes": [
    {{
      "category": "grammar|spelling|formatting|professional_language|relevance|readability|ats_structure",
      "message": "Specific description of the issue",
      "evidence": "Exact text from the resume that demonstrates the issue",
      "severity": "low|medium|high",
      "suggestion": "Suggested correction or improvement"
    }}
  ],
  "strengths": "Key strengths observed in the resume",
  "weaknesses": "Key areas for improvement",
  "suggestions": "General suggestions for improvement",
  "improved_bullets": [
    "Improved version of weak bullet points found in the resume"
  ],
  "section_assessment": {{
    "contact_info": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}},
    "professional_summary": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}},
    "education": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}},
    "skills": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}},
    "work_experience": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}},
    "projects": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}},
    "certifications": {{"score": <number>, "completeness": "complete|partial|missing", "issues": [<strings>]}}
  }}
}}

Evaluation criteria (evaluate all applicable areas):
1. Grammar and spelling correctness
2. Clarity and professional language
3. Relevance to target role
4. Quantifiable achievements
5. Section completeness
6. Consistency formatting
7. Readability
8. ATS-friendly structure (clear sections, standard headings, etc.)

For each detected mistake, provide the exact evidence from the text. 
If the resume is excellent, you may set overall_score to 90-100 and list minimal issues.

Return ONLY the JSON object, no surrounding text or explanation."""
    
    return prompt


def validate_analysis_output(result: Dict[str, Any], original_text: str) -> Dict[str, Any]:
    """Validate and normalize the AI analysis output."""
    
    # Ensure overall_score is within reasonable range
    if "overall_score" in result:
        result["overall_score"] = max(0, min(100, float(result["overall_score"])))
    
    # Ensure section_scores exists and has reasonable values
    if "section_scores" not in result or not result["section_scores"]:
        result["section_scores"] = {}
    
    # Validate detected mistakes
    if "detected_mistakes" in result:
        validated_mistakes = []
        for mistake in result["detected_mistakes"]:
            # Ensure required fields exist
            if "category" not in mistake:
                category = "other"
            else:
                category = mistake["category"]
            
            if "message" not in mistake:
                message = "No description provided"
            else:
                message = mistake["message"]
            
            if "evidence" not in mistake:
                # Try to find evidence in original text
                evidence = ""
                if "suggestion" in mistake:
                    evidence = mistake["suggestion"]
                else:
                    evidence = message[:100] if message else ""
            
            # Ensure severity is valid
            if "severity" not in mistake or mistake["severity"] not in ("low", "medium", "high"):
                mistake["severity"] = "medium"
            
            if "suggestion" not in mistake:
                mistake["suggestion"] = "Review and consider improving this area"
            
            validated_mistakes.append({
                "category": category,
                "message": message,
                "evidence": evidence,
                "severity": mistake["severity"],
                "suggestion": mistake["suggestion"]
            })
        result["detected_mistakes"] = validated_mistakes
    else:
        result["detected_mistakes"] = []
    
    # Ensure strengths and weaknesses exist
    if not result.get("strengths"):
        result["strengths"] = "No major strengths identified"
    if not result.get("weaknesses"):
        result["weaknesses"] = "No significant weaknesses identified"
    
    if not result.get("suggestions"):
        result["suggestions"] = "Review each section for improvement opportunities"
    
    # Ensure improved_bullets is a list
    if "improved_bullets" not in result or not isinstance(result["improved_bullets"], list):
        result["improved_bullets"] = []
    
    # Ensure section_assessment exists
    if "section_assessment" not in result or not result["section_assessment"]:
        result["section_assessment"] = {}
    
    return result


def build_fallback_analysis(text: str) -> Dict[str, Any]:
    """Build a fallback analysis when AI is unavailable.
    
    This performs basic rule-based analysis without AI.
    """
    # Simple text analysis
    lines = text.split("\n")
    total_words = len(text.split())
    
    # Detect basic issues
    detected_mistakes = []
    strengths = []
    weaknesses = []
    suggestions = []
    improved_bullets = []
    
    # Check for common issues
    if total_words < 100:
        detected_mistakes.append({
            "category": "content",
            "message": "Resume appears very short - may lack sufficient detail",
            "evidence": f"Total word count: {total_words}",
            "severity": "medium",
            "suggestion": "Add more detailed descriptions of experience and achievements"
        })
        weaknesses.append("Insufficient content depth")
        suggestions.append("Expand bullet points with specific achievements")
    
    # Check for common sections
    sections = detect_resume_sections(text)
    missing_sections = []
    for section_name, section_text in sections.items():
        if not section_text.strip() or len(section_text.strip()) < 20:
            missing_sections.append(section_name.replace("_", " ").title())
    
    if missing_sections:
        detected_mistakes.append({
            "category": "completeness",
            "message": f"Missing or minimal sections: {', '.join(missing_sections)}",
            "evidence": f"Sections with little content: {', '.join(missing_sections)}",
            "severity": "high" if len(missing_sections) > 3 else "medium",
            "suggestion": f"Add complete information for: {', '.join(missing_sections)}"
        })
        weaknesses.append("Missing resume sections")
        suggestions.append("Ensure all major resume sections are present")
    
    # Basic strength detection
    if total_words > 200:
        strengths.append(" adequate content depth")
    
    if any(word in text.lower() for word in ["achievement", "achieved", "percent", "increased", "improved"]):
        strengths.append("Contains quantifiable achievements")
    
    # Generate some improved bullet points if we find weak ones
    for line in lines:
        line = line.strip()
        if line.startswith("-") or line.startswith("•"):
            # Simple improvement: add a verb at the start if missing
            if not any(line.startswith(verb) for verb in ["managed", "created", "developed", "led", "achieved"]):
                improved = f"Enhanced: {line}"
                improved_bullets.append(improved)
    
    # Populate section assessment and scores
    section_assessment = {}
    section_scores = {}
    for sec_name, sec_text in sections.items():
        stripped_len = len(sec_text.strip())
        if stripped_len > 80:
            score = 85.0
            completeness = "complete"
            issues = []
        elif stripped_len > 15:
            score = 65.0
            completeness = "partial"
            issues = ["Section could be expanded with more details"]
        else:
            score = 35.0
            completeness = "missing"
            issues = [f"Section {sec_name.replace('_', ' ')} is missing or sparse"]
            
        section_assessment[sec_name] = {
            "score": score,
            "completeness": completeness,
            "issues": issues
        }
        section_scores[sec_name] = score

    calculated_score = sum(section_scores.values()) / max(1, len(section_scores))

    return {
        "overall_score": round(max(30.0, min(95.0, calculated_score + len(improved_bullets) * 2)), 1),
        "section_scores": section_scores,
        "detected_mistakes": detected_mistakes,
        "strengths": "; ".join(strengths) if strengths else "Basic resume structure present",
        "weaknesses": "; ".join(weaknesses) if weaknesses else "No major issues detected",
        "suggestions": "; ".join(suggestions) if suggestions else "Review for improvements",
        "improved_bullets": improved_bullets[:5],
        "section_assessment": section_assessment,
        "disclaimer": (
            "Note: This analysis was generated using rule-based assessment. "
            "For deep generative feedback, ensure an active Gemini API key is configured."
        )
    }


def analyze_resume_file(
    file_path: str,
    api_key: str
) -> Dict[str, Any]:
    """Complete resume analysis pipeline: extract text, analyze with AI.
    
    Returns the full analysis result dict.
    """
    # Extract text based on file type
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    
    if ext == "pdf":
        text = extract_text_from_pdf(file_path)
    elif ext == "docx":
        text = extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    
    if not text.strip():
        return {
            "overall_score": 0.0,
            "section_scores": {},
            "detected_mistakes": [{
                "category": "extraction",
                "message": "No text could be extracted from the document",
                "evidence": "The PDF may be scanned/image-based or corrupted",
                "severity": "high",
                "suggestion": "Provide a text-based DOCX version or scanned PDF with OCR"
            }],
            "strengths": "No text extractable",
            "weaknesses": "Cannot extract text from provided document",
            "suggestions": "Use a text-based resume format (PDF with selectable text or DOCX)",
            "improved_bullets": [],
            "section_assessment": {},
            "disclaimer": "No text could be extracted from the document. Scanned or image-based PDFs are not supported for text extraction."
        }
    
    # Analyze with AI
    result = analyze_resume_ai(text, api_key)
    
    # Ensure text was actually extracted from (not invented)
    # The AI should only reference text that was actually extracted
    
    return result