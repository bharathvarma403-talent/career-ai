import { Link } from 'react-router-dom'
import { Shield, Terminal } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[#202227] bg-[#090A0C] text-[#9B9EA7] text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center font-mono font-bold text-[10px] text-white">
                C/
              </div>
              <span className="font-semibold text-xs tracking-tight text-[#EDEDEE]">
                CareerAI
              </span>
            </div>
            <p className="text-zinc-400 text-xs max-w-sm leading-relaxed">
              Professional career development infrastructure. Providing deterministic ATS section diagnostics, skill taxonomy mapping, and contextual career mentorship.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#121316] border border-[#22242A] text-[11px] text-zinc-300 tabular-data">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Backend API: Online</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#121316] border border-[#22242A] text-[11px] text-zinc-400 tabular-data">
                <Terminal className="w-3 h-3 text-zinc-400" />
                <span>FastAPI 0.115 / SQLite</span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-2.5">
              Platform
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>
                <Link to="/upload" className="hover:text-white transition">
                  Resume ATS Diagnostics
                </Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-white transition">
                  Skill Taxonomy Mapping
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-white transition">
                  Career Mentorship Studio
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  Candidate Dossier
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Security */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-2.5">
              Security & Data
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Isolated User Data</span>
              </li>
              <li>
                <span>Strict JWT Token Extraction</span>
              </li>
              <li>
                <span>Deterministic Scoring Engine</span>
              </li>
              <li>
                <span>Local Development Ready</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#1C1E23] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div>© {new Date().getFullYear()} CareerAI Platform. Engineered for technical career mobility.</div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Production Grade Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
