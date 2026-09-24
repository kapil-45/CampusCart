import axios from 'axios'

// Points at the local Django dev server by default. Change this if your
// backend runs somewhere else.
const API_BASE_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// Attach the stored access token to every outgoing request, if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If a request fails with 401 (expired token), try refreshing once using
// the stored refresh token before giving up and forcing a re-login.
let isRefreshing = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true
      isRefreshing = true
      try {
        const refresh = localStorage.getItem('cc_refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/login/refresh/`, { refresh })
        localStorage.setItem('cc_access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshError) {
        localStorage.removeItem('cc_access_token')
        localStorage.removeItem('cc_refresh_token')
        localStorage.removeItem('cc_user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
