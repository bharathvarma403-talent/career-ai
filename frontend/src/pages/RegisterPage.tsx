import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isPasswordLongEnough = password.length >= 6
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields.')
      return
    }

    if (!isPasswordLongEnough) {
      setError('Password must contain at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and retry.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Please review your information.')
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('email', data.email || email)
        if (data.user_id) {
          localStorage.setItem('user_id', String(data.user_id))
        }
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-[#0B0C0E]">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#181A1F] border border-[#272A31] font-mono font-bold text-xs text-white mb-1">
            C/
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your details to get started.
          </p>
        </div>

        {/* Form Container */}
        <div className="surface-panel p-6 space-y-5 border border-[#22242A]">
          {error && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-3 pr-9 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 rounded-md bg-[#0E0F12] border border-[#262830] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            {/* Validation Feedback */}
            <div className="space-y-1 pt-1 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3 h-3 ${
                    isPasswordLongEnough ? 'text-emerald-400' : 'text-zinc-600'
                  }`}
                />
                <span className={isPasswordLongEnough ? 'text-zinc-200' : 'text-zinc-500'}>
                  At least 6 characters
                </span>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3 h-3 ${
                      doPasswordsMatch ? 'text-emerald-400' : 'text-zinc-600'
                    }`}
                  />
                  <span className={doPasswordsMatch ? 'text-zinc-200' : 'text-zinc-500'}>
                    Passwords match
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md font-medium text-xs text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[#1C1E23] text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
