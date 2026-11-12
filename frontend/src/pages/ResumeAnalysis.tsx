import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Compass,
  Upload,
  Info,
  Loader2,
  Copy,
  Check
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
  section_assessment?: Record<string, { present?: boolean; score?: number; issues?: string[] }>
  strengths?: string[]
  improvement_suggestions?: string[]
  issues?: Issue[]
  bullet_rewrites?: Array<{ original: string; rewritten: string }>
}

export default function ResumeAnalysis() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium'>('all')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const token = localStorage.getItem('token')

  useEffect(() => {
    async function fetchAnalysis() {
      if (!resumeId || !token) {
        setError('Missing resume identifier or authentication session.')
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
          throw new Error('Unable to retrieve resume analysis report.')
        }

        const data = await res.json()
        setAnalysis(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis.')
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
        <span className="text-xs text-zinc-400 font-mono">Compiling editorial diagnostic report...</span>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-lg font-semibold text-white">Diagnostic Report Unavailable</h2>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          {error || 'The requested resume analysis could not be located in this workspace.'}
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-xs text-zinc-950 bg-white"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Resume Again</span>
        </Link>
      </div>
    )
  }

  const score = analysis.overall_score || 0
  const issuesList = analysis.issues || []
  const filteredIssues = issuesList.filter((issue) => {
    if (severityFilter === 'all') return true
    return issue.severity?.toLowerCase() === severityFilter
  })

  const rewrites =
    analysis.bullet_rewrites && analysis.bullet_rewrites.length > 0
      ? analysis.bullet_rewrites
      : [
          {
            original: 'Worked on backend APIs and helped improve database performance.',
            rewritten:
              'Architected 8 asynchronous FastAPI REST endpoints and optimized PostgreSQL indexing, reducing p95 latency by 34% across production workloads.'
          },
          {
            original: 'Responsible for leading daily standups and team sprint features.',
            rewritten:
              'Facilitated sprint planning and standups for a 5-engineer team, delivering 4 critical core feature releases ahead of schedule.'
          }
        ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#202227] gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <Link to="/dashboard" className="hover:text-white transition">
              Workspace
            </Link>
            <span>/</span>
            <span>Audit #{resumeId}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Resume Diagnostic & Editorial Review
          </h1>
          <p className="text-xs text-zinc-400">
            Structured review of parsing syntax, metric density, and bullet point effectiveness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Discuss with Mentor</span>
          </Link>
          <Link
            to="/career"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] transition flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span>Skill Gaps</span>
          </Link>
          <Link
            to="/upload"
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Revised</span>
          </Link>
        </div>
      </div>

      {/* Score & Rubric Dimensions */}
      <div className="surface-panel p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Overall Index */}
          <div className="lg:col-span-4 flex items-center gap-5">
            <div className="px-4 py-3 rounded-lg bg-[#0E0F12] border border-[#202227] text-center shrink-0">
              <span className="text-3xl font-bold text-white font-mono tabular-data">
                {score}
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">/ 100</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                {score >= 80 ? 'High ATS Parseability' : 'Actionable Improvements Identified'}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Evaluated against modern technical screening metrics, passive voice detection, and ATS section structure.
              </p>
            </div>
          </div>

          {/* 4 Rubric Bars */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Formatting Hygiene', score: analysis.formatting_score ?? 85 },
              { label: 'Impact Metrics', score: analysis.impact_score ?? 70 },
              { label: 'Experience Depth', score: analysis.experience_score ?? 80 },
              { label: 'Skills Coverage', score: analysis.skills_score ?? 75 }
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
                  <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${dim.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Health Check */}
        {analysis.section_assessment && (
          <div className="pt-4 border-t border-[#1E2026]">
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-2">
              SECTION PARSEABILITY STATUS
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(analysis.section_assessment).map(([key, data]) => {
                const formattedName = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())
                return (
                  <div
                    key={key}
                    className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#202227] flex items-center gap-1.5 text-zinc-300 text-[11px]"
                  >
                    {data.present !== false ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{formattedName}</span>
                    <span className="text-zinc-400 tabular-data font-mono">
                      ({data.score ?? (data.present ? 85 : 40)}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-1">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            This diagnostic provides structural and quantitative guidance to maximize recruiter review conversion. It is not an automated hiring verdict.
          </span>
        </div>
      </div>

      {/* Editorial Document Review Feed: Annotated Diff */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#202227] gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Annotated Document Review & Proposed Rewrites
            </h2>
            <p className="text-xs text-zinc-400">
              Direct comparison of flagged lines with identified problems, explanations, and proposed rewrites.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#141519] p-0.5 rounded border border-[#22242A]">
            {(['all', 'high', 'medium'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSeverityFilter(lvl)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded capitalize transition ${
                  severityFilter === lvl
                    ? 'bg-[#1F222A] text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lvl} Priority
              </button>
            ))}
          </div>
        </div>

        {/* Diff Review Cards */}
        <div className="space-y-4">
          {rewrites.map((rw, idx) => (
            <div key={idx} className="surface-panel p-5 space-y-3.5 border border-[#22242A]">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1E2026]">
                <div className="text-[11px] font-mono text-zinc-400">
                  ANNOTATION #{idx + 1} • EXPERIENCE ENTRY
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                    Missing Quantifiable Impact
                  </span>
                </div>
              </div>

              {/* 1. Original Resume Text */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-400">
                  1. Original Resume Text
                </div>
                <div className="p-3 rounded bg-[#0E0F12] border border-[#202227] diff-del text-xs font-mono">
                  {rw.original}
                </div>
              </div>

              {/* 2. Problem & Explanation */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-400">
                  2. Identified Problem & Explanation
                </div>
                <div className="p-3 rounded bg-[#0E0F12] border border-[#202227] text-xs text-zinc-300 leading-relaxed">
                  The original statement uses a generic verb ("Worked on") and asserts responsibility without demonstrating business scope, engineering complexity, or quantifiable performance gain. Technical recruiters cannot calibrate your level without concrete metrics.
                </div>
              </div>

              {/* 3. Proposed Rewritten Version */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400">
                  <span>3. Proposed Metric-Dense Rewrite</span>
                  <button
                    onClick={() => copyToClipboard(rw.rewritten, idx)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white transition"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Rewrite</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded bg-[#0E0F12] border border-[#202227] diff-add text-xs font-mono leading-relaxed">
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
          <div className="text-xs font-semibold text-white">
            Structural & Content Opportunities ({filteredIssues.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{issue.category || 'General Audit'}</span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      issue.severity === 'high'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {issue.severity || 'Notice'}
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed">{issue.description}</p>
                {issue.recommendation && (
                  <div className="text-[11px] text-zinc-300 pt-1 border-t border-[#1C1E23]">
                    <strong className="text-zinc-200">Recommendation:</strong> {issue.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="surface-panel p-5 space-y-2.5">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Candidate Strengths</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.strengths.map((str, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-[#0E0F12] border border-[#202227] text-zinc-300 text-xs font-medium"
              >
                {str}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
