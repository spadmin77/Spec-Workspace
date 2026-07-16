import { useState, useEffect, type FormEvent } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogCloseButton, DialogBody, DialogFooter } from '@/src/components/ui'
import { Input } from '@/src/components/ui'
import type { FixedAssetRow } from '@/src/types'

interface AssetRowModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (row: FixedAssetRow) => void
  editingRow: FixedAssetRow | null
  nextSNo: number
  defaultLocation?: { area: string; building: string; floor: string; specificLocation: string }
}

export function AssetRowModal({ isOpen, onClose, onSubmit, editingRow, nextSNo, defaultLocation }: AssetRowModalProps) {
  const [desc, setDesc] = useState('')
  const [tag, setTag] = useState('')
  const [area, setArea] = useState('')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('')
  const [specificLoc, setSpecificLoc] = useState('')
  const [unit, setUnit] = useState('')
  const [cost, setCost] = useState<number | ''>('')
  const [serial, setSerial] = useState('')
  const [received, setReceived] = useState<'Yes' | 'No'>('Yes')

  useEffect(() => {
    if (editingRow) {
      setDesc(editingRow.assetDescription)
      setTag(editingRow.tagNo)
      setArea(editingRow.area)
      setBuilding(editingRow.building)
      setFloor(editingRow.floor)
      setSpecificLoc(editingRow.specificLocation)
      setUnit(editingRow.unit)
      setCost(editingRow.cost)
      setSerial(editingRow.serialNo)
      setReceived(editingRow.received as 'Yes' | 'No')
    } else {
      setDesc('')
      setTag('')
      setArea(defaultLocation?.area || '')
      setBuilding(defaultLocation?.building || '')
      setFloor(defaultLocation?.floor || '')
      setSpecificLoc(defaultLocation?.specificLocation || '')
      setUnit('')
      setCost('')
      setSerial('')
      setReceived('Yes')
    }
  }, [editingRow, isOpen])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const row: FixedAssetRow = {
      id: editingRow?.id || `far-${Date.now()}`,
      sNo: editingRow?.sNo || nextSNo,
      assetDescription: desc.trim(),
      tagNo: tag.trim(),
      area: area.trim(),
      building: building.trim(),
      floor: floor.trim(),
      specificLocation: specificLoc.trim(),
      unit: unit,
      cost: cost !== '' && !isNaN(Number(cost)) ? Number(cost) : '',
      serialNo: serial.trim(),
      received,
    }
    onSubmit(row)
  }

  const unitPills = ['1', '5', '10', 'Pcs', 'Set']

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader className="bg-foreground text-background">
        <div>
          <DialogTitle className="text-background">
            {editingRow ? 'Edit Asset Row' : 'Add Asset Row'}
          </DialogTitle>
          <p className="text-xs text-background/70">
            {editingRow ? 'Update asset details' : 'Fill in asset specifications'}
          </p>
        </div>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Asset Description / መግለጫ
            </label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Ergonomic Office Mesh Chair"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto p-2 border border-border rounded-lg bg-muted/20">
              {[
                "High back mesh chair",
                "Medium-back mesh chair",
                "Swivel chair",
                "Coffee table",
                "Managerial table",
                "Guest chair",
                "Counter table",
                "Workstation/four-station table",
                "Photo copy machine",
                "File cabinet",
                "Screen",
                "LCD monitor",
                "Laptop computer",
                "Conference table",
                "Tablet",
                "Stapler",
                "Puncher",
                "Server",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDesc(item)}
                  className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                    desc === item
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Tag No. / መለያ ቁጥር
              </label>
              <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. FA-HQ-1205" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Serial No. / ሴሪያል
              </label>
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="SN02919929" />
            </div>
          </div>

          <div className="border border-border p-3.5 rounded-lg bg-muted/30 space-y-3">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Location / ቦታ
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-0.5">Area / አካባቢ</label>
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="HQ Campus" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-0.5">Building / ህንፃ</label>
                <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Block A" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-0.5">Floor / ፎቅ</label>
                <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="2nd" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-0.5">Specific / ልዩ ቦታ</label>
                <Input value={specificLoc} onChange={(e) => setSpecificLoc(e.target.value)} placeholder="Office 203" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Unit / መለኪያ
              </label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Pcs" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {unitPills.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setUnit(p)}
                    className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                      unit === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Cost / ዋጋ
              </label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value !== '' ? Number(e.target.value) : '')} placeholder="Amount" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Received / ተረከበ
              </label>
              <select
                value={received}
                onChange={(e) => setReceived(e.target.value as 'Yes' | 'No')}
                className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
              >
                <option value="Yes">Yes / አዎ</option>
                <option value="No">No / አይደለም</option>
              </select>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-muted text-xs font-medium cursor-pointer transition-colors"
          >
            Cancel / ሰርዝ
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-foreground text-background hover:bg-foreground/90 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
          >
            {editingRow ? 'Update / አስተካክል' : 'Confirm / አረጋግጥ'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
