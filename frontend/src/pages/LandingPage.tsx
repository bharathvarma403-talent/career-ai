import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  MessageSquare
} from 'lucide-react'

export default function LandingPage() {
  const token = localStorage.getItem('token')
  const [activeTab, setActiveTab] = useState<'diff' | 'matrix'>('diff')

  return (
    <div className="relative min-h-screen bg-[#090A0D] text-[#EDEDEE] overflow-hidden">
      {/* Ambient background glow & grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.14),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 border-b border-[#202227]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141519] border border-[#242730] text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>AI Career & Resume Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            Get actionable feedback <br className="hidden sm:inline" />
            on your resume.
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Instant ATS section scoring, metric-driven bullet rewrites, and skill gap roadmaps for your target role.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={token ? '/upload' : '/register'}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to={token ? '/career' : '/login'}
              className="px-5 py-2.5 rounded-lg text-xs font-medium text-zinc-300 bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              <span>Explore Roles</span>
            </Link>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
          <div className="surface-panel overflow-hidden border border-[#22242A]">
            <div className="px-4 py-2.5 bg-[#0E0F12] border-b border-[#202227] flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">Preview</span>

              <div className="flex items-center gap-1 bg-[#141519] p-0.5 rounded border border-[#22242A]">
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    activeTab === 'diff' ? 'bg-[#1F222A] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Bullet Rewrite
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    activeTab === 'matrix' ? 'bg-[#1F222A] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Skill Match
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {activeTab === 'diff' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1E2026]">
                    <span className="font-mono text-zinc-400 text-[11px]">Work Experience</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Needs Metrics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-1.5">
                      <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Before</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono">
                        "Worked on backend APIs and helped improve database performance."
                      </p>
                      <p className="text-[11px] text-zinc-500 pt-1">
                        Vague verb, zero measurable impact.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-1.5">
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Suggested Rewrite</span>
                      </div>
                      <p className="text-xs text-zinc-100 font-mono">
                        "Architected 8 FastAPI microservices, reducing p99 latency by 38% across 120k users."
                      </p>
                      <p className="text-[11px] text-emerald-400/80 pt-1">
                        Action-oriented, stack specified, quantified result.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1E2026]">
                    <span className="font-medium text-white">Target: AI Systems Engineer</span>
                    <span className="text-emerald-400 font-mono text-xs">78% Match</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2">
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Skills You Have</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'REST APIs'].map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-xs bg-[#16181E] border border-[#262830] text-zinc-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#0E0F12] border border-[#202227] space-y-2">
                      <div className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Skills to Learn</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['Vector DBs', 'RAG Pipelines', 'Model Benchmarking'].map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-xs bg-[#16181E] border border-[#2A261A] text-amber-300">
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

      {/* 3 Core Features */}
      <section className="py-16 border-b border-[#202227]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-panel p-6 space-y-2.5">
              <div className="w-8 h-8 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center text-zinc-300">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">ATS Diagnostics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Detects unparseable sections, weak headers, and passive phrasing before applications go out.
              </p>
            </div>

            <div className="surface-panel p-6 space-y-2.5">
              <div className="w-8 h-8 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center text-zinc-300">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Skill Gap Mapping</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Benchmarks your verified stack against real engineering job requirements.
              </p>
            </div>

            <div className="surface-panel p-6 space-y-2.5">
              <div className="w-8 h-8 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center text-zinc-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Career Mentor</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Contextual career chat pre-loaded with your resume and profile data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Ready to improve your resume?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Upload your PDF or DOCX file to get an instant score and bullet rewrites.
          </p>
          <div className="pt-2">
            <Link
              to={token ? '/upload' : '/register'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition"
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
