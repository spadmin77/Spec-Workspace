import { useState } from 'react'
import { RefreshCw, FileSpreadsheet, Eye, EyeOff, UserCheck } from 'lucide-react'
import { Input } from '@/src/components/ui'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: import('react').FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await onLogin(email.trim(), password)
    } catch (err: any) {
      const code = err?.code || ''
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Incorrect email or password.'
          : code === 'auth/too-many-requests'
            ? 'Too many attempts. Try again later.'
            : err?.message || 'Login failed.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg mb-4">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              የንብረት ቁጥጥር{' '}
              <span className="text-primary">WORKSPACE</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Bilingual Inventory Manager
            </p>
          </div>

          <div className="bg-card border rounded-xl shadow-sm p-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 font-medium mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Email / ኢሜይል
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Password / የይለፍ ቃል
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-xs mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Sign In / ይግቡ</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-6 font-mono">
            &copy; 2026 Asset Inventory Management App
          </p>
        </div>
      </div>
    </div>
  )
}
