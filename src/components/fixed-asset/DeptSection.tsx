import { ChevronDown, ChevronRight, Download } from 'lucide-react'
import { Badge } from '@/src/components/ui'
import { RecordCard } from './RecordCard'
import { useDepartmentStyles } from '@/src/hooks'
import { exportFixedAssetsToExcel } from '@/src/utils/excelExport'
import type { FixedAssetRecord } from '@/src/types'
import type { MouseEvent } from 'react'

export interface DeptSectionProps {
  dept: string
  records: FixedAssetRecord[]
  isCollapsed: boolean
  selectedRecordId: string | null
  canEdit: boolean
  onToggle: (dept: string) => void
  onSelectRecord: (id: string) => void
  onEditRecord: (record: FixedAssetRecord) => void
  onDeleteRecord: (id: string, e: MouseEvent) => void
}

export function DeptSection({
  dept,
  records,
  isCollapsed,
  selectedRecordId,
  canEdit,
  onToggle,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
}: DeptSectionProps) {
  const style = useDepartmentStyles(dept)

  return (
    <div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div
        onClick={() => onToggle(dept)}
        className={`flex items-center justify-between p-2.5 rounded-lg border font-medium cursor-pointer select-none transition-colors ${style.bg} ${style.text} ${style.border}`}
      >
        <span className="flex items-center gap-2 truncate font-semibold text-sm">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <span className={`w-2 h-2 rounded-full ${style.badge.split(' ')[0]}`} />
          <span className="truncate">{dept}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant="secondary" className="text-[10px]">
            {records.length} {records.length === 1 ? 'Employee' : 'Employees'}
          </Badge>
          {canEdit && (
            <button
              onClick={() => exportFixedAssetsToExcel(records)}
              className="p-1.5 rounded bg-background hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors cursor-pointer border"
              title="Download department records"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <div className="space-y-2 mt-2">
          {records.map((record) => (
            <div key={record.id} className="contents">
              <RecordCard
                record={record}
                isSelected={selectedRecordId === record.id}
                canEdit={canEdit}
                onSelect={onSelectRecord}
                onEdit={onEditRecord}
                onDelete={onDeleteRecord}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
