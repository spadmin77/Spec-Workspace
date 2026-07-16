import { Download, Pencil, X } from 'lucide-react'
import { Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui'
import { exportFixedAssetsToExcel } from '@/src/utils/excelExport'
import type { FixedAssetRecord } from '@/src/types'

interface RecordViewerModalProps {
  record: FixedAssetRecord | null
  canAdd: boolean
  canEdit: boolean
  onClose: () => void
  onEdit: (record: FixedAssetRecord) => void
}

export function RecordViewerModal({ record, canAdd, canEdit, onClose, onEdit }: RecordViewerModalProps) {
  if (!record) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-2xl border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-foreground text-background px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-base">Saved Custody Form</h3>
            <p className="text-xs text-background/60 font-mono truncate">
              {record.header.department} &bull; {record.header.employeeName}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-background/60 hover:text-background hover:bg-background/10 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="bg-muted/50 p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Employee Name', value: record.header.employeeName },
              { label: 'Department', value: record.header.department },
              { label: 'Employee ID', value: record.header.employeeNo },
            ].map((item) => (
              <div key={item.label}>
                <span className="block text-[10px] text-muted-foreground uppercase font-mono font-semibold">{item.label}</span>
                <span className="text-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/80">
                  <TableHead className="w-10 text-center font-mono">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tag No</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center w-14">Unit</TableHead>
                  <TableHead className="text-right w-20">Cost</TableHead>
                  <TableHead className="max-w-28">Serial No</TableHead>
                  <TableHead className="text-center w-14">Recv?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{row.sNo}</TableCell>
                    <TableCell className="font-medium">{row.assetDescription}</TableCell>
                    <TableCell className="font-mono text-xs">{row.tagNo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[row.area, row.building, row.floor ? `${row.floor}F` : '', row.specificLocation].filter(Boolean).join(' • ') || '-'}
                    </TableCell>
                    <TableCell className="text-center">{row.unit && <Badge variant="secondary" className="text-[10px]">{row.unit}</Badge>}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {typeof row.cost === 'number' ? `$${row.cost.toLocaleString()}` : row.cost}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-28 truncate">{row.serialNo}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.received === 'Yes' ? 'success' : 'danger'} className="text-[10px]">{row.received}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 text-xs font-mono">
            <div>
              <span className="block text-[10px] text-muted-foreground">COUNTED BY</span>
              <span className="font-medium">{record.countedBy || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground">VERIFIED BY</span>
              <span className="font-medium">{record.username || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground">DATE</span>
              <span className="font-medium">{record.date || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 px-5 py-4 border-t flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {canAdd && (
              <button
                onClick={() => exportFixedAssetsToExcel([record])}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export This Sheet</span>
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => { onEdit(record); onClose() }}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-muted text-xs font-medium cursor-pointer transition-colors">
            Close / ዝጋ
          </button>
        </div>
      </div>
    </div>
  )
}
