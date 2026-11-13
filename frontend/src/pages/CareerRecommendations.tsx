import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  CheckCircle2,
  Search,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { apiRequest } from '../lib/api'

interface CareerRecData {
  target_role: string
  fit_percentage: number
  summary: string
  matched_skills: string[]
  missing_skills: string[]
  role_requirements: string[]
  next_steps: string[]
  recommended_roles?: string[]
  profile_skills_count: number
}

const PRESET_ROLES = [
  'AI / Machine Learning Engineer',
  'Senior Full-Stack Engineer',
  'Cloud Solutions Architect',
  'DevOps & Platform Engineer',
  'Frontend Specialist',
  'Data Engineer'
]

interface RoleBenchmark {
  title: string
  requirements: string[]
  learning_priorities: string[]
  next_steps: string[]
  recommended_roles: string[]
  summary: string
}

const ROLE_BENCHMARKS: Record<string, RoleBenchmark> = {
  'ai machine learning engineer': {
    title: 'AI / Machine Learning Engineer',
    requirements: ['Python', 'PyTorch', 'Vector DBs', 'RAG Pipelines', 'Docker', 'System Design'],
    learning_priorities: [
      'Deep dive into PyTorch and Vector DBs',
      'Implement evaluation pipelines for RAG',
      'Study transformer attention mechanisms'
    ],
    next_steps: [
      'Build and deploy an end-to-end RAG question-answering project using Qdrant or Pinecone.',
      'Study transformer attention mechanisms and model evaluation metrics (BLEU, ROUGE).',
      'Benchmark API latency and throughput under concurrent load in your portfolio projects.'
    ],
    recommended_roles: ['MLOps Engineer', 'Data Engineer', 'Backend Specialist'],
    summary: 'High industry demand for vector database integrations, retrieval pipelines, and fine-tuning transformer models.'
  },
  'senior full stack engineer': {
    title: 'Senior Full-Stack Engineer',
    requirements: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'Microservices', 'CI/CD'],
    learning_priorities: [
      'Microservices architecture patterns',
      'CI/CD automation with GitHub Actions',
      'Distributed caching with Redis'
    ],
    next_steps: [
      'Implement Redis caching layers to reduce database query load.',
      'Set up GitHub Actions CI/CD workflows with automated linting and end-to-end tests.',
      'Refactor state management using modern React patterns.'
    ],
    recommended_roles: ['Frontend Lead', 'Backend Engineer', 'Solutions Architect'],
    summary: 'Balanced mastery across modern frontend frameworks (React/TypeScript) and scalable backend microservices.'
  },
  'cloud solutions architect': {
    title: 'Cloud Solutions Architect',
    requirements: ['AWS', 'GCP', 'Terraform', 'Kubernetes', 'Docker', 'Security Architecture', 'Cost Optimization'],
    learning_priorities: [
      'Terraform Infrastructure as Code',
      'Kubernetes cluster orchestration',
      'AWS VPC / IAM Security policies'
    ],
    next_steps: [
      'Earn AWS Solutions Architect Associate or GCP Cloud Architect certification.',
      'Provision multi-tier cloud infrastructure using Terraform scripts.',
      'Deploy and scale a containerized application on a Kubernetes cluster.'
    ],
    recommended_roles: ['DevOps Engineer', 'Platform Engineer', 'Site Reliability Engineer'],
    summary: 'Enterprise infrastructure design, multi-region cloud deployment, and infrastructure-as-code automation.'
  },
  'devops platform engineer': {
    title: 'DevOps & Platform Engineer',
    requirements: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS', 'Terraform', 'Prometheus', 'Monitoring'],
    learning_priorities: [
      'Kubernetes Helm charts',
      'GitOps with ArgoCD',
      'Observability with Prometheus & Grafana'
    ],
    next_steps: [
      'Create an automated GitOps deployment pipeline using GitHub Actions and ArgoCD.',
      'Set up centralized logging and distributed tracing with OpenTelemetry.',
      'Automate infrastructure disaster recovery tests.'
    ],
    recommended_roles: ['Site Reliability Engineer', 'Cloud Architect', 'Systems Engineer'],
    summary: 'Platform automation, container orchestration, CI/CD pipelines, and infrastructure observability.'
  },
  'frontend specialist': {
    title: 'Frontend Specialist',
    requirements: ['JavaScript', 'React', 'TypeScript', 'HTML/CSS', 'Tailwind CSS', 'Web Performance', 'Testing', 'Git'],
    learning_priorities: [
      'Core Web Vitals optimization',
      'Component library design systems',
      'End-to-end testing with Playwright'
    ],
    next_steps: [
      'Optimize application Core Web Vitals to achieve all-green Lighthouse scores (>90).',
      'Build an accessible, themeable UI component system using Radix and Tailwind.',
      'Implement comprehensive test coverage using Vitest and Testing Library.'
    ],
    recommended_roles: ['Full-Stack Engineer', 'UI/UX Developer', 'Design Systems Engineer'],
    summary: 'Modern client-side engineering, responsive layouts, web performance, and accessible UI development.'
  },
  'data engineer': {
    title: 'Data Engineer',
    requirements: ['Python', 'SQL', 'PostgreSQL', 'Spark', 'Kafka', 'Data Pipelines', 'Airflow', 'Docker'],
    learning_priorities: [
      'Apache Spark distributed processing',
      'Kafka real-time streaming',
      'Data modeling and partitioning'
    ],
    next_steps: [
      'Build an end-to-end batch processing pipeline using Apache Airflow and PostgreSQL.',
      'Implement a real-time event streaming pipeline with Apache Kafka.',
      'Benchmark query performance across partitioned data tables.'
    ],
    recommended_roles: ['Data Scientist', 'Analytics Engineer', 'Backend Engineer'],
    summary: 'Large-scale distributed data processing, ETL pipelines, streaming architectures, and data modeling.'
  }
}

function normalizeRoleKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[&\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
}

function normalizeSkill(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[&\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
}

function computeSkillMatch(roleTitle: string, userSkills: string[]): CareerRecData {
  const normRole = normalizeRoleKey(roleTitle)

  // Case-insensitive lookup (CA-002)
  let benchmarkKey = Object.keys(ROLE_BENCHMARKS).find(
    (k) => k === normRole || normRole.includes(k) || k.includes(normRole)
  )

  if (!benchmarkKey) {
    if (normRole.includes('cloud') || normRole.includes('architect')) {
      benchmarkKey = 'cloud solutions architect'
    } else if (normRole.includes('ai') || normRole.includes('machine') || normRole.includes('ml')) {
      benchmarkKey = 'ai machine learning engineer'
    } else if (normRole.includes('full') || normRole.includes('stack')) {
      benchmarkKey = 'senior full stack engineer'
    } else if (normRole.includes('devops') || normRole.includes('platform')) {
      benchmarkKey = 'devops platform engineer'
    } else if (normRole.includes('front') || normRole.includes('react')) {
      benchmarkKey = 'frontend specialist'
    } else if (normRole.includes('data')) {
      benchmarkKey = 'data engineer'
    }
  }

  const benchmark = benchmarkKey
    ? ROLE_BENCHMARKS[benchmarkKey]
    : {
        title: roleTitle.trim() || 'Software Engineer',
        requirements: ['Python', 'JavaScript', 'SQL', 'Git', 'Docker', 'System Design'],
        learning_priorities: ['System Design & Architecture', 'Cloud Services', 'Performance Optimization'],
        next_steps: [
          `Review active job postings for ${roleTitle} to identify employer skill trends.`,
          'Add quantifiable metrics to your resume project bullets.',
          'Complete domain-specific mock interview questions in Career Chat.'
        ],
        recommended_roles: ['Software Engineer', 'Full-Stack Developer'],
        summary: `Core skill alignment and growth trajectory for ${roleTitle}.`
      }

  const normUserSkills = (userSkills || []).map(normalizeSkill)

  // Compare actual user profile skills with role requirements
  const matchedSkills = benchmark.requirements.filter((req) => {
    const normReq = normalizeSkill(req)
    return normUserSkills.some((u) => u === normReq || u.includes(normReq) || normReq.includes(u))
  })

  const missingSkills = benchmark.requirements.filter((req) => !matchedSkills.includes(req))

  // True match percentage calculated from actual user skills (CA-001)
  let fitPercentage = 0
  if (userSkills && userSkills.length > 0) {
    const ratio = matchedSkills.length / Math.max(1, benchmark.requirements.length)
    fitPercentage = Math.round(ratio * 100)
  }

  let summary = ''
  if (!userSkills || userSkills.length === 0) {
    summary = `No skills found in your profile. Add your technical skills in Profile to calculate a personalized role match for ${benchmark.title}.`
  } else if (matchedSkills.length > 0) {
    summary = `Your profile matches ${matchedSkills.length} of ${benchmark.requirements.length} core competencies for ${benchmark.title} (${fitPercentage}% match). ${benchmark.summary}`
  } else {
    summary = `None of your ${userSkills.length} saved profile skills overlap with the core requirements for ${benchmark.title}. Focus on the missing skills below to bridge the gap.`
  }

  return {
    target_role: benchmark.title,
    fit_percentage: fitPercentage,
    summary,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    role_requirements: benchmark.requirements,
    next_steps: benchmark.next_steps,
    recommended_roles: benchmark.recommended_roles,
    profile_skills_count: userSkills ? userSkills.length : 0
  }
}

export default function CareerRecommendations() {
  const [selectedRole, setSelectedRole] = useState<string>('AI / Machine Learning Engineer')
  const [customRoleInput, setCustomRoleInput] = useState<string>('')
  const [userProfileSkills, setUserProfileSkills] = useState<string[]>([])
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1. Load actual user profile skills from server and local persistence (CA-001)
  useEffect(() => {
    async function fetchProfileSkills() {
      // Check local cache first for instant feedback
      const cached = localStorage.getItem('career_ai_profile')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed?.technical_skills)) {
            setUserProfileSkills(parsed.technical_skills)
          }
        } catch {
          // Ignore
        }
      }

      try {
        const data = await apiRequest<any>('/api/profile')
        if (data && Array.isArray(data.technical_skills)) {
          setUserProfileSkills(data.technical_skills)
          // Keep local persistence synchronized
          const prev = cached ? JSON.parse(cached) : {}
          localStorage.setItem(
            'career_ai_profile',
            JSON.stringify({ ...prev, technical_skills: data.technical_skills })
          )
        }
      } catch (err: any) {
        console.warn('Profile skill fetch for career matching using local state:', err?.message)
      } finally {
        setProfileLoaded(true)
      }
    }

    fetchProfileSkills()
  }, [])

  // 2. Compute dynamic recommendations against actual user skills (CA-001, CA-002)
  const data = useMemo(() => {
    return computeSkillMatch(selectedRole, userProfileSkills)
  }, [selectedRole, userProfileSkills])

  // 3. Handle custom search with sanitization and length bounds (CA-002, CA-007)
  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = customRoleInput.trim()
    if (trimmed) {
      // Clamped to 80 chars max to prevent layout disruption (CA-007)
      const sanitized = trimmed.slice(0, 80)
      setSelectedRole(sanitized)
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
              Personalized benchmark matching calculated from your verified profile skills.
            </p>
          </div>

          <Link
            to="/chat"
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5 self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Practice Interview</span>
          </Link>
        </div>

        {/* Empty Profile Banner (CA-001) */}
        {profileLoaded && data.profile_skills_count === 0 && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>0 Profile Skills Detected:</strong> Career AI is currently displaying benchmark requirements with a 0% match. Add your technical skills in Profile to calculate your personal role match.
              </span>
            </div>
            <Link
              to="/profile"
              className="px-3 py-1.5 rounded-md bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 transition flex items-center gap-1 shrink-0 self-start sm:self-auto text-xs"
            >
              <span>Add Skills in Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Role Selector & Search (CA-002, CA-007) */}
        <div className="surface-panel p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Role Preset Tabs */}
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Target Role Presets">
              {PRESET_ROLES.map((role) => {
                const isActive = normalizeRoleKey(selectedRole) === normalizeRoleKey(role)
                return (
                  <button
                    key={role}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedRole(role)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                        : 'bg-[#0E0F12] text-zinc-400 hover:text-white border border-[#202227]'
                    }`}
                  >
                    {role}
                  </button>
                )
              })}
            </div>

            {/* Custom Role Search Input (CA-002, CA-007) */}
            <form onSubmit={handleCustomSearch} className="flex gap-1.5 shrink-0">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  maxLength={80}
                  aria-label="Target role title"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="Search any role..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                aria-label="Search target role"
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#16181E] hover:bg-[#1E2028] border border-[#262830] text-zinc-200 transition focus-visible:ring-2 focus-visible:ring-blue-500"
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
            {/* Main Fit Card (Protected against 264-character overflow: CA-007) */}
            <div className="surface-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="uppercase tracking-wider">Target Role Benchmark</span>
                </div>
                {/* Unbroken long text wrapping (CA-007) */}
                <h2 className="text-lg font-bold text-white break-words break-all sm:break-words line-clamp-2 leading-tight">
                  {data.target_role}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  {data.summary}
                </p>
              </div>

              {/* Match Gauge */}
              <div className="p-3.5 rounded-xl bg-[#0E0F12] border border-[#202227] text-center shrink-0 self-start sm:self-auto min-w-[130px]">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                  Profile Fit
                </span>
                <span className="text-2xl font-bold text-white font-mono tabular-data">
                  {data.fit_percentage}%
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">
                  {data.profile_skills_count === 0
                    ? '0 skills registered'
                    : `${data.matched_skills.length}/${data.role_requirements.length} matched`}
                </span>
              </div>
            </div>

            {/* Have vs Missing Skills (CA-001) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Skills You Have */}
              <div className="surface-panel p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Skills You Have ({data.matched_skills.length})</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {data.profile_skills_count} total in profile
                  </span>
                </div>

                {data.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.matched_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded bg-[#0E0F12] border border-emerald-500/25 text-emerald-300 text-xs font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded bg-[#0E0F12] border border-[#202227] text-xs text-zinc-500 space-y-1">
                    <p>No matching skills found in your profile for this track.</p>
                    <Link to="/profile" className="text-blue-400 hover:underline inline-block pt-1">
                      + Add skills to your profile →
                    </Link>
                  </div>
                )}
              </div>

              {/* Skills to Acquire */}
              <div className="surface-panel p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Target className="w-3.5 h-3.5" />
                    <span>Skills to Acquire ({data.missing_skills.length})</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Priority gap list
                  </span>
                </div>

                {data.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.missing_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded bg-[#0E0F12] border border-amber-500/25 text-amber-300 text-xs font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 p-3 rounded bg-[#0E0F12] border border-[#202227]">
                    You meet all core requirements for this track!
                  </p>
                )}
              </div>
            </div>

            {/* Next Steps */}
            {data.next_steps && data.next_steps.length > 0 && (
              <div className="surface-panel p-5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Recommended Action Plan</span>
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
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Similar Roles In This Family
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.recommended_roles.map((altRole) => (
                    <button
                      key={altRole}
                      type="button"
                      onClick={() => setSelectedRole(altRole)}
                      className="px-2.5 py-1 rounded bg-[#0E0F12] hover:bg-[#16181E] text-xs text-zinc-300 hover:text-white border border-[#202227] transition flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-blue-500"
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
