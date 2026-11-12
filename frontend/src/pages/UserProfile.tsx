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
  'System Design',
  'LangChain',
  'PyTorch'
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
      if (!token) return

      try {
        const res = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          setProfile({
            full_name: data.full_name || '',
            target_role: data.target_role || 'Full Stack Engineer',
            experience_level: data.experience_level || 'Mid-Level',
            education_degree: data.education_degree || "Bachelor's Degree",
            education_field: data.education_field || 'Computer Science',
            technical_skills: Array.isArray(data.technical_skills) ? data.technical_skills : [],
            soft_skills: Array.isArray(data.soft_skills) ? data.soft_skills : [],
            work_experience: typeof data.work_experience === 'string' ? data.work_experience : ''
          })
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

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to update candidate dossier.')
      }

      setHasUnsavedChanges(false)
      setStatusMessage({
        type: 'success',
        text: 'Candidate dossier saved successfully.'
      })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred while saving profile changes.'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Loading candidate dossier...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#202227] gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-zinc-400">
              Dossier / Candidate Profile
            </span>
            {hasUnsavedChanges && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Unsaved Changes
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Career Direction & Verified Skills
          </h1>
          <p className="text-xs text-zinc-400">
            Configure your target engineering track and technical competencies to calibrate skill gap calculations.
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
          className={`p-3 rounded text-xs flex items-start gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Direction & Experience */}
        <div className="surface-panel p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#202227]">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Identity & Career Direction
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
                Target Role Title
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
                Seniority Level
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
                Academic Background
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

        {/* Section 2: Technical Skills Hub */}
        <div className="surface-panel p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#202227]">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Technical Competencies
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
              placeholder="Type a skill and press Enter (e.g. Docker, PyTorch, GraphQL)..."
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

          <div>
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-2">
              CATALOGED SKILLS ({profile.technical_skills.length})
            </div>
            {profile.technical_skills.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                No technical skills cataloged. Add your competencies above or select from recommendations.
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
          </div>

          <div className="pt-2 border-t border-[#1E2026]">
            <div className="text-[11px] text-zinc-400 mb-1.5 font-mono">SUGGESTIONS:</div>
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
        <div className="surface-panel p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#202227]">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Professional Chronology & Summary
            </h2>
          </div>

          <div>
            <textarea
              rows={4}
              value={profile.work_experience}
              onChange={(e) => handleChange('work_experience', e.target.value)}
              placeholder="e.g. 4 years of engineering experience focused on scalable web apps, PostgreSQL query optimization, and distributed systems architecture..."
              className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition resize-y font-sans"
            />
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-md font-semibold text-xs text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-50 transition flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Dossier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
