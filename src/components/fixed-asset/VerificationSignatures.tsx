import { CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/src/components/ui'

interface VerificationSignaturesProps {
  countedBy: string
  onCountedByChange: (value: string) => void
  username: string
  onUsernameChange: (value: string) => void
  date: string
  onDateChange: (value: string) => void
  canAdd: boolean
  canEdit: boolean
  editingRecordId: string | null
  onSave: () => void
  onCancelEdit: () => void
}

export function VerificationSignatures({
  countedBy,
  onCountedByChange,
  username,
  onUsernameChange,
  date,
  onDateChange,
  canAdd,
  canEdit,
  editingRecordId,
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
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Verified manager"
              className="w-full px-3 py-2 text-xs bg-background/10 border border-background/20 rounded-lg text-background placeholder:text-background/40 focus:outline-hidden focus:ring-2 focus:ring-ring/50 transition-all"
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
                className="px-4 py-2.5 bg-background/10 hover:bg-background/20 border border-background/20 text-background/70 hover:text-background rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel Edit / ሰርዝ
              </button>
            )}
            {(canAdd || canEdit) && (
              <button
                onClick={onSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {editingRecordId ? 'Update Record / አስተካክል' : 'Save Record / አስቀምጥ'}
                </span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
