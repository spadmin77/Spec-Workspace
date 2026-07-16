import { Plus, Download, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui'

interface WarehouseActionsPanelProps {
  canAdd: boolean
  canEdit: boolean
  hasEntries: boolean
  onAddClick: () => void
  onExportClick: () => void
  onClearClick: () => void
}

export function WarehouseActionsPanel({
  canAdd,
  canEdit,
  hasEntries,
  onAddClick,
  onExportClick,
  onClearClick,
}: WarehouseActionsPanelProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-sm">Warehouse Inventory / የመጋዘን መረጃ ማስተዳደሪያ</CardTitle>
        <CardDescription>
          Register items and export grouped by department to Excel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {canAdd && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse Item / ንብረት ጨምር</span>
            </button>
          )}

          <button
            onClick={onExportClick}
            disabled={!hasEntries}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel / ወደ Excel ቀይር</span>
          </button>

          {canEdit && hasEntries && (
            <button
              onClick={onClearClick}
              className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All / ሁሉንም አጽዳ</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
