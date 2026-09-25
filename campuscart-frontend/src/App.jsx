import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ListingDetail from './pages/ListingDetail'
import Sell from './pages/Sell'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/listing/:id/edit" element={<Sell />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/sell/:id" element={<Sell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
