import { useState } from 'react'
import { WarehouseStatsPanel } from './WarehouseStatsPanel'
import { WarehouseActionsPanel } from './WarehouseActionsPanel'
import { WarehouseTable } from './WarehouseTable'
import { WarehouseModal } from './WarehouseModal'
import { exportWarehouseToExcel } from '@/src/utils/excelExport'
import type { WarehouseEntry } from '@/src/types'

interface WarehouseViewProps {
  canAdd: boolean
  canEdit: boolean
  warehouseEntries: WarehouseEntry[]
  filteredWarehouseEntries: WarehouseEntry[]
  warehouseSearch: string
  setWarehouseSearch: (value: string) => void
  warehouseFilterOwner: string
  setWarehouseFilterOwner: (value: string) => void
  warehouseStats: { [key: string]: number }
  existingWarehouseOwners: string[]
  onAddOrUpdateEntry: (entry: WarehouseEntry) => Promise<void>
  onDeleteEntry: (id: string) => Promise<void>
  onClearAll: () => Promise<void>
}

export function WarehouseView({
  canAdd,
  canEdit,
  warehouseEntries,
  filteredWarehouseEntries,
  warehouseSearch,
  setWarehouseSearch,
  warehouseFilterOwner,
  setWarehouseFilterOwner,
  warehouseStats,
  existingWarehouseOwners,
  onAddOrUpdateEntry,
  onDeleteEntry,
  onClearAll,
}: WarehouseViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WarehouseEntry | null>(null)

  const handleAdd = () => {
    setEditingEntry(null)
    setIsModalOpen(true)
  }

  const handleEdit = (entry: WarehouseEntry) => {
    setEditingEntry(entry)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this entry? / ይህንን መሰረዝ ይፈልጋሉ?')) {
      await onDeleteEntry(id)
    }
  }

  const handleClear = async () => {
    if (window.confirm('Delete ALL warehouse entries? / ሁሉንም መሰረዝ እርግጠኛ ነዎት?')) {
      await onClearAll()
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WarehouseStatsPanel
          warehouseStats={warehouseStats}
          totalEntries={warehouseEntries.length}
          filterOwner={warehouseFilterOwner}
          onFilterChange={setWarehouseFilterOwner}
        />
        <WarehouseActionsPanel
          canAdd={canAdd}
          canEdit={canEdit}
          hasEntries={warehouseEntries.length > 0}
          onAddClick={handleAdd}
          onExportClick={() => exportWarehouseToExcel(warehouseEntries)}
          onClearClick={handleClear}
        />
      </div>

      <WarehouseTable
        entries={filteredWarehouseEntries}
        totalEntries={warehouseEntries.length}
        filteredCount={filteredWarehouseEntries.length}
        search={warehouseSearch}
        onSearchChange={setWarehouseSearch}
        canEdit={canEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <WarehouseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEntry(null) }}
        onSubmit={onAddOrUpdateEntry}
        editingEntry={editingEntry}
        existingOwners={existingWarehouseOwners}
        nextSNo={warehouseEntries.length + 1}
      />
    </div>
  )
}
