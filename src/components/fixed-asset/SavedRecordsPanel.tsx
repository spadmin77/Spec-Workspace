import { Download, FileSpreadsheet, Trash2, Users, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui'
import { DeptSection } from './DeptSection'
import { exportFixedAssetsToExcel, exportFixedAssetsByDepartment } from '@/src/utils/excelExport'
import type { FixedAssetRecord } from '@/src/types'



interface SavedRecordsPanelProps {
  recordsByDept: { [dept: string]: FixedAssetRecord[] }
  visibleRecords: FixedAssetRecord[]
  selectedRecordId: string | null
  collapsedDepts: { [dept: string]: boolean }
  canEdit: boolean
  onToggleDept: (dept: string) => void
  onSelectRecord: (id: string) => void
  onEditRecord: (record: FixedAssetRecord) => void
  onDeleteRecord: (id: string, e: import('react').MouseEvent) => void
  onClearAll: () => void
}

export function SavedRecordsPanel({
  recordsByDept,
  visibleRecords,
  selectedRecordId,
  collapsedDepts,
  canEdit,
  onToggleDept,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onClearAll,
}: SavedRecordsPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm">Export Panel / ማውረጃ</CardTitle>
          </div>
          <CardDescription>Download records by department or all in one file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {canEdit && (
            <>
              <button
                onClick={() => exportFixedAssetsByDepartment(visibleRecords)}
                disabled={visibleRecords.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export by Department</span>
              </button>
              <button
                onClick={() => exportFixedAssetsToExcel(visibleRecords)}
                disabled={visibleRecords.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export All in One</span>
              </button>
            </>
          )}
          {canEdit && visibleRecords.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All / አጽዳ</span>
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between !space-y-0">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Saved ({visibleRecords.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {visibleRecords.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
              <HelpCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No saved records yet.</p>
              <p className="text-[10px] text-muted-foreground/60 italic">Complete and save a form above.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {Object.entries(recordsByDept).map(([dept, records]) => (
                <div key={dept} className="contents">
                  <DeptSection
                    dept={dept}
                    records={records}
                    isCollapsed={!!collapsedDepts[dept]}
                    selectedRecordId={selectedRecordId}
                    canEdit={canEdit}
                    onToggle={onToggleDept}
                    onSelectRecord={onSelectRecord}
                    onEditRecord={onEditRecord}
                    onDeleteRecord={onDeleteRecord}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
