# Career AI — API Integration Guide

## Gemini API Key Configuration

### Provided API Key
`your_gemini_api_key_here`

This key has been identified as a Google AI Studio / Google Gemini API key.

### Configuration Required

#### Method 1: Environment Variable (Recommended)
Set the `GEMINI_API_KEY` environment variable before running the backend:

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY="your_gemini_api_key_here"
```

**Command Prompt:**
```cmd
set GEMINI_API_KEY=your_gemini_api_key_here
```

**Linux/macOS:**
```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
```

#### Method 2: .env File
A `.env` file exists at `backend\.env` with the following content:
```
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=career-ai-dev-secret-key
DEBUG=True
```

**Note:** The `.env` file must be in the `backend/` directory, and the app must be run from `D:\Own webs\career ai` or the backend directory must be the CWD.

#### Method 3: Direct Assignment
Alternatively, you can directly modify `backend\config.py` to include the key, but using environment variables is the recommended approach per the project requirements.

---

## API Key Status

| Feature | Status Without Key | Status With Key |
|---------|-------------------|------------------|
| Resume analysis (rule-based) | ✅ Working | ✅ Working |
| AI-powered resume analysis (Gemini) | ❌ Fallback only | ✅ Active |
| AI chatbot (rule-based) | ✅ Working | ✅ Enhanced |
| Personalized chatbot responses | ❌ Limited | ✅ With profile context |
| Skill gap analysis | ⚠️ Basic | ✅ Dynamic |
| Career recommendations | ⚠️ Hardcoded roles | ✅ Personalized |

---

## Other API Keys & Configuration

### 1. SECRET_KEY (JWT Signing)
- **Current value:** `change-this-in-production` (default)
- **Purpose:** Signs JWT authentication tokens
- **Required:** Yes, but this is a local secret, not an external API key
- **Recommendation:** Change to a strong random string for production
- **Set via:** `SECRET_KEY` environment variable or update `.env` file

### 2. DATABASE_URL (Database Connection)
- **Current value:** `sqlite:///./dev.db` (SQLite for development)
- **Purpose:** Connects to the database
- **Required:** Yes, for data persistence
- **Production:** Set to PostgreSQL connection string
- **Set via:** `DATABASE_URL` environment variable

### 3. Additional Google AI Keys
- **Only one Gemini API key needed** - the provided key should suffice
- **No other Google API keys** are required for the current features
- **Future features** (like Google Search integration, etc.) may require additional keys

---

## AI Integration Details

### Backend (`backend\ai.py`)
The AI resume analysis engine integrates with Google's Gemini API:

```python
import google.generativeai as genai

def configure_api(api_key: str) -> None:
    """Configure the Gemini API with the given API key."""
    genai.configure(api_key=api_key)
```

**Model Configuration:**
- Default model: `gemini-flash-latest` (auto-updates to latest flash model)
- Temperature: 0.2 (low for consistent, factual outputs)
- Maximum output tokens: 4096

**Response Validation:**
- AI output is validated against a JSON schema
- Prevents invention of qualifications, achievements, or skills
- Distinguishes factual errors from stylistic suggestions
- Provides disclaimer about indicative nature of scores

**Fallback Behavior:**
- When no API key is configured: uses rule-based analysis
- When API key is invalid/unavailable: gracefully degrades to fallback
- Error handling prevents application crashes

---

## Frontend Integration (`frontend\vite.config.ts`)

The frontend proxies API requests to the backend:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

**This means:**
- Frontend calls `/api/auth/register` → `http://localhost:8000/api/auth/register`
- No CORS configuration needed on frontend
- API keys stay on the backend (secure)

---

## Security Best Practices

### Do's:
- ✅ Keep `GEMINI_API_KEY` in environment variables, not in source code
- ✅ Use `.env` file for local development (add to `.gitignore`)
- ✅ Rotate keys regularly in production
- ✅ Restrict API key usage to specific domains/URLs in Google AI Studio
- ✅ Use HTTPS for all API communications

### Don'ts:
- ❌ Never hardcode API keys in frontend JavaScript
- ❌ Never commit `.env` files to version control
- ❌ Share API keys in chat, email, or public repositories
- ❌ Use the default `SECRET_KEY` in production

---

## Troubleshooting

### Common Issues:

1. **"ModuleNotFoundError: No module named 'google.generativeai'"**
   - Install: `pip install google-generativeai`
   - Note: This package is deprecated; consider switching to `google.genai`

2. **"404: models/gemini-... not found"**
   - The key is valid but the model name might need updating
   - Use `gemini-flash-latest` for the most compatible model

3. **"Daily request limit exceeded"**
   - Google AI Studio has free tier limits
   - Upgrade plan or wait for quota reset

4. **"CORS error"**
   - Ensure frontend dev server is proxying to `http://localhost:8000`
   - Check that `ALLOWED_ORIGINS` includes the frontend URL

5. **API key appears invalid**
   - Verify the key in Google AI Studio
   - Ensure the key isn't restricted to specific HTTP referrers or IP addresses

---

## Production Checklist

Before deploying to production:

- [ ] Set `GEMINI_API_KEY` to your production key
- [ ] Change `SECRET_KEY` to a strong, random value
- [ ] Set `DATABASE_URL` to PostgreSQL connection string
- [ ] Set `DEBUG=False`
- [ ] Configure API key restrictions in Google AI Studio
- [ ] Test all endpoints with the production key
- [ ] Verify file upload works at scale
- [ ] Test chatbot with various user inputs
- [ ] Review and update CORS origins

---

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the generated key
5. Use the key as `GEMINI_API_KEY` environment variable

**Free tier:** Generous limits for development and testing
**Paid tier:** Higher limits for production applications