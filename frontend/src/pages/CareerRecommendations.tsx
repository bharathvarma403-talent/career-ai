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
  Loader2
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
      setError(err.message || 'An error occurred.')
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#202227] gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Skill Gaps & Roles</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compare your profile skills against target role benchmarks.
          </p>
        </div>

        <Link
          to="/chat"
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Practice Interview</span>
        </Link>
      </div>

      {/* Role Selector & Search */}
      <div className="surface-panel p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  selectedRole === role
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'bg-[#0E0F12] text-zinc-400 hover:text-white border border-[#202227]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomSearch} className="flex gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Custom title..."
                className="pl-8 pr-3 py-1 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 rounded-md text-xs font-medium bg-[#16181E] hover:bg-[#1E2028] border border-[#262830] text-zinc-200"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Comparing skills...</span>
        </div>
      ) : error || !data ? (
        <div className="surface-panel p-8 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <p className="text-xs text-zinc-400">{error || 'Could not load data for this role.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main Fit Card */}
          <div className="surface-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-zinc-400">TARGET ROLE</div>
              <h2 className="text-lg font-bold text-white mt-0.5">{data.target_role}</h2>
              {data.summary && <p className="text-xs text-zinc-400 mt-1 max-w-lg">{data.summary}</p>}
            </div>

            <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#202227] text-center shrink-0 self-start sm:self-auto">
              <span className="text-[10px] font-mono text-zinc-400 block">ROLE MATCH</span>
              <span className="text-2xl font-bold text-white font-mono tabular-data">
                {data.fit_percentage}%
              </span>
            </div>
          </div>

          {/* Have vs Missing Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="surface-panel p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Skills You Have ({data.user_skills?.length || 0})</span>
              </div>

              {data.user_skills && data.user_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.user_skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#202227] text-zinc-200 text-xs font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No matching skills found in profile.</p>
              )}
            </div>

            <div className="surface-panel p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Target className="w-3.5 h-3.5" />
                <span>Skills to Acquire ({data.missing_skills?.length || 0})</span>
              </div>

              {data.missing_skills && data.missing_skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.missing_skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#2A261A] text-amber-300 text-xs font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400">You meet all core requirements for this track!</p>
              )}
            </div>
          </div>

          {/* Next Steps */}
          {data.next_steps && data.next_steps.length > 0 && (
            <div className="surface-panel p-5 space-y-3">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <span>Recommended Next Steps</span>
              </div>

              <div className="space-y-2 text-xs">
                {data.next_steps.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-[#0E0F12] border border-[#202227] flex items-start gap-2.5">
                    <span className="font-mono text-zinc-500 font-bold">{idx + 1}.</span>
                    <span className="text-zinc-200">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Roles */}
          {data.recommended_roles && data.recommended_roles.length > 0 && (
            <div className="surface-panel p-4 space-y-2">
              <div className="text-[11px] font-mono text-zinc-400">SIMILAR ROLES</div>
              <div className="flex flex-wrap gap-1.5">
                {data.recommended_roles.map((altRole) => (
                  <button
                    key={altRole}
                    onClick={() => setSelectedRole(altRole)}
                    className="px-2.5 py-1 rounded bg-[#0E0F12] hover:bg-[#16181E] text-xs text-zinc-300 hover:text-white border border-[#202227] transition flex items-center gap-1"
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
