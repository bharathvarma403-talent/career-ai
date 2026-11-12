import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Loader2,
  Info
} from 'lucide-react'

interface CareerRecData {
  target_role: string
  fit_percentage: number
  summary: string
  user_skills: string[]
  role_requirements: string[]
  missing_skills: string[]
  next_steps: string[]
  recommended_roles?: string[]
  resume_score?: number
  is_fallback?: boolean
}

const PRESET_ROLES = [
  'AI / Machine Learning Engineer',
  'Senior Full-Stack Engineer',
  'Cloud Solutions Architect',
  'DevOps & Platform Engineer',
  'Frontend Specialist',
  'Data Engineer'
]

export default function CareerRecommendations() {
  const [selectedRole, setSelectedRole] = useState<string>('AI / Machine Learning Engineer')
  const [customRoleInput, setCustomRoleInput] = useState<string>('')
  const [data, setData] = useState<CareerRecData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const token = localStorage.getItem('token')

  const fetchRecommendations = async (roleName: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/career/recommendations?role=${encodeURIComponent(roleName)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error('Failed to retrieve career recommendations.')
      }

      const recData = await res.json()
      setData(recData)
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing career gaps.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations(selectedRole)
  }, [selectedRole])

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (customRoleInput.trim()) {
      setSelectedRole(customRoleInput.trim())
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#202227] gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase text-zinc-400">
            Taxonomy / Career Trajectory
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Skill Taxonomy & Gap Architecture
          </h1>
          <p className="text-xs text-zinc-400">
            Benchmark your verified profile skills against technical requirements and identify specific gaps to bridge.
          </p>
        </div>

        <Link
          to="/chat"
          className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discuss with Mentor</span>
        </Link>
      </div>

      {/* Track Selector & Search Bar */}
      <div className="surface-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-xs font-mono uppercase text-zinc-400">
            Target Engineering Track
          </div>

          <form onSubmit={handleCustomSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Custom title (e.g. Distributed Systems Engineer)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#16181E] hover:bg-[#1E2028] border border-[#262830] text-zinc-200 transition"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Preset Roles Segmented Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                selectedRole === role
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'bg-[#0E0F12] text-zinc-400 hover:text-white border border-[#202227]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Calibrating skill requirements...</span>
        </div>
      ) : error || !data ? (
        <div className="surface-panel p-8 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <h3 className="font-semibold text-white text-sm">Analysis Unavailable</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {error || 'Unable to compute career taxonomy for this track.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Fit Card */}
          <div className="surface-panel p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#202227] gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-zinc-400">
                  EVALUATED HORIZON
                </span>
                <h2 className="text-xl font-semibold text-white">
                  {data.target_role}
                </h2>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  {data.summary ||
                    'Comprehensive alignment analysis based on verified competencies and current industry technical benchmarks.'}
                </p>
              </div>

              {/* Match Score Display */}
              <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] text-right shrink-0">
                <span className="text-[10px] font-mono text-zinc-400 block">ROLE READINESS</span>
                <span className="text-2xl font-bold text-white font-mono tabular-data">
                  {data.fit_percentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>
                {data.is_fallback
                  ? 'Deterministic taxonomy calculation active (cross-referenced against local skill dictionary).'
                  : 'AI multi-pass synthesis active with dynamic career calibration.'}
              </span>
            </div>
          </div>

          {/* Comparative Skill Balance Sheet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matching Skills */}
            <div className="surface-panel p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#202227]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matching Skills in Profile ({data.user_skills?.length || 0})</span>
                </div>
              </div>

              {data.user_skills && data.user_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.user_skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#202227] text-zinc-200 text-xs font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  No matching skills found in your profile yet. Add your skills in the Profile tab.
                </p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="surface-panel p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#202227]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Missing Gaps to Bridge ({data.missing_skills?.length || 0})</span>
                </div>
              </div>

              {data.missing_skills && data.missing_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.missing_skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#2A261A] text-amber-300/90 text-xs font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">
                  Full alignment! Your profile currently meets all core requirements for this track.
                </p>
              )}
            </div>
          </div>

          {/* Sequential Action Trajectory */}
          {data.next_steps && data.next_steps.length > 0 && (
            <div className="surface-panel p-6 space-y-3">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <span>Recommended Technical Progression</span>
              </div>

              <div className="space-y-2">
                {data.next_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-[#0E0F12] border border-[#202227] flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded bg-[#181A1F] border border-[#272A31] text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adjacent Tracks */}
          {data.recommended_roles && data.recommended_roles.length > 0 && (
            <div className="surface-panel p-4 space-y-2.5">
              <div className="text-[11px] font-mono uppercase text-zinc-400">
                ADJACENT ENGINEERING TRACKS
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.recommended_roles.map((altRole) => (
                  <button
                    key={altRole}
                    onClick={() => setSelectedRole(altRole)}
                    className="px-2.5 py-1 rounded bg-[#0E0F12] hover:bg-[#16181E] text-xs font-medium text-zinc-300 hover:text-white border border-[#202227] transition flex items-center gap-1"
                  >
                    <span>{altRole}</span>
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
