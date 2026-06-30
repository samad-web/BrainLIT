import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { store } from '../store/index.js'
import { getMascot } from '../mascots.js'

const StudentContext = createContext(null)

export function StudentProvider({ children }) {
  const [identity, setIdentity] = useState(() => store.getIdentity())
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const s = await store.getStudent()
      setStudent(s)
    } catch (e) {
      console.error('Failed to load student', e)
      setStudent(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Student logs in with teacher-issued credentials.
  const login = useCallback(async (username, password) => {
    const found = await store.loginStudent(username, password)
    const newIdentity = {
      classCode: found.classCode,
      studentId: found.id,
      firstName: found.firstName,
      username: found.username,
      mascotId: found.mascotId,
    }
    store.saveIdentity(newIdentity)
    setIdentity(newIdentity)
    setStudent(found)
    return found
  }, [])

  const update = useCallback(async (patch) => {
    const updated = await store.updateStudent(patch)
    setIdentity((prev) => ({ ...prev, ...patch }))
    setStudent((prev) => ({ ...prev, ...patch }))
    return updated
  }, [])

  const logout = useCallback(() => {
    store.clearIdentity()
    setIdentity(null)
    setStudent(null)
  }, [])

  const mascot = getMascot(student?.mascotId || identity?.mascotId)

  return (
    <StudentContext.Provider
      value={{ identity, student, mascot, loading, login, update, logout, refresh }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export const useStudent = () => {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider')
  return ctx
}
