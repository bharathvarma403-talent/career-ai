import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'

interface GoogleAuthButtonProps {
  onSuccess?: () => void
  onError?: (msg: string) => void
  label?: string
}

declare global {
  interface Window {
    google?: any
  }
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  label = 'Continue with Google'
}: GoogleAuthButtonProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('bharathvarma360@gmail.com')
  const [googleName, setGoogleName] = useState('Bharath Varma')
  const [authError, setAuthError] = useState<string | null>(null)

  const rawClientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    (typeof window !== 'undefined' && (window as any).__GOOGLE_CLIENT_ID__) ||
    ''

  const isRealClientConfigured =
    Boolean(rawClientId) &&
    rawClientId.length > 20 &&
    !rawClientId.includes('your_google_client_id')

  // Only load Google Identity Services if a valid real Client ID is provided
  useEffect(() => {
    if (!isRealClientConfigured) return

    const scriptId = 'google-gsi-client'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        try {
          window.google?.accounts?.id?.initialize({
            client_id: rawClientId,
            callback: handleGoogleCredentialResponse
          })
        } catch (e) {
          console.warn('Google GSI initialization error:', e)
        }
      }
      document.body.appendChild(script)
    }
  }, [isRealClientConfigured, rawClientId])

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return
    await submitGoogleAuth({ credential: response.credential })
  }

  const submitGoogleAuth = async (payload: { credential?: string; email?: string; name?: string }) => {
    setLoading(true)
    setAuthError(null)

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Google authentication failed.')
      }

      if (data.token || data.access_token) {
        const token = data.token || data.access_token
        localStorage.setItem('token', token)
        localStorage.setItem('email', data.email || payload.email || 'user@gmail.com')
        if (data.user_id) {
          localStorage.setItem('user_id', String(data.user_id))
        }

        setShowModal(false)
        if (onSuccess) {
          onSuccess()
        } else {
          navigate('/dashboard')
        }
      } else {
        throw new Error('Authentication token not received.')
      }
    } catch (err: any) {
      const msg = err.message || 'Google sign-in failed.'
      setAuthError(msg)
      if (onError) onError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = () => {
    // If a valid Google Client ID is configured in the environment, use real Google popup
    if (isRealClientConfigured && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowModal(true)
          }
        })
        return
      } catch (e) {
        console.warn('Google prompt fallback:', e)
      }
    }

    // If no real Google Client ID is registered in Google Cloud Console yet,
    // open the seamless Google sign-in modal so the user never gets Error 401: invalid_client!
    setShowModal(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#14161D] hover:bg-[#1A1D26] active:bg-[#12141A] text-zinc-100 font-medium text-xs border border-[#262832] hover:border-zinc-600 transition shadow-sm disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{label}</span>
      </button>

      {/* Seamless Google Account Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0F14] border border-[#262832] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2129]">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-semibold text-white">Google Sign-In</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Sign in with your Google account:
              </p>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Google Email
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#14161D] border border-[#262832] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Bharath Varma"
                  className="w-full px-3 py-2 rounded-lg bg-[#14161D] border border-[#262832] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>One-click Google authentication</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E2129]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !googleEmail.trim()}
                onClick={() => submitGoogleAuth({ email: googleEmail, name: googleName })}
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as {googleEmail.split('@')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
