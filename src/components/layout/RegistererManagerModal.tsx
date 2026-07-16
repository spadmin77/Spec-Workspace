import { useState, useEffect } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogCloseButton, DialogBody } from '@/src/components/ui'
import { Input } from '@/src/components/ui'
import type { RegistererAccount } from '@/src/hooks/useAuth'

interface RegistererManagerModalProps {
  isOpen: boolean
  onClose: () => void
  apiCall: (path: string, options?: RequestInit) => Promise<any>
}

export function RegistererManagerModal({ isOpen, onClose, apiCall }: RegistererManagerModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [registerers, setRegisterers] = useState<RegistererAccount[]>([])

  const fetchRegisterers = async () => {
    try {
      const data = await apiCall('/api/registerers')
      setRegisterers(data.registerers || [])
    } catch (err: any) {
      console.error('Failed to fetch registerers:', err)
    }
  }

  useEffect(() => {
    if (isOpen) fetchRegisterers()
  }, [isOpen])

  const handleCreate = async (e: import('react').FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      await apiCall('/api/registerers', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      setSuccess(`Registerer ${email.trim()} created!`)
      setEmail('')
      setPassword('')
      await fetchRegisterers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (uid: string, email: string) => {
    if (!window.confirm(`Delete registerer ${email}?`)) return
    try {
      await apiCall(`/api/registerers/${uid}`, { method: 'DELETE' })
      setRegisterers((prev) => prev.filter((r) => r.uid !== uid))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <div>
            <DialogTitle>Manage Registerers / መዝጋቢዎች አስተዳደር</DialogTitle>
            <p className="text-xs text-muted-foreground font-mono">Create or remove registerer accounts</p>
          </div>
        </div>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <DialogBody className="space-y-5">
        <form onSubmit={handleCreate} className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide">Add Registerer / ጨምር</h4>

          {error && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">{success}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reg@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Password (6+ chars)</label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Creating...' : 'Create Registerer'}</span>
            </button>
          </div>
        </form>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold uppercase tracking-wide">Existing ({registerers.length})</h4>
            <button onClick={fetchRegisterers} className="text-xs text-primary hover:underline cursor-pointer">
              Refresh
            </button>
          </div>

          {registerers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No registerers yet.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {registerers.map((reg) => (
                <div key={reg.uid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="text-xs font-mono truncate">{reg.email}</span>
                  <button onClick={() => handleDelete(reg.uid, reg.email)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogBody>
    </Dialog>
  )
}
