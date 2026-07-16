import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogCloseButton, DialogBody, DialogFooter } from '@/src/components/ui'
import { Input } from '@/src/components/ui'
import type { WarehouseEntry } from '@/src/types'

interface WarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (entry: WarehouseEntry) => Promise<void>
  editingEntry: WarehouseEntry | null
  existingOwners: string[]
  nextSNo: number
}

export function WarehouseModal({ isOpen, onClose, onSubmit, editingEntry, existingOwners, nextSNo }: WarehouseModalProps) {
  const [assetType, setAssetType] = useState('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [owner, setOwner] = useState('')
  const [warehouseNo, setWarehouseNo] = useState('')
  const [manager, setManager] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [inspection, setInspection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingEntry) {
      setAssetType(editingEntry.assetType)
      setQuantity(editingEntry.quantity)
      setOwner(editingEntry.owner)
      setWarehouseNo(editingEntry.warehouseNo)
      setManager(editingEntry.manager)
      setDate(editingEntry.date)
      setInspection(editingEntry.inspection)
    } else {
      setAssetType('')
      setQuantity('')
      setOwner('')
      setWarehouseNo('')
      setManager('')
      setDate(new Date().toISOString().split('T')[0])
      setInspection('')
    }
  }, [editingEntry, isOpen])

  const handleSubmit = async (e: import('react').FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const entry: WarehouseEntry = {
        id: editingEntry?.id || `w-${Date.now()}`,
        sNo: editingEntry?.sNo || nextSNo,
        assetType: assetType.trim(),
        quantity: quantity !== '' && !isNaN(Number(quantity)) ? Number(quantity) : '',
        owner: owner.trim(),
        warehouseNo: warehouseNo.trim(),
        manager: manager.trim(),
        date: date || '',
        inspection: inspection.trim(),
      }
      await onSubmit(entry)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader className="bg-primary text-primary-foreground">
        <div>
          <DialogTitle className="text-primary-foreground">
            {editingEntry ? 'Edit Warehouse Entry' : 'Add Warehouse Entry'}
          </DialogTitle>
          <p className="text-xs text-primary-foreground/70 font-mono">
            {editingEntry ? 'Update entry details' : 'Fill in the form to register a new item'}
          </p>
        </div>
        <DialogCloseButton onClick={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Asset Type / የንብረት ዓይነት
            </label>
            <Input
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              placeholder="e.g. Ergonomic Office Desk"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Quantity / ብዛት
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Owner (Dept) / ባለቤት
              </label>
              <Input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Finance, IT"
                list="owner-suggestions"
              />
              <datalist id="owner-suggestions">
                {existingOwners.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Warehouse No. / የመጋዘን ቁጥር
              </label>
              <Input
                value={warehouseNo}
                onChange={(e) => setWarehouseNo(e.target.value)}
                placeholder="e.g. WH-01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Manager / ሃላፊ
              </label>
              <Input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="e.g. Abebe Kebede"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Date / ቀን
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Inspection / ምርመራ
              </label>
              <Input
                value={inspection}
                onChange={(e) => setInspection(e.target.value)}
                placeholder="e.g. Excellent, Damaged"
              />
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
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
          >
            {editingEntry ? 'Update / አስተካክል' : 'Confirm / አረጋግጥ'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
