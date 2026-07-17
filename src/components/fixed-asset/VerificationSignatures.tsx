import { CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/src/components/ui'

interface VerificationSignaturesProps {
  countedBy: string
  onCountedByChange: (value: string) => void
  employeeName: string
  date: string
  onDateChange: (value: string) => void
  canAdd: boolean
  canEdit: boolean
  editingRecordId: string | null
  isSaving: boolean
  saveMessage: { type: 'success' | 'error'; text: string } | null
  onClearMessage: () => void
  onSave: () => void
  onCancelEdit: () => void
}

export function VerificationSignatures({
  countedBy,
  onCountedByChange,
  employeeName,
  date,
  onDateChange,
  canAdd,
  canEdit,
  editingRecordId,
  isSaving,
  saveMessage,
  onClearMessage,
  onSave,
  onCancelEdit,
}: VerificationSignaturesProps) {
  return (
    <Card className="bg-foreground text-background border-foreground [&_p]:text-background/60 [&_h3]:text-background">
      <CardHeader>
        <CardTitle className="text-background text-sm">3. Verification / ፊርማ እና ማረጋገጫ</CardTitle>
        <CardDescription className="text-background/60">
          Signatures append at the bottom of the exported sheet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {saveMessage && (
          <div className={`mb-4 flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-xs font-medium ${
            saveMessage.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-200 border border-red-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{saveMessage.text}</span>
            </div>
            <button onClick={onClearMessage} className="p-0.5 hover:bg-background/10 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-background/70 mb-1">
              Counted By / ባለሙያ
            </label>
            <input
              value={countedBy}
              onChange={(e) => onCountedByChange(e.target.value)}
              placeholder="Name of analyst"
              className="w-full px-3 py-2 text-xs bg-background/10 border border-background/20 rounded-lg text-background placeholder:text-background/40 focus:outline-hidden focus:ring-2 focus:ring-ring/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-background/70 mb-1">
              Verified By / ኃላፊ
            </label>
            <input
              value={employeeName}
              readOnly
              tabIndex={-1}
              placeholder="Auto-filled from Employee Name"
              className="w-full px-3 py-2 text-xs bg-background/10 border border-background/20 rounded-lg text-background/80 placeholder:text-background/40 cursor-default opacity-80"
              title="Auto-synced with Employee Name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-background/70 mb-1">
              Date / ቀን
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background/10 border border-background/20 rounded-lg text-background focus:outline-hidden focus:ring-2 focus:ring-ring/50 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-background/20">
          <p className="text-[11px] text-background/50">
            * Ensure all serial numbers and physical checks are complete.
          </p>
          <div className="flex items-center gap-2">
            {editingRecordId && (
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={isSaving}
                className="px-4 py-2.5 bg-background/10 hover:bg-background/20 border border-background/20 text-background/70 hover:text-background rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Edit / ሰርዝ
              </button>
            )}
            {(canAdd || canEdit) && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {editingRecordId ? 'Update Record / አስተካክል' : 'Save Record / አስቀምጥ'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
