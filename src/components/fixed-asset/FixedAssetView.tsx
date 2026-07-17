import { useState } from 'react'
import { EmployeeHeaderForm } from './EmployeeHeaderForm'
import { AssetRowsTable } from './AssetRowsTable'
import { AssetRowModal } from './AssetRowModal'
import { VerificationSignatures } from './VerificationSignatures'
import { SavedRecordsPanel } from './SavedRecordsPanel'
import { RecordViewerModal } from './RecordViewerModal'
import type { FixedAssetRecord, FixedAssetRow } from '@/src/types'

interface FixedAssetViewProps {
  isStaff: boolean
  canAdd: boolean
  canEdit: boolean

  empHeader: { employeeName: string; department: string; employeeNo: string }
  setEmpHeader: (h: { employeeName: string; department: string; employeeNo: string }) => void
  empAssetRows: FixedAssetRow[]
  setEmpAssetRows: (rows: FixedAssetRow[]) => void
  empCountedBy: string
  setEmpCountedBy: (v: string) => void
  empUsername: string
  setEmpUsername: (v: string) => void
  empDate: string
  setEmpDate: (v: string) => void
  editingRecordId: string | null
  selectedRecordId: string | null
  setSelectedRecordId: (id: string | null) => void
  collapsedDepts: { [dept: string]: boolean }
  setCollapsedDepts: (d: { [dept: string]: boolean }) => void
  existingFixedAssetDepts: string[]
  visibleRecords: FixedAssetRecord[]
  recordsByDept: { [dept: string]: FixedAssetRecord[] }
  viewedRecord: FixedAssetRecord | null
  isSaving: boolean
  saveMessage: { type: 'success' | 'error'; text: string } | null
  clearSaveMessage: () => void
  handleCancelRecordEdit: () => void
  handleSaveActiveRecord: () => Promise<{ success: boolean }>
  handleDeleteRecord: (id: string, e: import('react').MouseEvent) => Promise<void>
  handleClearAll: () => Promise<void>
  handleEditRecord: (record: FixedAssetRecord) => void
}

export function FixedAssetView({
  isStaff,
  canAdd,
  canEdit,
  empHeader, setEmpHeader,
  empAssetRows, setEmpAssetRows,
  empCountedBy, setEmpCountedBy,
  empUsername, setEmpUsername,
  empDate, setEmpDate,
  editingRecordId,
  selectedRecordId, setSelectedRecordId,
  collapsedDepts, setCollapsedDepts,
  existingFixedAssetDepts,
  visibleRecords,
  recordsByDept,
  viewedRecord,
  isSaving,
  saveMessage,
  clearSaveMessage,
  handleCancelRecordEdit,
  handleSaveActiveRecord,
  handleDeleteRecord,
  handleClearAll,
  handleEditRecord,
}: FixedAssetViewProps) {
  const [isRowModalOpen, setIsRowModalOpen] = useState(false)
  const [editingAssetRowId, setEditingAssetRowId] = useState<string | null>(null)
  const [lastLocation, setLastLocation] = useState<{ area: string; building: string; floor: string; specificLocation: string } | undefined>(undefined)

  const handleAddRow = () => {
    setEditingAssetRowId(null)
    setIsRowModalOpen(true)
  }

  const handleEditRow = (row: FixedAssetRow) => {
    setEditingAssetRowId(row.id)
    setIsRowModalOpen(true)
  }

  const handleDeleteRow = (rowId: string) => {
    const filtered = empAssetRows.filter(r => r.id !== rowId)
    const reordered = filtered.map((r, idx) => ({ ...r, sNo: idx + 1 }))
    setEmpAssetRows(reordered)
  }

  const handleSubmitRow = (row: FixedAssetRow) => {
    if (editingAssetRowId) {
      const updated = empAssetRows.map(r => r.id === editingAssetRowId ? row : r)
      setEmpAssetRows(updated)
    } else {
      setEmpAssetRows([...empAssetRows, row])
    }
    setLastLocation({ area: row.area, building: row.building, floor: row.floor, specificLocation: row.specificLocation })
    setIsRowModalOpen(false)
    setEditingAssetRowId(null)
  }

  const handleSave = async () => {
    await handleSaveActiveRecord()
  }

  return (
    <div className="space-y-6">
      {!isStaff && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4">
          Sign in as Admin or Registerer to add records. Viewing is read-only.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isStaff && (
            <>
              <EmployeeHeaderForm
                header={empHeader}
                onChange={setEmpHeader}
                editingRecordId={editingRecordId}
                existingDepts={existingFixedAssetDepts}
              />

              <AssetRowsTable
                rows={empAssetRows}
                canAdd={canAdd}
                canEdit={canEdit}
                onAdd={handleAddRow}
                onEdit={handleEditRow}
                onDelete={handleDeleteRow}
              />

              <VerificationSignatures
                countedBy={empCountedBy}
                onCountedByChange={setEmpCountedBy}
                employeeName={empHeader.employeeName}
                date={empDate}
                onDateChange={setEmpDate}
                canAdd={canAdd}
                canEdit={canEdit}
                editingRecordId={editingRecordId}
                isSaving={isSaving}
                saveMessage={saveMessage}
                onClearMessage={clearSaveMessage}
                onSave={handleSave}
                onCancelEdit={handleCancelRecordEdit}
              />
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <SavedRecordsPanel
            recordsByDept={recordsByDept}
            visibleRecords={visibleRecords}
            selectedRecordId={selectedRecordId}
            collapsedDepts={collapsedDepts}
            canEdit={canEdit}
            onToggleDept={(dept) => setCollapsedDepts({ ...collapsedDepts, [dept]: !collapsedDepts[dept] })}
            onSelectRecord={setSelectedRecordId}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAll}
          />
        </div>
      </div>

      <AssetRowModal
        isOpen={isRowModalOpen}
        onClose={() => { setIsRowModalOpen(false); setEditingAssetRowId(null) }}
        onSubmit={handleSubmitRow}
        editingRow={editingAssetRowId ? empAssetRows.find(r => r.id === editingAssetRowId) || null : null}
        nextSNo={empAssetRows.length + 1}
        defaultLocation={lastLocation}
      />

      <RecordViewerModal
        record={viewedRecord}
        canAdd={canAdd}
        canEdit={canEdit}
        onClose={() => setSelectedRecordId(null)}
        onEdit={handleEditRecord}
      />
    </div>
  )
}
