import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  BarChart2,
  Compass,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const token = localStorage.getItem('token')
  const userEmail = localStorage.getItem('email')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('email')
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const navLinks = [
    { label: 'Overview', path: '/' },
    ...(token
      ? [
          { label: 'Dashboard', path: '/dashboard', icon: BarChart2 },
          { label: 'Resume', path: '/upload', icon: FileText },
          { label: 'Career', path: '/career', icon: Compass },
          { label: 'Chat', path: '/chat', icon: MessageSquare },
          { label: 'Profile', path: '/profile', icon: User }
        ]
      : [
          { label: 'Resume', path: '/login', icon: FileText },
          { label: 'Career', path: '/login', icon: Compass },
          { label: 'Chat', path: '/login', icon: MessageSquare }
        ])
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0C0E]/90 backdrop-blur-md border-b border-[#202227]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Mark */}
          <Link
            to={token ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-7 h-7 rounded-md bg-[#181A1F] border border-[#272A31] flex items-center justify-center font-mono font-bold text-xs text-white">
              C/
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#EDEDEE]">
              Career<span className="text-zinc-400">AI</span>
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#181A1F] text-[#EDEDEE] border border-[#282B33]'
                      : 'text-[#9B9EA7] hover:text-[#EDEDEE] hover:bg-[#121316]'
                  }`}
                >
                  {link.icon && (
                    <link.icon className="w-3.5 h-3.5 opacity-70" />
                  )}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-md bg-[#121316] border border-[#22242A] text-xs text-[#9B9EA7] max-w-[160px] truncate tabular-data">
                  {userEmail || 'Account'}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#181A1F] rounded-md transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition font-sans"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md bg-[#121316] text-zinc-300 border border-[#22242A]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0E0F12] border-b border-[#202227] px-4 py-3 space-y-1">
          {token && (
            <div className="px-3 py-2 text-xs text-zinc-400 border-b border-[#202227] flex items-center justify-between mb-2">
              <span className="truncate">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1"
              >
                Sign Out
              </button>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive(link.path)
                  ? 'bg-[#181A1F] text-white border border-[#282B33]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              <span>{link.label}</span>
            </Link>
          ))}

          {!token && (
            <div className="pt-2 border-t border-[#202227] grid grid-cols-2 gap-2 mt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-xs font-medium text-zinc-300 bg-[#121316] rounded-md border border-[#22242A]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-xs font-medium text-zinc-950 bg-white rounded-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
