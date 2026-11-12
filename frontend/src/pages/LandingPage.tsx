import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react'

export default function LandingPage() {
  const token = localStorage.getItem('token')
  const [activeTab, setActiveTab] = useState<'diff' | 'matrix'>('diff')

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDEE]">
      {/* Hero Section */}
      <section className="pt-16 pb-20 border-b border-[#202227]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#121316] border border-[#22242A] text-[11px] font-medium text-zinc-400 tabular-data">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Career Intelligence Engine</span>
              <span className="text-zinc-600">/</span>
              <span>v2.4 Production</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
              Career architecture for engineers and technical professionals.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl font-normal">
              CareerAI evaluates your resume against rigorous technical screening rubrics, identifies concrete competency gaps against target roles, and prepares you with contextual mentorship.
            </p>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={token ? '/upload' : '/register'}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Audit Your Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to={token ? '/career' : '/login'}
                className="px-5 py-2.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] transition flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-zinc-400" />
                <span>Explore Skill Taxonomy</span>
              </Link>
            </div>
          </div>

          {/* Interactive Product Dossier Showcase */}
          <div className="mt-14 surface-panel overflow-hidden border border-[#22242A]">
            {/* Window Topbar */}
            <div className="px-4 py-2.5 bg-[#0E0F12] border-b border-[#202227] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  audit_ledger_candidate_report.json
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-[#141519] p-0.5 rounded border border-[#22242A]">
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition ${
                    activeTab === 'diff'
                      ? 'bg-[#1F222A] text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Document Review Diff
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition ${
                    activeTab === 'matrix'
                      ? 'bg-[#1F222A] text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Competency Balance Sheet
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="p-6">
              {activeTab === 'diff' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-[#1E2026]">
                    <div className="text-zinc-400 font-mono text-[11px]">
                      SECTION: EXPERIENCE / SENIOR SOFTWARE ENGINEER
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Missing Business Metric
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Passive Phrasing
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Entry */}
                    <div className="p-4 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2">
                      <div className="text-[10px] font-mono uppercase text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Original Candidate Submission</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                        "Worked on backend APIs and helped improve database performance for our customer dashboard."
                      </p>
                      <div className="pt-2 text-[11px] text-zinc-400 border-t border-[#1C1E23]">
                        <strong className="text-zinc-300">Diagnostic:</strong> Weak verb ("Worked on") and zero quantifiable metric. Does not convey scope, architecture, or performance gain.
                      </div>
                    </div>

                    {/* Proposed Rewrite */}
                    <div className="p-4 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Proposed Metric-Dense Rewrite</span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed font-mono">
                        "Architected 8 asynchronous FastAPI microservices and optimized PostgreSQL indexing, reducing p99 latency by 38% across 120k daily active users."
                      </p>
                      <div className="pt-2 text-[11px] text-zinc-400 border-t border-[#1C1E23]">
                        <strong className="text-zinc-300">Improvement:</strong> High-impact technical verbs, explicit technology attribution, concrete p99 latency reduction and traffic scale.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-[#1E2026]">
                    <div>
                      <span className="text-zinc-400 font-mono text-[11px] block">TARGET TRACK:</span>
                      <strong className="text-white text-sm">AI Systems & ML Infrastructure Engineer</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 font-mono text-[11px] block">READINESS INDEX:</span>
                      <strong className="text-emerald-400 text-sm tabular-data font-mono">78% Match</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified In Profile (6 Core Competencies)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Python 3', 'FastAPI', 'PostgreSQL', 'Docker', 'RESTful API Design', 'Git Workflow'].map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[11px] bg-[#16181E] border border-[#262830] text-zinc-300 tabular-data"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2">
                      <div className="text-[10px] font-mono uppercase text-amber-400 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>High-Priority Gaps To Close (4 Areas)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Vector DB Indexing', 'Model Evaluation & Benchmarking', 'LangChain / RAG', 'Distributed Inference'].map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[11px] bg-[#16181E] border border-[#2A261A] text-amber-300/90 tabular-data"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section (3 Concrete Pillars) */}
      <section className="py-20 border-b border-[#202227]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono uppercase text-zinc-400 tracking-wider mb-2">
              Platform Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">
              An engineering approach to candidate readiness.
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              CareerAI replaces vague motivational coaching with structured rubric audits, deterministic skill gap analysis, and grounded interview preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-panel p-6 space-y-3">
              <div className="text-xs font-mono text-zinc-400">01 / DIAGNOSTICS</div>
              <h3 className="text-base font-semibold text-white">
                Deterministic ATS Syntax Inspection
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Evaluates document parsing readiness across contact info, professional summary, employment chronology, and technical skills. Identifies missing section headers and unparseable formatting before recruiters see it.
              </p>
            </div>

            <div className="surface-panel p-6 space-y-3">
              <div className="text-xs font-mono text-zinc-400">02 / TAXONOMY</div>
              <h3 className="text-base font-semibold text-white">
                Role-Calibrated Skill Gap Trees
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cross-references your verified stack against current industry requirements across backend, frontend, platform, and AI engineering tracks to pinpoint exactly what technical competencies you need to demonstrate.
              </p>
            </div>

            <div className="surface-panel p-6 space-y-3">
              <div className="text-xs font-mono text-zinc-400">03 / MENTORSHIP</div>
              <h3 className="text-base font-semibold text-white">
                Context-Grounded Technical Chat
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A multi-turn conversation studio pre-loaded with your actual resume audit scores and profile history. Practice technical explanations, refine architecture bullet points, and prepare for system design questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Data Standards */}
      <section className="py-16 border-b border-[#202227] bg-[#0E0F12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-white">Zero Fabricated Metrics</div>
              <p className="text-zinc-400">
                Scores reflect real section completeness and metric density calculations.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-white">Local-First Architecture</div>
              <p className="text-zinc-400">
                Fallback heuristics allow local operation even when remote databases are offline.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-white">Strict Data Isolation</div>
              <p className="text-zinc-400">
                Resumes, profiles, and chats are isolated per user via SQLAlchemy cascades.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-white">Actionable Output Only</div>
              <p className="text-zinc-400">
                Every identified defect includes a concrete proposed rewritten bullet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            Audit your resume with technical precision.
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Upload your PDF or DOCX file to generate an annotated document review and receive targeted bullet rewrites.
          </p>
          <div className="pt-2">
            <Link
              to={token ? '/upload' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition"
            >
              <span>Get Started</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
