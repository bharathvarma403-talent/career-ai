import { Link } from 'react-router-dom'

export default function Footer() {
  const token = localStorage.getItem('token')

  return (
    <footer className="border-t border-[#202227] bg-[#090A0C] text-[#9B9EA7] text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Identity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center font-mono font-bold text-[10px] text-white">
                C/
              </div>
              <span className="font-semibold text-xs tracking-tight text-[#EDEDEE]">
                CareerAI
              </span>
            </div>
            <p className="text-zinc-500 text-xs">
              AI resume feedback and career guidance.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400">
            {token ? (
              <>
                <Link to="/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
                <Link to="/upload" className="hover:text-white transition">
                  Resume
                </Link>
                <Link to="/career" className="hover:text-white transition">
                  Career
                </Link>
                <Link to="/chat" className="hover:text-white transition">
                  Chat
                </Link>
                <Link to="/profile" className="hover:text-white transition">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-white transition">
                  Sign In
                </Link>
                <Link to="/register" className="hover:text-white transition">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Copyright */}
          <div className="text-[11px] text-zinc-600 sm:text-right">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
