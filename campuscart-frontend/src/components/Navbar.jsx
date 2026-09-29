import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Wordmark from './Wordmark'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function Navbar({ search, onSearchChange }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    async function fetchUnread() {
      try {
        const { data } = await api.get('/api/chat/unread-count/')
        setUnreadCount(data.unread_count || 0)
      } catch {}
    }

    fetchUnread()
    const timer = setInterval(fetchUnread, 6000)
    return () => clearInterval(timer)
  }, [user])

  return (
    <header className="sticky top-0 z-30 glass border-b border-hairline">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-6">
        <Link to="/">
          <Wordmark />
        </Link>

        <div className="flex-1 max-w-xl relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={search || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search for textbooks, calculators, bikes…"
            className="w-full rounded-full bg-black/25 border border-hairline pl-10 pr-4 py-2.5 text-sm text-paper placeholder:text-mist/60 outline-none focus:border-gold/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/messages"
                className="relative btn-ghost !px-3.5 !py-2 text-sm flex items-center gap-1.5"
                title="Direct Messages"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="hidden md:inline">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-crimson text-paper text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button onClick={() => navigate('/sell')} className="btn-primary !px-4 !py-2 text-sm">
                + Sell
              </button>
              <button onClick={logout} className="btn-ghost !px-4 !py-2 text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !px-4 !py-2 text-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Join CampusCart
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

