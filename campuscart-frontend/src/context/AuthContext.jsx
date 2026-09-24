import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cc_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login/', { email, password })
    const userData = { id: data.userId, fullName: data.fullName, role: data.role }
    localStorage.setItem('cc_access_token', data.access)
    localStorage.setItem('cc_refresh_token', data.refresh)
    localStorage.setItem('cc_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (payload) => {
    // payload: { full_name, email, password, college_id, phone }
    const { data } = await api.post('/api/auth/register/', payload)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cc_access_token')
    localStorage.removeItem('cc_refresh_token')
    localStorage.removeItem('cc_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
