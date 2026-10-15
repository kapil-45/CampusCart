import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ListingDetail from './pages/ListingDetail'
import Sell from './pages/Sell'
import Messages from './pages/Messages'
import Profile from './pages/Profile'

/** Shows the landing page to guests; redirects logged-in users to the dashboard */
function RootRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/home" replace /> : <LandingPage />
}

/** Protects dashboard routes — redirects guests to landing */
function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard — all behind RequireAuth */}
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/listing/:id" element={<RequireAuth><ListingDetail /></RequireAuth>} />
          <Route path="/listing/:id/edit" element={<RequireAuth><Sell /></RequireAuth>} />
          <Route path="/sell" element={<RequireAuth><Sell /></RequireAuth>} />
          <Route path="/sell/:id" element={<RequireAuth><Sell /></RequireAuth>} />
          <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/messages/:id" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

