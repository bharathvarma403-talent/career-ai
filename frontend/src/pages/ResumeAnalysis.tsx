import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Upload,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

interface Issue {
  category: string
  severity: 'high' | 'medium' | 'low' | string
  description: string
  recommendation: string
}

interface AnalysisData {
  id?: number
  resume_id: number
  overall_score: number
  formatting_score?: number
  impact_score?: number
  experience_score?: number
  skills_score?: number
  section_assessment?: Record<string, { present?: boolean; quality?: string }>
  bullet_rewrites?: Array<{ original: string; rewritten: string }>
  issues?: Issue[]
  strengths?: string[]
}

const SAMPLE_ANALYSIS: AnalysisData = {
  resume_id: 1,
  overall_score: 78,
  formatting_score: 85,
  impact_score: 70,
  experience_score: 80,
  skills_score: 75,
  section_assessment: {
    contact_info: { present: true, quality: 'good' },
    summary: { present: true, quality: 'needs_quantification' },
    work_experience: { present: true, quality: 'strong_bullets' },
    education: { present: true, quality: 'good' },
    skills: { present: true, quality: 'comprehensive' },
    projects: { present: true, quality: 'good' }
  },
  bullet_rewrites: [
    {
      original: 'Worked on backend APIs and helped improve database performance.',
      rewritten:
        'Architected 8 asynchronous FastAPI REST endpoints and optimized PostgreSQL indexing, reducing p95 latency by 34%.'
    },
    {
      original: 'Responsible for leading daily standups and team sprint features.',
      rewritten:
        'Facilitated sprint planning and standups for 5 engineers, delivering 4 core feature releases on schedule.'
    },
    {
      original: 'Created machine learning models to classify customer feedback.',
      rewritten:
        'Trained and deployed fine-tuned transformer classification pipelines, achieving 92.4% accuracy across 50,000 monthly tickets.'
    }
  ],
  issues: [
    {
      category: 'Impact Metrics',
      severity: 'high',
      description: 'Work experience bullets lack quantified business outcomes and scale metrics.',
      recommendation: 'Use the XYZ formula: Accomplished [X], as measured by [Y], by doing [Z].'
    },
    {
      category: 'Action Verbs',
      severity: 'medium',
      description: 'Multiple bullets begin with passive phrases like "Responsible for" or "Assisted with".',
      recommendation: 'Replace passive verbs with high-impact engineering verbs such as "Engineered", "Architected", or "Spearheaded".'
    },
    {
      category: 'ATS Keyword Density',
      severity: 'medium',
      description: 'Key distributed systems and cloud primitives are mentioned only once.',
      recommendation: 'Integrate skills like Docker, Kubernetes, and PostgreSQL directly into project descriptions.'
    }
  ],
  strengths: [
    'Clean single-column ATS readable format',
    'Clear reverse-chronological experience hierarchy',
    'Strong balance of technical stack and practical tooling'
  ]
}

export default function ResumeAnalysis() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium'>('all')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    async function fetchAnalysis() {
      if (!resumeId) {
        setAnalysis(SAMPLE_ANALYSIS)
        setIsDemo(true)
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/resumes/${resumeId}/analysis`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!res.ok) {
          setAnalysis(SAMPLE_ANALYSIS)
          setIsDemo(true)
          return
        }

        let data: any = null
        try {
          const text = await res.text()
          data = text ? JSON.parse(text) : null
        } catch {
          data = null
        }

        if (data && typeof data.overall_score === 'number') {
          setAnalysis(data)
          setIsDemo(false)
        } else {
          setAnalysis(SAMPLE_ANALYSIS)
          setIsDemo(true)
        }
      } catch {
        setAnalysis(SAMPLE_ANALYSIS)
        setIsDemo(true)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [resumeId, token])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Loading report...</span>
      </div>
    )
  }

  const currentAnalysis = analysis || SAMPLE_ANALYSIS
  const score = currentAnalysis.overall_score || 78
  const issuesList = currentAnalysis.issues || []
  const filteredIssues = issuesList.filter((issue) => {
    if (severityFilter === 'all') return true
    return issue.severity?.toLowerCase() === severityFilter
  })

  const rewrites = currentAnalysis.bullet_rewrites && currentAnalysis.bullet_rewrites.length > 0
    ? currentAnalysis.bullet_rewrites
    : SAMPLE_ANALYSIS.bullet_rewrites!

  return (
    <div className="relative min-h-[calc(100vh-56px)] bg-[#090A0D] overflow-hidden">
      {/* Ambient background glow & grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#202227] gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <Link to="/dashboard" className="hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span>Audit #{resumeId || '1'}</span>
              {isDemo && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                  Sample Audit
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Resume Diagnostic</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target analysis for <span className="text-zinc-200 font-medium">{localStorage.getItem('last_uploaded_filename') || 'Software_Engineering_Resume.pdf'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/chat"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span>Career Chat</span>
            </Link>
            <Link
              to="/upload"
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New</span>
            </Link>
          </div>
        </div>

        {/* Score Overview */}
        <div className="surface-panel p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            <div className="sm:col-span-1 p-3 rounded-lg bg-[#0E0F12] border border-[#202227] text-center">
              <span className="text-3xl font-bold text-white font-mono tabular-data">{score}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">/ 100 ATS Score</span>
            </div>

            <div className="sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Formatting', score: currentAnalysis.formatting_score ?? 85 },
                { label: 'Impact Metrics', score: currentAnalysis.impact_score ?? 70 },
                { label: 'Experience', score: currentAnalysis.experience_score ?? 80 },
                { label: 'Skills Coverage', score: currentAnalysis.skills_score ?? 75 }
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
          </div>

          {/* Section Status Pills */}
          {currentAnalysis.section_assessment && (
            <div className="pt-3 border-t border-[#1E2026] flex flex-wrap gap-2 text-xs">
              {Object.entries(currentAnalysis.section_assessment).map(([key, secData]) => {
                const formattedName = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                return (
                  <div key={key} className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#202227] flex items-center gap-1.5 text-zinc-300 text-[11px]">
                    {secData.present !== false ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{formattedName}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Suggested Bullet Rewrites */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span>Suggested Rewrites</span>
            </h2>
            <div className="text-[11px] text-zinc-400 font-mono">{rewrites.length} recommendations</div>
          </div>

          <div className="space-y-3">
            {rewrites.map((rw, idx) => (
              <div key={idx} className="surface-panel p-4 space-y-3 border border-[#22242A]">
                {/* Original */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Original</div>
                  <div className="p-2.5 rounded bg-[#0E0F12] border border-[#202227] diff-del text-xs font-mono">
                    {rw.original}
                  </div>
                </div>

                {/* Rewrite */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400">
                    <span className="text-emerald-400">Suggested Rewrite</span>
                    <button
                      onClick={() => copyToClipboard(rw.rewritten, idx)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-white transition px-2 py-0.5 rounded bg-[#16181E] border border-[#262830]"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-mono">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="font-mono">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded bg-[#0E0F12] border border-[#202227] diff-add text-xs font-mono">
                    {rw.rewritten}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Section Opportunities */}
        {filteredIssues.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Identified Issues</h2>
              <div className="flex items-center gap-1 bg-[#141519] p-0.5 rounded border border-[#22242A]">
                {(['all', 'high', 'medium'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSeverityFilter(lvl)}
                    className={`px-2.5 py-1 text-[11px] rounded capitalize transition ${
                      severityFilter === lvl ? 'bg-[#1F222A] text-white font-medium' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredIssues.map((issue, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{issue.category}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                        issue.severity === 'high'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-zinc-400">{issue.description}</p>
                  {issue.recommendation && (
                    <p className="text-[11px] text-zinc-300 font-medium pt-1.5 border-t border-[#1C1E23]">
                      Recommendation: {issue.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {currentAnalysis.strengths && currentAnalysis.strengths.length > 0 && (
          <div className="surface-panel p-4 space-y-2">
            <div className="text-xs font-semibold text-white">Identified Strengths</div>
            <div className="flex flex-wrap gap-1.5">
              {currentAnalysis.strengths.map((str, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#202227] text-zinc-300 text-xs">
                  {str}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
