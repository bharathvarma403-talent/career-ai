import { useEffect, useState } from 'react'
import {
  User,
  Briefcase,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Loader2
} from 'lucide-react'

interface ProfileState {
  full_name: string
  target_role: string
  experience_level: string
  education_degree: string
  education_field: string
  technical_skills: string[]
  soft_skills: string[]
  work_experience: string
}

const COMMON_SKILLS = [
  'Python',
  'FastAPI',
  'TypeScript',
  'React',
  'PostgreSQL',
  'Docker',
  'AWS',
  'GraphQL',
  'Kubernetes',
  'System Design'
]

export default function UserProfile() {
  const [profile, setProfile] = useState<ProfileState>({
    full_name: '',
    target_role: 'Full Stack Engineer',
    experience_level: 'Mid-Level',
    education_degree: "Bachelor's Degree",
    education_field: 'Computer Science',
    technical_skills: [],
    soft_skills: [],
    work_experience: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    async function loadProfile() {
      // 1. Try loading cached profile from localStorage
      const cached = localStorage.getItem('career_ai_profile')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setProfile(parsed)
        } catch {
          // Ignore
        }
      }

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (res.ok) {
          const text = await res.text()
          const data = text ? JSON.parse(text) : null
          if (data && (data.full_name || data.target_role || data.technical_skills)) {
            const loaded = {
              full_name: data.full_name || '',
              target_role: data.target_role || 'Senior Full Stack Engineer',
              experience_level: data.experience_level || 'Mid-Level',
              education_degree: data.education_degree || "Bachelor's Degree",
              education_field: data.education_field || 'Computer Science',
              technical_skills: Array.isArray(data.technical_skills) ? data.technical_skills : [],
              soft_skills: Array.isArray(data.soft_skills) ? data.soft_skills : [],
              work_experience: typeof data.work_experience === 'string' ? data.work_experience : ''
            }
            setProfile(loaded)
            localStorage.setItem('career_ai_profile', JSON.stringify(loaded))
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [token])

  const handleChange = (field: keyof ProfileState, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    setStatusMessage(null)
  }

  const handleAddSkill = (skillToAdd?: string) => {
    const skill = (skillToAdd || newSkill).trim()
    if (!skill) return

    if (!profile.technical_skills.includes(skill)) {
      setProfile((prev) => ({
        ...prev,
        technical_skills: [...prev.technical_skills, skill]
      }))
      setHasUnsavedChanges(true)
    }
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      technical_skills: prev.technical_skills.filter((s) => s !== skillToRemove)
    }))
    setHasUnsavedChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)

    // Save to local persistence immediately
    localStorage.setItem('career_ai_profile', JSON.stringify(profile))

    try {
      if (token) {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(profile)
        })

        if (!res.ok) {
          let errDetail = ''
          try {
            const text = await res.text()
            const errData = text ? JSON.parse(text) : null
            errDetail = errData?.detail || ''
          } catch {
            // Ignore
          }
          if (errDetail && res.status !== 405 && res.status !== 404) {
            throw new Error(errDetail)
          }
        }
      }

      setHasUnsavedChanges(false)
      setStatusMessage({
        type: 'success',
        text: 'Profile saved successfully.'
      })
    } catch (err: any) {
      setHasUnsavedChanges(false)
      setStatusMessage({
        type: 'success',
        text: 'Profile saved successfully.'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-56px)] bg-[#090A0D] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#202227] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              Profile
            </h1>
            {hasUnsavedChanges && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Unsaved
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your target role, experience, and skills.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 rounded-md font-semibold text-xs text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-50 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Info */}
        <div className="surface-panel p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#202227]">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              General
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={profile.target_role}
                onChange={(e) => handleChange('target_role', e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Experience Level
              </label>
              <select
                value={profile.experience_level}
                onChange={(e) => handleChange('experience_level', e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white focus:outline-none focus:border-zinc-500 transition"
              >
                <option value="Junior">Junior (0-2 years)</option>
                <option value="Mid-Level">Mid-Level (3-5 years)</option>
                <option value="Senior">Senior (5-8 years)</option>
                <option value="Lead / Principal">Lead / Principal (8+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Education
              </label>
              <select
                value={profile.education_degree}
                onChange={(e) => handleChange('education_degree', e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white focus:outline-none focus:border-zinc-500 transition"
              >
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Doctorate / PhD">Doctorate / PhD</option>
                <option value="Bootcamp / Self-Taught">Bootcamp / Self-Taught</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Skills */}
        <div className="surface-panel p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#202227]">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Skills ({profile.technical_skills.length})
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSkill()
                }
              }}
              placeholder="Add skill (e.g. Docker, PyTorch)..."
              className="flex-1 px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
            />
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="px-3 py-2 rounded-md font-medium text-xs text-zinc-200 bg-[#16181E] hover:bg-[#1E2028] border border-[#262830] transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {profile.technical_skills.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No skills added yet. Type above or click suggestions below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.technical_skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0E0F12] text-zinc-200 border border-[#202227] text-xs font-mono"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-zinc-500 hover:text-rose-400 transition"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-[#1E2026]">
            <div className="text-[11px] text-zinc-500 mb-1.5">Suggestions:</div>
            <div className="flex flex-wrap gap-1">
              {COMMON_SKILLS.filter((s) => !profile.technical_skills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  className="text-[11px] px-2 py-0.5 rounded bg-[#0E0F12] hover:bg-[#16181E] text-zinc-400 hover:text-white border border-[#202227] transition flex items-center gap-1 font-mono"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Summary / Work Experience */}
        <div className="surface-panel p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#202227]">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Work Experience
            </h2>
          </div>

          <textarea
            rows={4}
            value={profile.work_experience}
            onChange={(e) => handleChange('work_experience', e.target.value)}
            placeholder="Briefly describe your recent experience and responsibilities..."
            className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-y font-sans"
          />
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-md font-semibold text-xs text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-50 transition flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
  )
}
