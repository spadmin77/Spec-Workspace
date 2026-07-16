import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/src/lib/firebase'
import type { FixedAssetRecord, FixedAssetHeader, FixedAssetRow } from '@/src/types'
import type { AppRole } from '@/src/lib/firebase'

export function useFixedAssets(isStaff: boolean, userRole: AppRole, userDepartment: string) {
  const [fixedAssetRecords, setFixedAssetRecords] = useState<FixedAssetRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

  const [empHeader, setEmpHeader] = useState<FixedAssetHeader>({
    employeeName: '', department: '', employeeNo: ''
  })
  const [empAssetRows, setEmpAssetRows] = useState<FixedAssetRow[]>([])
  const [empCountedBy, setEmpCountedBy] = useState('')
  const [empUsername, setEmpUsername] = useState('')
  const [empDate, setEmpDate] = useState(() => new Date().toISOString().split('T')[0])

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [collapsedDepts, setCollapsedDepts] = useState<{ [dept: string]: boolean }>({})

  useEffect(() => {
    if (!isStaff) {
      setFixedAssetRecords([])
      return
    }
    const q = query(collection(db, 'fixedAssetRecords'), orderBy('header.employeeName', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: FixedAssetRecord[] = []
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as FixedAssetRecord)
      })
      setFixedAssetRecords(records)
    }, (error) => {
      console.error("Error loading fixed asset records:", error)
    })
    return () => unsubscribe()
  }, [isStaff])

  const existingFixedAssetDepts = useMemo(() => {
    const depts = fixedAssetRecords.map(r => r.header.department.trim()).filter(Boolean)
    if (empHeader.department.trim()) {
      depts.push(empHeader.department.trim())
    }
    return Array.from(new Set(depts))
  }, [fixedAssetRecords, empHeader.department])

  const existingDescriptions = useMemo(() => {
    const descs = fixedAssetRecords.flatMap(r => r.rows.map(row => row.assetDescription.trim())).filter(Boolean)
    empAssetRows.forEach(r => {
      const d = r.assetDescription.trim()
      if (d) descs.push(d)
    })
    return Array.from(new Set(descs))
  }, [fixedAssetRecords, empAssetRows])

  const visibleRecords = useMemo(() => {
    if (userRole === 'admin' || !userDepartment) return fixedAssetRecords
    return fixedAssetRecords.filter(r => r.header.department.trim() === userDepartment)
  }, [fixedAssetRecords, userRole, userDepartment])

  const recordsByDept = useMemo(() => {
    const groups: { [dept: string]: FixedAssetRecord[] } = {}
    visibleRecords.forEach((record) => {
      const dept = record.header.department.trim() || 'Other'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(record)
    })
    return groups
  }, [visibleRecords])

  const viewedRecord = useMemo(() => {
    return visibleRecords.find(r => r.id === selectedRecordId) || null
  }, [visibleRecords, selectedRecordId])

  const handleCancelRecordEdit = useCallback(() => {
    setEmpHeader({ employeeName: '', department: '', employeeNo: '' })
    setEmpAssetRows([])
    setEmpCountedBy('')
    setEditingRecordId(null)
  }, [])

  const handleSaveActiveRecord = useCallback(async () => {
    const recordId = editingRecordId || `rec-${Date.now()}`
    const newRecord: FixedAssetRecord = {
      id: recordId,
      header: {
        employeeName: empHeader.employeeName.trim(),
        department: empHeader.department.trim(),
        employeeNo: empHeader.employeeNo.trim()
      },
      rows: empAssetRows.filter(r => r.assetDescription.trim().length > 0).map((r, idx) => ({ ...r, sNo: idx + 1 })),
      countedBy: empCountedBy.trim(),
      username: empUsername.trim(),
      date: empDate || ''
    }

    setFixedAssetRecords((prev) => {
      const idx = prev.findIndex(r => r.id === newRecord.id)
      if (idx > -1) {
        const next = [...prev]
        next[idx] = newRecord
        return next
      }
      return [...prev, newRecord]
    })

    await setDoc(doc(db, 'fixedAssetRecords', newRecord.id), newRecord)

    setEmpHeader({ employeeName: '', department: '', employeeNo: '' })
    setEmpAssetRows([])
    setEmpCountedBy('')
    setEditingRecordId(null)

    return editingRecordId ? 'updated' : 'created'
  }, [editingRecordId, empHeader, empAssetRows, empCountedBy, empUsername, empDate])

  const handleDeleteRecord = useCallback(async (id: string) => {
    setFixedAssetRecords(prev => prev.filter(r => r.id !== id))
    if (selectedRecordId === id) setSelectedRecordId(null)
    await deleteDoc(doc(db, 'fixedAssetRecords', id))
  }, [selectedRecordId])

  const handleClearAll = useCallback(async () => {
    const backup = [...fixedAssetRecords]
    setFixedAssetRecords([])
    setSelectedRecordId(null)
    try {
      for (const record of backup) {
        await deleteDoc(doc(db, 'fixedAssetRecords', record.id))
      }
    } catch {
      setFixedAssetRecords(backup)
    }
  }, [fixedAssetRecords])

  const handleEditRecord = useCallback((record: FixedAssetRecord) => {
    setEmpHeader({
      employeeName: record.header.employeeName,
      department: record.header.department,
      employeeNo: record.header.employeeNo
    })
    setEmpAssetRows(record.rows)
    setEmpCountedBy(record.countedBy || '')
    setEmpUsername(record.username || '')
    if (record.date) setEmpDate(record.date)
    setEditingRecordId(record.id)
  }, [])

  return {
    fixedAssetRecords,
    empHeader, setEmpHeader,
    empAssetRows, setEmpAssetRows,
    empCountedBy, setEmpCountedBy,
    empUsername, setEmpUsername,
    empDate, setEmpDate,
    editingRecordId,
    selectedRecordId, setSelectedRecordId,
    collapsedDepts, setCollapsedDepts,
    existingFixedAssetDepts,
    existingDescriptions,
    visibleRecords,
    recordsByDept,
    viewedRecord,
    handleCancelRecordEdit,
    handleSaveActiveRecord,
    handleDeleteRecord,
    handleClearAll,
    handleEditRecord,
  }
}
