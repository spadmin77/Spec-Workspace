import { Pencil } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/src/components/ui'
import type { FixedAssetHeader } from '@/src/types'

interface EmployeeHeaderFormProps {
  header: FixedAssetHeader
  onChange: (header: FixedAssetHeader) => void
  editingRecordId: string | null
  existingDepts: string[]
}

export function EmployeeHeaderForm({ header, onChange, editingRecordId, existingDepts }: EmployeeHeaderFormProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between !space-y-0">
        <div>
          <CardTitle className="text-sm">1. Employee Header / የሰራተኛ መረጃ</CardTitle>
          <CardDescription>Fill in employee background before adding assets.</CardDescription>
        </div>
        {editingRecordId ? (
          <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold border border-amber-200 font-mono flex items-center gap-1 shrink-0">
            <Pencil className="w-3 h-3" />
            Editing
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-100 font-mono shrink-0">
            Active
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Employee Name / ሙሉ ስም
            </label>
            <Input
              value={header.employeeName}
              onChange={(e) => onChange({ ...header, employeeName: e.target.value })}
              placeholder="Abebe Bekele"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Department / ክፍል
            </label>
            <Input
              value={header.department}
              onChange={(e) => onChange({ ...header, department: e.target.value })}
              placeholder="IT Department"
              list="dept-suggestions"
            />
            <datalist id="dept-suggestions">
              {existingDepts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Employee ID / መታወቂያ
            </label>
            <Input
              value={header.employeeNo}
              onChange={(e) => onChange({ ...header, employeeNo: e.target.value })}
              placeholder="EMP-4920"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
