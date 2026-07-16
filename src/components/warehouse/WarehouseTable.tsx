import { Search, Pencil, Trash2 } from 'lucide-react'
import { Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardHeader, CardTitle, CardDescription } from '@/src/components/ui'
import { useDepartmentStyles } from '@/src/hooks'
import type { WarehouseEntry } from '@/src/types'

interface WarehouseTableProps {
  entries: WarehouseEntry[]
  totalEntries: number
  filteredCount: number
  search: string
  onSearchChange: (value: string) => void
  canEdit: boolean
  onEdit: (entry: WarehouseEntry) => void
  onDelete: (id: string) => void
}

export function WarehouseTable({
  entries,
  totalEntries,
  filteredCount,
  search,
  onSearchChange,
  canEdit,
  onEdit,
  onDelete,
}: WarehouseTableProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Warehouse List / የመጋዘን ዝርዝር</CardTitle>
        <CardDescription>
          {filteredCount} of {totalEntries} items
        </CardDescription>
      </CardHeader>

      <div className="px-5 pb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search asset, warehouse, manager..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/80 hover:bg-muted/80">
              <TableHead className="w-14 text-center font-mono">S.No</TableHead>
              <TableHead className="min-w-40">Asset Type</TableHead>
              <TableHead className="text-center w-20">Qty</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Warehouse No.</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="max-w-40">Inspection</TableHead>
              {canEdit && <TableHead className="w-20 text-center">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 10 : 9} className="py-12 text-center text-muted-foreground italic">
                  {totalEntries === 0
                    ? 'No entries yet. Click "Add Warehouse Item" to start.'
                    : 'No results match your search or filter.'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const style = useDepartmentStyles(entry.owner)
                return (
                  <TableRow
                    key={entry.id}
                    className={`${style.bg} border-l-4 ${style.border.replace('border-', 'border-l-')}`}
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{entry.sNo}</TableCell>
                    <TableCell className="font-medium">{entry.assetType}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-2.5 py-1 bg-background rounded-md font-bold font-mono text-xs border">
                        {entry.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}>
                        {entry.owner}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{entry.warehouseNo}</TableCell>
                    <TableCell>{entry.manager}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{entry.date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-40 truncate" title={entry.inspection}>
                      {entry.inspection}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(entry)}
                            className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-background transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(entry.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-background transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
