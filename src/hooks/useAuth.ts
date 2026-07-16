import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, getIdToken, type User } from 'firebase/auth'
import { auth, loginWithPassword, logoutAdmin, getRole, getUserDepartment, type AppRole } from '@/src/lib/firebase'

const CLAIMS_SERVER_URL = (import.meta as any).env?.VITE_CLAIMS_SERVER_URL || 'http://localhost:4000'

export interface RegistererAccount {
  uid: string
  email: string
  role: 'registerer'
  createdAt?: string
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<AppRole>(null)
  const [userDepartment, setUserDepartment] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      setUserRole(await getRole(user))
      setUserDepartment(await getUserDepartment(user))
      setIsAuthenticating(false)
    })
    return () => unsubscribe()
  }, [])

  const canEdit = userRole === 'admin'
  const canAdd = userRole === 'admin' || userRole === 'registerer'
  const isStaff = canAdd

  const apiCall = useCallback(async (path: string, options?: RequestInit) => {
    const token = currentUser ? await getIdToken(currentUser) : ''
    const res = await fetch(`${CLAIMS_SERVER_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
    return data
  }, [currentUser])

  return {
    currentUser,
    userRole,
    userDepartment,
    isAuthenticating,
    canEdit,
    canAdd,
    isStaff,
    apiCall,
    loginWithPassword,
    logoutAdmin,
  }
}
