import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatMessageTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / (1000 * 60))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function parseImages(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}
    const cleaned = raw
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
    if (cleaned.length > 0) return cleaned
    return [raw.trim()]
  }
  return []
}

export default function Messages() {
  const { id: routeConvId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(routeConvId ? Number(routeConvId) : null)
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const pollTimerRef = useRef(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadConversations()
  }, [user])

  useEffect(() => {
    if (routeConvId) {
      setActiveConvId(Number(routeConvId))
    }
  }, [routeConvId])

  useEffect(() => {
    if (!activeConvId) {
      setActiveConv(null)
      setMessages([])
      return
    }

    loadMessages(activeConvId, true)

    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    pollTimerRef.current = setInterval(() => {
      pollLatestMessages(activeConvId)
    }, 2500)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [activeConvId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadConversations() {
    try {
      const { data } = await api.get('/api/chat/conversations/')
      setConversations(data)
      if (!activeConvId && data.length > 0 && !routeConvId) {
        setActiveConvId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoadingList(false)
    }
  }

  async function loadMessages(convId, isInitial = false) {
    if (isInitial) setLoadingMessages(true)
    try {
      const [msgRes, convRes] = await Promise.all([
        api.get(`/api/chat/conversations/${convId}/messages/`),
        api.get(`/api/chat/conversations/${convId}/`),
      ])
      setMessages(msgRes.data)
      if (convRes.data) setActiveConv(convRes.data)
      // Clear unread badge in state for this conversation
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      )
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      if (isInitial) setLoadingMessages(false)
    }
  }

  async function pollLatestMessages(convId) {
    try {
      const { data } = await api.get(`/api/chat/conversations/${convId}/messages/`)
      setMessages((prev) => {
        if (data.length !== prev.length || (data.length > 0 && data[data.length - 1].id !== prev[prev.length - 1]?.id)) {
          return data
        }
        return prev
      })
    } catch {}
  }

  async function handleSendMessage(e) {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || !activeConvId || sending) return

    setSending(true)
    setInputText('')
    try {
      const { data } = await api.post(`/api/chat/conversations/${activeConvId}/messages/`, {
        text: trimmed,
      })
      setMessages((prev) => [...prev, data])
      // Update preview in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message: data, updated_at: new Date().toISOString() }
            : c
        )
      )
    } catch (err) {
      console.error('Failed to send message:', err)
      setInputText(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleQuickPrompt(text) {
    setInputText(text)
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const otherName = (c.other_user?.full_name || '').toLowerCase()
    const productTitle = (c.product?.title || '').toLowerCase()
    const lastText = (c.last_message?.text || '').toLowerCase()
    return otherName.includes(q) || productTitle.includes(q) || lastText.includes(q)
  })

  const currentProduct = activeConv?.product
  const productImgs = parseImages(currentProduct?.images)
  const productThumbnail = productImgs[0] || null

  return (
    <div className="min-h-screen flex flex-col bg-ink text-paper">
      <Navbar search="" onSearchChange={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Title & Stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-paper">Direct Messages</h1>
            <p className="text-xs sm:text-sm text-mist">
              Private buyer & seller chat for campus marketplace deals
            </p>
          </div>
          <Link to="/" className="btn-ghost !py-2 !px-4 text-xs sm:text-sm hidden sm:inline-flex">
            Browse Marketplace
          </Link>
        </div>

        {/* Chat Layout Box */}
        <div className="id-card glass flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[750px] border border-hairline overflow-hidden">
          {/* Left Column: Conversations List */}
          <div
            className={`md:col-span-4 border-r border-hairline flex flex-col bg-ink-soft/60 ${
              activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search filter */}
            <div className="p-3.5 border-b border-hairline">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats or listings…"
                  className="w-full rounded-xl bg-black/40 border border-hairline pl-9 pr-3 py-2 text-xs sm:text-sm text-paper placeholder:text-mist/60 outline-none focus:border-gold/60"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-hairline/40">
              {loadingList ? (
                <div className="p-6 text-center text-sm text-mist animate-pulse">
                  Loading conversations…
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-white/5 border border-hairline flex items-center justify-center mx-auto mb-3 text-mist">
                    💬
                  </div>
                  <p className="text-sm text-paper font-medium mb-1">No chats found</p>
                  <p className="text-xs text-mist">
                    Visit any listing and click "Chat with Seller" to start a conversation!
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId
                  const isUserSeller = user?.id === conv.seller?.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConvId(conv.id)
                        navigate(`/messages/${conv.id}`)
                      }}
                      className={`w-full text-left p-3.5 sm:p-4 transition-all flex items-start gap-3 hover:bg-white/[0.04] ${
                        isActive ? 'bg-gold/10 border-l-4 border-gold' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="h-11 w-11 rounded-full bg-emerald/15 border border-emerald/40 flex items-center justify-center text-emerald font-semibold text-sm">
                          {initials(conv.other_user?.full_name)}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-crimson text-paper text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      {/* Info & snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-semibold text-paper truncate">
                            {conv.other_user?.full_name}
                          </p>
                          <span className="text-[11px] text-mist shrink-0 ml-1">
                            {timeAgo(conv.last_message?.created_at || conv.updated_at)}
                          </span>
                        </div>

                        {/* Product tag */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-mono text-gold-bright bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20 truncate max-w-[150px]">
                            {conv.product?.title}
                          </span>
                          <span className="text-[10px] text-mist">
                            {isUserSeller ? '• Buyer' : '• Seller'}
                          </span>
                        </div>

                        {/* Last message text */}
                        <p className="text-xs text-mist truncate">
                          {conv.last_message
                            ? (conv.last_message.is_mine ? 'You: ' : '') + conv.last_message.text
                            : 'No messages yet.'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Stream & Message Input */}
          <div
            className={`md:col-span-8 flex flex-col bg-ink/70 relative ${
              !activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConv ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3.5 sm:p-4 border-b border-hairline flex items-center justify-between gap-3 bg-ink-raised/50">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setActiveConvId(null)}
                      className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-mist hover:text-paper"
                    >
                      ‹
                    </button>
                    <div className="h-10 w-10 rounded-full bg-emerald/15 border border-emerald/40 flex items-center justify-center text-emerald font-semibold text-sm shrink-0">
                      {initials(activeConv.other_user?.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-semibold text-paper truncate">
                          {activeConv.other_user?.full_name}
                        </h2>
                        {activeConv.other_user?.avg_rating > 0 && (
                          <span className="text-xs text-gold-bright font-mono bg-gold/10 px-1.5 py-0.5 rounded border border-gold/30">
                            ★ {activeConv.other_user.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mist truncate">
                        {user?.id === activeConv.seller?.id ? 'Buyer' : 'Seller'}
                        {activeConv.other_user?.phone ? ` • ${activeConv.other_user.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Product quick link */}
                  {currentProduct && (
                    <Link
                      to={`/listing/${currentProduct.id}`}
                      className="btn-ghost !py-1.5 !px-3 text-xs shrink-0 flex items-center gap-1.5"
                    >
                      View Listing ↗
                    </Link>
                  )}
                </div>

                {/* Product Context Banner */}
                {currentProduct && (
                  <div className="px-4 py-2.5 bg-black/40 border-b border-hairline flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {productThumbnail ? (
                        <img
                          src={productThumbnail}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover border border-hairline shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-white/5 border border-hairline flex items-center justify-center text-[10px] text-mist font-bold shrink-0">
                          CC
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-paper font-medium truncate">{currentProduct.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-gold-bright font-mono font-semibold">
                            ₹{Number(currentProduct.asking_price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-mist">• {currentProduct.status}</span>
                        </div>
                      </div>
                    </div>
                    {user?.id === activeConv.seller?.id && currentProduct.status === 'AVAILABLE' && (
                      <span className="text-[11px] text-emerald bg-emerald/10 border border-emerald/30 px-2 py-0.5 rounded">
                        Your Listing
                      </span>
                    )}
                  </div>
                )}

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-mist text-sm animate-pulse">
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-mist">
                      <div className="h-12 w-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold-bright mb-3">
                        💬
                      </div>
                      <p className="text-paper font-medium text-sm mb-1">Start the conversation</p>
                      <p className="text-xs max-w-xs">
                        Ask about the product's condition, meeting spot on campus, or negotiate a price.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.is_mine || msg.sender?.id === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
                              isMine
                                ? 'bg-gradient-to-r from-gold/90 to-gold-bright text-ink font-medium rounded-tr-none'
                                : 'glass bg-ink-raised/90 text-paper border border-hairline rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[10px] text-mist/70">
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMine && (
                              <span className="text-[10px] text-gold-bright/80 font-mono" title={msg.is_read ? 'Read' : 'Delivered'}>
                                {msg.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Offer / Question Prompts */}
                <div className="px-4 py-2 bg-ink-soft/40 border-t border-hairline flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="text-mist shrink-0 text-[11px]">Quick:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Hi! Is this still available?')}
                    className="chip !py-1 !px-2.5 !text-xs whitespace-nowrap hover:border-gold/50"
                  >
                    👋 Still available?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Where on campus can we meet to inspect it?')}
                    className="chip !py-1 !px-2.5 !text-xs whitespace-nowrap hover:border-gold/50"
                  >
                    📍 Where can we meet?
                  </button>
                  {currentProduct?.asking_price && (
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickPrompt(
                          `Would you consider ₹${Math.round(
                            Number(currentProduct.asking_price) * 0.9
                          )} for a quick deal?`
                        )
                      }
                      className="chip !py-1 !px-2.5 !text-xs whitespace-nowrap hover:border-gold/50"
                    >
                      💰 Offer ₹{Math.round(Number(currentProduct.asking_price) * 0.9)}
                    </button>
                  )}
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-hairline bg-ink-raised/60 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message… (Press Enter to send)"
                    className="flex-1 rounded-xl bg-black/40 border border-hairline px-4 py-3 text-sm text-paper placeholder:text-mist/60 outline-none focus:border-gold/60 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="btn-primary !py-3 !px-5 text-sm shrink-0 disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold-bright text-2xl mb-4">
                  💬
                </div>
                <h3 className="font-display text-xl text-paper mb-2">Select a Conversation</h3>
                <p className="text-sm text-mist max-w-sm">
                  Choose a chat from the left or visit a listing to message a seller directly.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
