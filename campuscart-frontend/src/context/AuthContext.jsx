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

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields }
      localStorage.setItem('cc_user', JSON.stringify(next))
      return next
    })
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me/')
      const updated = {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        profileImage: data.profile_image,
        collegeId: data.college_id,
        phone: data.phone,
        avgRating: data.avg_rating,
      }
      localStorage.setItem('cc_user', JSON.stringify(updated))
      setUser(updated)
      return data
    } catch (err) {
      console.error('Failed to fetch profile', err)
      return null
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cc_access_token')
    localStorage.removeItem('cc_refresh_token')
    localStorage.removeItem('cc_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
