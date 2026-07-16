import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/src/components/ui'
import type { FixedAssetRow } from '@/src/types'

interface AssetRowsTableProps {
  rows: FixedAssetRow[]
  canAdd: boolean
  canEdit: boolean
  onAdd: () => void
  onEdit: (row: FixedAssetRow) => void
  onDelete: (id: string) => void
}

export function AssetRowsTable({ rows, canAdd, canEdit, onAdd, onEdit, onDelete }: AssetRowsTableProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between !space-y-0">
        <div>
          <CardTitle className="text-sm">2. Assigned Assets / ቋሚ ንብረቶች</CardTitle>
          <CardDescription>Items linked to this employee's custody.</CardDescription>
        </div>
        {canAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 bg-foreground text-background hover:bg-foreground/90 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row / ጨምር</span>
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/80 hover:bg-muted/80">
                <TableHead className="w-12 text-center font-mono">S.No</TableHead>
                <TableHead className="min-w-36">Description</TableHead>
                <TableHead>Tag No</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center w-16">Unit</TableHead>
                <TableHead className="text-right w-20">Cost</TableHead>
                <TableHead className="max-w-28">Serial No.</TableHead>
                <TableHead className="text-center w-16">Recv?</TableHead>
                {canEdit && <TableHead className="w-16 text-center">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 10 : 9} className="py-12 text-center text-muted-foreground italic">
                    No asset rows yet. Click "Add Row" above.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{row.sNo}</TableCell>
                    <TableCell className="font-medium">{row.assetDescription}</TableCell>
                    <TableCell className="font-mono text-xs">{row.tagNo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[row.area, row.building, row.floor ? `${row.floor}F` : '', row.specificLocation].filter(Boolean).join(' • ') || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.unit && <Badge variant="secondary" className="text-[10px]">{row.unit}</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-xs">
                      {typeof row.cost === 'number' ? `$${row.cost.toLocaleString()}` : row.cost}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-28 truncate">{row.serialNo}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.received === 'Yes' ? 'success' : 'danger'} className="text-[10px]">
                        {row.received === 'Yes' ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => onEdit(row)} className="p-1 text-muted-foreground hover:text-primary rounded cursor-pointer" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(row.id)} className="p-1 text-muted-foreground hover:text-destructive rounded cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
