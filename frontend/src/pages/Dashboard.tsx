import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  Target,
  Loader2,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react'

interface ResumeItem {
  id: number
  filename: string
  created_at: string
  status: string
  analysis?: {
    overall_score: number
    formatting_score: number
    impact_score: number
    experience_score: number
    skills_score: number
    strengths?: string[]
    issues?: Array<{
      category: string
      severity: string
      description: string
      recommendation: string
    }>
  }
}

interface ProfileData {
  full_name?: string
  target_role?: string
  experience_level?: string
  technical_skills?: string[]
}

interface CareerRecs {
  target_role?: string
  fit_percentage?: number
  missing_skills?: string[]
  recommended_roles?: string[]
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [latestAnalysis, setLatestAnalysis] = useState<any | null>(null)
  const [careerRecs, setCareerRecs] = useState<CareerRecs | null>(null)
  const [conversationCount, setConversationCount] = useState<number>(0)

  const token = localStorage.getItem('token')
  const email = localStorage.getItem('email') || 'Candidate'

  useEffect(() => {
    async function loadDashboardData() {
      if (!token) {
        setLoading(false)
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      try {
        const [profData, resumesData, careerData, chatData] = await Promise.allSettled([
          fetch('/api/profile', { headers }).then((r) => (r.ok ? r.json() : null)),
          fetch('/api/resumes', { headers }).then((r) => (r.ok ? r.json() : [])),
          fetch('/api/career/recommendations', { headers }).then((r) => (r.ok ? r.json() : null)),
          fetch('/api/chat/conversations', { headers }).then((r) => (r.ok ? r.json() : []))
        ])

        if (profData.status === 'fulfilled' && profData.value) {
          setProfile(profData.value)
        }

        if (chatData.status === 'fulfilled' && Array.isArray(chatData.value)) {
          setConversationCount(chatData.value.length)
        }

        if (careerData.status === 'fulfilled' && careerData.value) {
          setCareerRecs(careerData.value)
        }

        if (resumesData.status === 'fulfilled' && Array.isArray(resumesData.value)) {
          const list = resumesData.value
          setResumes(list)
          if (list.length > 0) {
            const latest = list[0]
            if (latest.analysis) {
              setLatestAnalysis(latest.analysis)
            } else {
              try {
                const aRes = await fetch(`/api/resumes/${latest.id}/analysis`, { headers })
                if (aRes.ok) {
                  const aData = await aRes.json()
                  setLatestAnalysis(aData)
                }
              } catch {
                // Ignore missing analysis
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Loading candidate workspace...</span>
      </div>
    )
  }

  const technicalSkillsCount = Array.isArray(profile?.technical_skills)
    ? profile.technical_skills.length
    : 0

  const latestScore = latestAnalysis?.overall_score ?? (resumes[0]?.analysis?.overall_score || null)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#202227] gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-zinc-400">
              Workspace / {profile?.target_role || 'Target Unset'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            {profile?.full_name ? profile.full_name : email.split('@')[0]}
          </h1>
          <p className="text-xs text-zinc-400">
            {profile?.target_role ? (
              <>Calibrated for <strong className="text-zinc-200">{profile.target_role}</strong> ({profile.experience_level || 'Mid-Level'})</>
            ) : (
              'Set your target engineering track in your profile to activate precision gap mapping.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/upload"
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Resume</span>
          </Link>
          <Link
            to="/chat"
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open Mentor</span>
          </Link>
        </div>
      </div>

      {/* Operational Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-400">
            ATS Readability Index
          </div>
          <div className="text-2xl font-semibold text-white font-mono tabular-data">
            {latestScore !== null ? `${latestScore}/100` : '—'}
          </div>
          <div className="text-[11px] text-zinc-400">
            {latestScore !== null ? (latestScore >= 80 ? 'High parseability' : 'Actionable issues flagged') : 'No resume audited'}
          </div>
        </div>

        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-400">
            Profile Competencies
          </div>
          <div className="text-2xl font-semibold text-white font-mono tabular-data">
            {technicalSkillsCount}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Verified in dossier</span>
            <Link to="/profile" className="text-zinc-300 hover:underline">
              Edit
            </Link>
          </div>
        </div>

        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-400">
            Role Alignment
          </div>
          <div className="text-2xl font-semibold text-white font-mono tabular-data">
            {careerRecs?.fit_percentage ? `${careerRecs.fit_percentage}%` : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            {careerRecs?.target_role || 'Target unset'}
          </div>
        </div>

        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-400">
            Mentorship Sessions
          </div>
          <div className="text-2xl font-semibold text-white font-mono tabular-data">
            {conversationCount}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Context threads</span>
            <Link to="/chat" className="text-zinc-300 hover:underline">
              Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workspace 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Resume Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Active Resume Diagnostic</span>
            </h2>
            {resumes.length > 0 && (
              <Link
                to={`/analysis/${resumes[0].id}`}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
              >
                <span>Open Full Review</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {resumes.length === 0 ? (
            <div className="surface-panel p-8 text-center space-y-3">
              <div className="w-9 h-9 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center mx-auto text-zinc-400">
                <Upload className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">
                  No Resume Audited Yet
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Upload your PDF or DOCX resume to generate an annotated document review, ATS score breakdown, and metric-dense bullet rewrites.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Resume</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="surface-panel p-5 space-y-5">
              {/* Document Metadata Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#202227] gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    CURRENT DOCUMENT
                  </span>
                  <div className="text-sm font-semibold text-white truncate max-w-md mt-0.5">
                    {resumes[0].filename}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Audited {new Date(resumes[0].created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded bg-[#16181E] border border-[#262830]">
                    <span className="text-[10px] font-mono text-zinc-400 block">OVERALL SCORE</span>
                    <span className="text-lg font-bold text-white font-mono tabular-data">
                      {latestScore ?? '—'}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Rubric Dimensions */}
              {latestAnalysis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Formatting Hygiene', score: latestAnalysis.formatting_score ?? 85 },
                    { label: 'Impact Metrics', score: latestAnalysis.impact_score ?? 70 },
                    { label: 'Experience Depth', score: latestAnalysis.experience_score ?? 80 },
                    { label: 'Skills Coverage', score: latestAnalysis.skills_score ?? 75 }
                  ].map((dim) => (
                    <div
                      key={dim.label}
                      className="p-3 rounded-md bg-[#0E0F12] border border-[#202227] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">{dim.label}</span>
                        <span className="font-mono text-white tabular-data font-semibold">
                          {dim.score}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-[#1C1E24] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-400 rounded-full"
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Flagged Opportunities */}
              {latestAnalysis?.issues && latestAnalysis.issues.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono uppercase text-zinc-400">
                    Flagged Opportunities ({latestAnalysis.issues.length} detected)
                  </div>
                  <div className="space-y-2">
                    {latestAnalysis.issues.slice(0, 2).map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-[#0E0F12] border border-[#202227] flex items-start gap-3"
                      >
                        <AlertTriangle
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            issue.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        />
                        <div className="space-y-0.5 text-xs">
                          <div className="font-medium text-zinc-200">
                            {issue.category || 'Section Issue'}
                          </div>
                          <p className="text-zinc-400 line-clamp-1">
                            {issue.description || issue.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Resumes Archive (if multiple) */}
          {resumes.length > 1 && (
            <div className="surface-panel p-4 space-y-3">
              <div className="text-xs font-semibold text-white">Previous Uploads</div>
              <div className="space-y-1.5 text-xs">
                {resumes.slice(1, 4).map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded bg-[#0E0F12] border border-[#202227] flex items-center justify-between"
                  >
                    <div className="truncate max-w-xs text-zinc-300 font-mono text-[11px]">
                      {r.filename}
                    </div>
                    <Link
                      to={`/analysis/${r.id}`}
                      className="text-zinc-400 hover:text-white text-[11px] flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Next Operational Objectives & Career Snapshot (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-zinc-400" />
            <span>Next Objectives</span>
          </h2>

          <div className="surface-panel p-4 space-y-2">
            {[
              {
                done: Boolean(profile?.full_name && profile?.target_role),
                title: 'Set Target Engineering Track',
                desc: 'Define your desired title to benchmark skill gaps.',
                link: '/profile'
              },
              {
                done: resumes.length > 0,
                title: 'Audit Resume Syntax',
                desc: 'Submit PDF or DOCX to verify ATS readability and impact.',
                link: '/upload'
              },
              {
                done: Boolean(careerRecs?.missing_skills && careerRecs.missing_skills.length > 0),
                title: 'Review Competency Gaps',
                desc: 'Examine high-demand missing competencies.',
                link: '/career'
              },
              {
                done: conversationCount > 0,
                title: 'Practice Technical Mentorship',
                desc: 'Run an interview prep session with context.',
                link: '/chat'
              }
            ].map((step, idx) => (
              <Link
                key={idx}
                to={step.link}
                className={`p-3 rounded-md border flex items-start gap-2.5 transition block ${
                  step.done
                    ? 'bg-[#0E0F12] border-[#1C1E23] text-zinc-400'
                    : 'bg-[#16181E] border-[#262830] hover:border-[#383C48] text-white'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-400 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-zinc-300" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className={`text-xs font-medium ${step.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {step.title}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Career Track Snapshot */}
          <div className="surface-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-zinc-400">
                ACTIVE TRACK SNAPSHOT
              </span>
              <Link to="/career" className="text-[11px] text-zinc-300 hover:text-white">
                Taxonomy →
              </Link>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                {careerRecs?.target_role || profile?.target_role || 'No track configured'}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {careerRecs?.missing_skills?.length
                  ? `Identified ${careerRecs.missing_skills.length} core technical gaps to reach target benchmark.`
                  : 'Update your profile to calculate track requirements.'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
