import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/src/lib/firebase'
import type { WarehouseEntry } from '@/src/types'

export function useWarehouse(isStaff: boolean) {
  const [warehouseEntries, setWarehouseEntries] = useState<WarehouseEntry[]>([])
  const [warehouseSearch, setWarehouseSearch] = useState('')
  const [warehouseFilterOwner, setWarehouseFilterOwner] = useState('')

  useEffect(() => {
    if (!isStaff) {
      setWarehouseEntries([])
      return
    }
    const q = query(collection(db, 'warehouseEntries'), orderBy('sNo', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: WarehouseEntry[] = []
      snapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() } as WarehouseEntry)
      })
      setWarehouseEntries(entries)
    }, (error) => {
      console.error("Error loading warehouse entries:", error)
    })
    return () => unsubscribe()
  }, [isStaff])

  const filteredWarehouseEntries = useMemo(() => {
    return warehouseEntries.filter(entry => {
      const query = warehouseSearch.toLowerCase()
      const matchesSearch =
        entry.assetType.toLowerCase().includes(query) ||
        entry.owner.toLowerCase().includes(query) ||
        entry.warehouseNo.toLowerCase().includes(query) ||
        entry.manager.toLowerCase().includes(query) ||
        entry.inspection.toLowerCase().includes(query)
      const matchesOwner = warehouseFilterOwner === '' || entry.owner === warehouseFilterOwner
      return matchesSearch && matchesOwner
    })
  }, [warehouseEntries, warehouseSearch, warehouseFilterOwner])

  const warehouseStats = useMemo(() => {
    const stats: { [key: string]: number } = {}
    warehouseEntries.forEach(e => {
      stats[e.owner] = (stats[e.owner] || 0) + 1
    })
    return stats
  }, [warehouseEntries])

  const existingWarehouseOwners = useMemo(() => {
    const owners = warehouseEntries.map(e => e.owner.trim()).filter(Boolean)
    return Array.from(new Set(owners))
  }, [warehouseEntries])

  const handleAddOrUpdateEntry = useCallback(async (entry: WarehouseEntry) => {
    await setDoc(doc(db, 'warehouseEntries', entry.id), entry)
  }, [])

  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'warehouseEntries', id))
    const filtered = warehouseEntries.filter(e => e.id !== id)
    for (let idx = 0; idx < filtered.length; idx++) {
      const entry = filtered[idx]
      const newSNo = idx + 1
      if (entry.sNo !== newSNo) {
        await setDoc(doc(db, 'warehouseEntries', entry.id), { ...entry, sNo: newSNo })
      }
    }
  }, [warehouseEntries])

  const handleClearAll = useCallback(async () => {
    for (const entry of warehouseEntries) {
      await deleteDoc(doc(db, 'warehouseEntries', entry.id))
    }
  }, [warehouseEntries])

  return {
    warehouseEntries,
    warehouseSearch,
    setWarehouseSearch,
    warehouseFilterOwner,
    setWarehouseFilterOwner,
    filteredWarehouseEntries,
    warehouseStats,
    existingWarehouseOwners,
    handleAddOrUpdateEntry,
    handleDeleteEntry,
    handleClearAll,
  }
}
