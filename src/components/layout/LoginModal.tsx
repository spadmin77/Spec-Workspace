import { useState } from 'react'
import { Lock, RefreshCw, X } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogCloseButton, DialogBody, DialogFooter } from '@/src/components/ui'
import { Input } from '@/src/components/ui'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string, mode: 'admin' | 'registerer') => Promise<void>
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [mode, setMode] = useState<'admin' | 'registerer'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: import('react').FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      await onLogin(email.trim(), password, mode)
      setSuccess(mode === 'admin' ? 'Logged in as Admin' : 'Logged in as Registerer')
      setTimeout(() => {
        onClose()
        setSuccess('')
        setPassword('')
      }, 800)
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
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <div>
            <DialogTitle>Sign In / መግቢያ</DialogTitle>
            <p className="text-xs text-muted-foreground font-mono">
              {mode === 'admin' ? 'Admin login' : 'Registerer login'}
            </p>
          </div>
        </div>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-4">
          <div className="flex bg-muted rounded-lg p-1 border" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'admin'}
              onClick={() => { setMode('admin'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'admin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'registerer'}
              onClick={() => { setMode('registerer'); setError(''); setSuccess('') }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === 'registerer' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registerer / መዝጋቢ
            </button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 font-medium">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-foreground">
              Email / ኢሜይል
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-foreground">
              Password / የይለፍ ቃል
            </label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-muted text-xs font-medium cursor-pointer transition-colors"
          >
            Cancel / ሰርዝ
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In / ይግቡ</span>
              </>
            )}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
