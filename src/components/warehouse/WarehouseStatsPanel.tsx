import { Layers } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/src/components/ui'
import { useDepartmentStyles } from '@/src/hooks'

interface WarehouseStatsPanelProps {
  warehouseStats: { [key: string]: number }
  totalEntries: number
  filterOwner: string
  onFilterChange: (owner: string) => void
}

export function WarehouseStatsPanel({
  warehouseStats,
  totalEntries,
  filterOwner,
  onFilterChange,
}: WarehouseStatsPanelProps) {
  const owners = Object.entries(warehouseStats)

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-2 !space-y-0">
        <Layers className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <CardTitle className="text-sm">Departments Legend / የንብረት ባለቤቶች</CardTitle>
          <CardDescription>Color-grouped by Owner field</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {totalEntries === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">No entries yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            <button
              onClick={() => onFilterChange('')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                filterOwner === ''
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              <span>All Owners / ሁሉም</span>
              <Badge variant="secondary">{totalEntries}</Badge>
            </button>

            {owners.map(([owner, count]) => {
              const style = useDepartmentStyles(owner)
              const isSelected = filterOwner === owner
              return (
                <button
                  key={owner}
                  onClick={() => onFilterChange(isSelected ? '' : owner)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                  } ${style.bg} ${style.text} ${style.border}`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${style.badge.split(' ')[0]}`} />
                    <span className="truncate">{owner}</span>
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </button>
              )
            })}
          </div>
        )}

        {filterOwner && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-primary">
            <span>Filter active</span>
            <button onClick={() => onFilterChange('')} className="underline font-semibold cursor-pointer">
              Reset
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
