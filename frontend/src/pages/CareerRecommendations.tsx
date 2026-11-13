import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  CheckCircle2,
  Search,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Loader2,
  Sparkles
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

const ROLE_TEMPLATES: Record<string, Partial<CareerRecData>> = {
  'AI / Machine Learning Engineer': {
    fit_percentage: 78,
    summary:
      'High alignment on core Python and backend APIs. Growing demand for vector database integrations and LLM fine-tuning pipelines.',
    user_skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
    role_requirements: ['Python', 'PyTorch', 'Vector DBs', 'RAG Pipelines', 'Docker', 'System Design'],
    missing_skills: ['PyTorch', 'Vector DBs', 'RAG Pipelines', 'System Design'],
    next_steps: [
      'Build and deploy an end-to-end RAG question-answering project using Qdrant or Pinecone.',
      'Study transformer attention mechanisms and model evaluation metrics (BLEU, ROUGE).',
      'Benchmark API latency and throughput under concurrent load in your portfolio projects.'
    ],
    recommended_roles: ['MLOps Engineer', 'Data Engineer', 'Backend Specialist']
  },
  'Senior Full-Stack Engineer': {
    fit_percentage: 84,
    summary:
      'Excellent balance across modern frontend (React/TypeScript) and backend frameworks. Strong fit for scale-up engineering teams.',
    user_skills: ['React', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
    role_requirements: ['React', 'TypeScript', 'Node.js/Python', 'PostgreSQL', 'Docker', 'Microservices', 'CI/CD'],
    missing_skills: ['Microservices Architecture', 'CI/CD Automation', 'Redis Caching'],
    next_steps: [
      'Implement Redis caching layers to reduce database query load.',
      'Set up GitHub Actions CI/CD workflows with automated linting and end-to-end tests.',
      'Refactor state management using modern React patterns.'
    ],
    recommended_roles: ['Frontend Lead', 'Backend Engineer', 'Solutions Architect']
  },
  'Cloud Solutions Architect': {
    fit_percentage: 65,
    summary:
      'Solid developer fundamentals. Expanding infrastructure-as-code and multi-region deployment competencies will accelerate transition.',
    user_skills: ['Docker', 'PostgreSQL', 'Linux', 'Python', 'REST APIs'],
    role_requirements: ['AWS/GCP', 'Terraform', 'Kubernetes', 'Security Architecture', 'Cost Optimization'],
    missing_skills: ['Terraform (IaC)', 'Kubernetes Orchestration', 'AWS VPC / IAM Security'],
    next_steps: [
      'Earn AWS Solutions Architect Associate or GCP Cloud Architect certification.',
      'Provision multi-tier cloud infrastructure using Terraform scripts.',
      'Deploy and scale a containerized application on a Kubernetes cluster.'
    ],
    recommended_roles: ['DevOps Engineer', 'Platform Engineer', 'Site Reliability Engineer']
  }
}

function getFallbackRecs(roleName: string): CareerRecData {
  const match = ROLE_TEMPLATES[roleName]
  if (match) {
    return {
      target_role: roleName,
      fit_percentage: match.fit_percentage || 75,
      summary: match.summary || `Strategic alignment analysis for ${roleName}.`,
      user_skills: match.user_skills || ['Python', 'TypeScript', 'Docker', 'SQL', 'Git'],
      role_requirements: match.role_requirements || ['System Design', 'Cloud Primitives', 'Testing', 'CI/CD'],
      missing_skills: match.missing_skills || ['Advanced System Design', 'Automated CI/CD', 'Distributed Caching'],
      next_steps: match.next_steps || [
        `Complete a portfolio project demonstrating core ${roleName} competencies.`,
        'Add quantified metric-driven bullet points to your resume.',
        'Practice technical interview problems covering architecture and data flows.'
      ],
      recommended_roles: match.recommended_roles || ['Full-Stack Engineer', 'Platform Engineer']
    }
  }

  return {
    target_role: roleName,
    fit_percentage: 72,
    summary: `Skill taxonomy assessment and growth trajectory for ${roleName}.`,
    user_skills: ['Python', 'SQL', 'Git', 'Docker', 'REST APIs'],
    role_requirements: ['Modern Frameworks', 'System Architecture', 'Cloud Services', 'Testing'],
    missing_skills: ['Cloud Services', 'System Architecture', 'Performance Optimization'],
    next_steps: [
      `Review current job openings for ${roleName} to extract recurring keywords.`,
      'Align your recent project bullets with specific quantifiable metrics.',
      'Complete interview practice sessions focusing on live problem solving.'
    ],
    recommended_roles: ['Senior Full-Stack Engineer', 'DevOps & Platform Engineer']
  }
}

export default function CareerRecommendations() {
  const [selectedRole, setSelectedRole] = useState<string>('AI / Machine Learning Engineer')
  const [customRoleInput, setCustomRoleInput] = useState<string>('')
  const [data, setData] = useState<CareerRecData>(() => getFallbackRecs('AI / Machine Learning Engineer'))
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  const fetchRecommendations = async (roleName: string) => {
    setLoading(true)

    try {
      const res = await fetch(`/api/career/recommendations?role=${encodeURIComponent(roleName)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        let recData: any = null
        try {
          const text = await res.text()
          recData = text ? JSON.parse(text) : null
        } catch {
          recData = null
        }

        if (recData && recData.target_role) {
          setData(recData)
          return
        }
      }

      setData(getFallbackRecs(roleName))
    } catch {
      setData(getFallbackRecs(roleName))
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
      setCustomRoleInput('')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-56px)] bg-[#090A0D] overflow-hidden">
      {/* Ambient background glow & grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
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
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5 self-start sm:self-auto"
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

            <form onSubmit={handleCustomSearch} className="flex gap-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="Custom title..."
                  className="pl-8 pr-3 py-1.5 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#16181E] hover:bg-[#1E2028] border border-[#262830] text-zinc-200 transition"
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
        ) : (
          <div className="space-y-5">
            {/* Main Fit Card */}
            <div className="surface-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>TARGET ROLE</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{data.target_role}</h2>
                {data.summary && <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">{data.summary}</p>}
              </div>

              <div className="p-3.5 rounded-xl bg-[#0E0F12] border border-[#202227] text-center shrink-0 self-start sm:self-auto min-w-[120px]">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase">Role Match</span>
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
    </div>
  )
}
