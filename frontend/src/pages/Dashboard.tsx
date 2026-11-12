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
        <span className="text-xs text-zinc-500 font-mono">Loading dashboard...</span>
      </div>
    )
  }

  const technicalSkillsCount = Array.isArray(profile?.technical_skills)
    ? profile.technical_skills.length
    : 0

  const latestScore = latestAnalysis?.overall_score ?? (resumes[0]?.analysis?.overall_score || null)

  return (
    <div className="relative min-h-[calc(100vh-56px)] bg-[#090A0D] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#202227] gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Welcome, {profile?.full_name || email.split('@')[0]}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Targeting: <span className="text-zinc-200 font-medium">{profile?.target_role || 'Not set (update in Profile)'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span>Career Chat</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400">ATS Resume Score</div>
          <div className="text-2xl font-bold text-white font-mono tabular-data">
            {latestScore !== null ? `${latestScore}/100` : '—'}
          </div>
          <div className="text-[11px] text-zinc-400">
            {latestScore !== null ? (latestScore >= 80 ? 'Good ATS match' : 'Needs improvements') : 'No resume uploaded'}
          </div>
        </div>

        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400">Verified Skills</div>
          <div className="text-2xl font-bold text-white font-mono tabular-data">
            {technicalSkillsCount}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>In your profile</span>
            <Link to="/profile" className="text-zinc-300 hover:underline">Edit</Link>
          </div>
        </div>

        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400">Target Role Match</div>
          <div className="text-2xl font-bold text-white font-mono tabular-data">
            {careerRecs?.fit_percentage ? `${careerRecs.fit_percentage}%` : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            {careerRecs?.target_role || 'Set in profile'}
          </div>
        </div>

        <div className="surface-panel p-4 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400">Chat Sessions</div>
          <div className="text-2xl font-bold text-white font-mono tabular-data">
            {conversationCount}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Active threads</span>
            <Link to="/chat" className="text-zinc-300 hover:underline">Open</Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Latest Resume Report */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Latest Resume Audit</span>
            </h2>
            {resumes.length > 0 && (
              <Link
                to={`/analysis/${resumes[0].id}`}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
              >
                <span>View Full Report</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {resumes.length === 0 ? (
            <div className="surface-panel p-8 text-center space-y-3">
              <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">No resume uploaded yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Upload your PDF or DOCX file to get ATS scores and bullet point rewrites.
                </p>
              </div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition"
              >
                <span>Upload Resume</span>
              </Link>
            </div>
          ) : (
            <div className="surface-panel p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#202227]">
                <div>
                  <div className="text-sm font-semibold text-white truncate max-w-md">
                    {resumes[0].filename}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Uploaded {new Date(resumes[0].created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded bg-[#16181E] border border-[#262830] text-center">
                  <span className="text-[10px] font-mono text-zinc-400 block">SCORE</span>
                  <span className="text-base font-bold text-white font-mono tabular-data">
                    {latestScore ?? '—'}/100
                  </span>
                </div>
              </div>

              {/* 4 Dimension Bars */}
              {latestAnalysis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Formatting', score: latestAnalysis.formatting_score ?? 85 },
                    { label: 'Impact', score: latestAnalysis.impact_score ?? 70 },
                    { label: 'Experience', score: latestAnalysis.experience_score ?? 80 },
                    { label: 'Skills', score: latestAnalysis.skills_score ?? 75 }
                  ].map((dim) => (
                    <div key={dim.label} className="p-2.5 rounded bg-[#0E0F12] border border-[#202227] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">{dim.label}</span>
                        <span className="font-mono text-white tabular-data font-semibold">{dim.score}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1C1E24] rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${dim.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Issues */}
              {latestAnalysis?.issues && latestAnalysis.issues.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono text-zinc-400">
                    Flagged Opportunities ({latestAnalysis.issues.length})
                  </div>
                  <div className="space-y-1.5">
                    {latestAnalysis.issues.slice(0, 2).map((issue: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded bg-[#0E0F12] border border-[#202227] flex items-start gap-2.5 text-xs">
                        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${issue.severity === 'high' ? 'text-rose-400' : 'text-amber-400'}`} />
                        <div>
                          <span className="font-medium text-zinc-200">{issue.category}: </span>
                          <span className="text-zinc-400">{issue.description || issue.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Checklist */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-zinc-400" />
            <span>Next Steps</span>
          </h2>

          <div className="surface-panel p-4 space-y-2">
            {[
              {
                done: Boolean(profile?.full_name && profile?.target_role),
                title: 'Set Target Role',
                link: '/profile'
              },
              {
                done: resumes.length > 0,
                title: 'Upload Latest Resume',
                link: '/upload'
              },
              {
                done: Boolean(careerRecs?.missing_skills && careerRecs.missing_skills.length > 0),
                title: 'Review Missing Skills',
                link: '/career'
              },
              {
                done: conversationCount > 0,
                title: 'Practice Interview Questions',
                link: '/chat'
              }
            ].map((step, idx) => (
              <Link
                key={idx}
                to={step.link}
                className={`p-2.5 rounded-md border flex items-center gap-2.5 transition block ${
                  step.done ? 'bg-[#0E0F12] border-[#1C1E23] text-zinc-500' : 'bg-[#16181E] border-[#262830] text-zinc-200 hover:text-white'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-zinc-500 shrink-0" />
                )}
                <span className={`text-xs ${step.done ? 'line-through' : 'font-medium'}`}>{step.title}</span>
              </Link>
            ))}
          </div>

          {/* Quick Track Pill */}
          <div className="surface-panel p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>TARGET ROLE</span>
              <Link to="/career" className="text-zinc-300 hover:underline">Skills →</Link>
            </div>
            <div className="text-xs font-semibold text-white">
              {careerRecs?.target_role || profile?.target_role || 'Not set'}
            </div>
            {careerRecs?.missing_skills && careerRecs.missing_skills.length > 0 && (
              <div className="text-[11px] text-zinc-400">
                {careerRecs.missing_skills.length} skills to acquire.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
