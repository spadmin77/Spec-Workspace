import { Pencil, X } from 'lucide-react'
import { useDepartmentStyles } from '@/src/hooks'
import type { FixedAssetRecord } from '@/src/types'
import type { MouseEvent } from 'react'

export interface RecordCardProps {
  record: FixedAssetRecord
  isSelected: boolean
  canEdit: boolean
  onSelect: (id: string) => void
  onEdit: (record: FixedAssetRecord) => void
  onDelete: (id: string, e: MouseEvent) => void
}

export function RecordCard({ record, isSelected, canEdit, onSelect, onEdit, onDelete }: RecordCardProps) {
  const style = useDepartmentStyles(record.header.department)

  return (
    <div
      onClick={() => onSelect(record.id)}
      className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-primary bg-card shadow-xs border-primary/30'
          : 'bg-muted/30 hover:bg-card hover:shadow-xs border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h5 className="font-semibold text-sm truncate">
            {record.header.employeeName}
          </h5>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.badge}`}>
            {record.header.department}
          </span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(record) }}
              className="p-1 text-muted-foreground hover:text-amber-600 hover:bg-muted rounded-md transition-colors cursor-pointer"
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => onDelete(record.id, e)}
              className="p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors cursor-pointer"
              title="Delete"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2 font-mono">
        <span>ID: {record.header.employeeNo}</span>
        <span className="font-semibold text-foreground">{record.rows.length} Items</span>
      </div>
    </div>
  )
}
