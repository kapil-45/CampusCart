import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const CONDITION_LABEL = {
  NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
}

// Approximate market price multiplier per condition (for savings display)
const MARKET_PRICE_FACTOR = {
  NEW: 1.0, LIKE_NEW: 1.25, GOOD: 1.45, FAIR: 1.65, POOR: 1.85,
}

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
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

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [markSoldOpen, setMarkSoldOpen] = useState(false)
  const [buyerId, setBuyerId] = useState('')
  const [markSoldError, setMarkSoldError] = useState('')
  const [markSoldBusy, setMarkSoldBusy] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)

  useEffect(() => {
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadProduct() {
    setLoading(true)
    setNotFound(false)
    setImgFailed(false)
    setActiveImgIndex(0)
    try {
      const { data } = await api.get(`/api/products/${id}/`)
      setProduct(data)
      if (user) {
        api.get('/api/wishlist/').then((r) => {
          const list = Array.isArray(r.data) ? r.data : r.data?.results || []
          setInWishlist(list.some((item) => {
            const pId = typeof item.product === 'object' && item.product !== null ? item.product.id : (item.product || item.product_id)
            return pId === data.id
          }))
        }).catch(() => {})
      }
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleWishlist() {
    if (!user) return navigate('/login')
    setWishlistBusy(true)
    try {
      if (inWishlist) {
        await api.delete(`/api/wishlist/${product.id}/`)
        setInWishlist(false)
      } else {
        await api.post('/api/wishlist/', { product: product.id })
        setInWishlist(true)
      }
    } catch {
      loadProduct()
    } finally {
      setWishlistBusy(false)
    }
  }

  async function handleMarkSold(e) {
    e.preventDefault()
    setMarkSoldError('')
    if (!buyerId.trim()) return
    setMarkSoldBusy(true)
    try {
      await api.post('/api/orders/mark-sold/', { product: product.id, buyer_id: Number(buyerId) })
      setMarkSoldOpen(false)
      loadProduct()
    } catch (err) {
      const data = err.response?.data
      setMarkSoldError(
        (Array.isArray(data) && data[0]) || data?.non_field_errors?.[0] || data?.detail || 'Could not mark as sold -- check the buyer ID and try again.'
      )
    } finally {
      setMarkSoldBusy(false)
    }
  }

  const isOwner = Boolean(user && product && String(user.id) === String(product.seller?.id))

  async function handleStartChat(initialMsg = '') {
    if (!user) return navigate('/login')
    if (isOwner) return navigate('/messages')
    setChatBusy(true)
    try {
      const { data } = await api.post('/api/chat/conversations/', {
        product_id: product.id,
        initial_message: initialMsg,
      })
      if (data?.id) navigate(`/messages/${data.id}`)
      else navigate('/messages')
    } catch {
      navigate('/messages')
    } finally {
      setChatBusy(false)
    }
  }

  const images = parseImages(product?.images)
  const currentImage = images[activeImgIndex] || images[0]
  const hasImage = Boolean(currentImage) && !imgFailed

  const askingPrice = Number(product?.asking_price) || 0
  const factor = MARKET_PRICE_FACTOR[product?.condition] ?? 1.4
  const marketPrice = Math.round(askingPrice * factor)
  const savings = marketPrice - askingPrice

  const INR = (n) => `\u20b9${Number(n).toLocaleString('en-IN')}`

  return (
    <div className="min-h-screen">
      <Navbar search="" onSearchChange={() => {}} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-paper transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {loading && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="id-card glass aspect-[4/3] animate-pulse bg-white/[0.02]" />
            <div className="space-y-4 pt-2">
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-white/[0.05] animate-pulse" />
              </div>
              <div className="h-8 w-3/4 rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="h-10 w-2/5 rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-20 rounded-xl bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        )}

        {!loading && notFound && (
          <div className="id-card glass p-14 text-center">
            <p className="font-display text-xl text-paper mb-2">Listing not found</p>
            <p className="text-mist text-sm mb-6">It may have been removed or the link is incorrect.</p>
            <Link to="/" className="btn-primary inline-flex">Browse other listings</Link>
          </div>
        )}

        {!loading && !notFound && product && (
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-8 items-start">

            <div className="flex flex-col gap-3">
              <div className="id-card glass overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                {hasImage ? (
                  <img
                    src={currentImage}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-ink-raised to-black/40">
                    <span className="font-display text-6xl text-mist/20">CC</span>
                  </div>
                )}
                {product.status === 'SOLD' && (
                  <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                    <span className="font-display text-2xl text-crimson border-2 border-crimson rounded-lg px-6 py-2 rotate-[-8deg]">
                      SOLD
                    </span>
                  </div>
                )}
                {hasImage && (
                  <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-ink/60 backdrop-blur-sm flex items-center justify-center border border-hairline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A6A0" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setActiveImgIndex(idx); setImgFailed(false) }}
                      className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-black/40 ${
                        activeImgIndex === idx
                          ? 'border-gold shadow-goldGlow scale-[1.02]'
                          : 'border-hairline opacity-55 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0">

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {product.category && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full border border-gold/30 text-gold-bright bg-gold/5">
                      {product.category}
                    </span>
                  )}
                  <span className="text-xs font-medium px-3 py-1 rounded-full border border-hairline text-mist bg-white/[0.03]">
                    {CONDITION_LABEL[product.condition] || product.condition}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistBusy}
                    title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-hairline hover:border-gold/40 transition-colors disabled:opacity-40"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={inWishlist ? '#C9A227' : 'none'} stroke={inWishlist ? '#C9A227' : '#A8A6A0'} strokeWidth="2">
                      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
                    title="Share listing"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-hairline hover:border-gold/40 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A6A0" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl text-paper leading-tight mb-3">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-mono text-gold-bright text-3xl font-bold">
                  {INR(askingPrice)}
                </span>
                {savings > 0 && (
                  <span className="text-mist line-through text-base font-mono">
                    {INR(marketPrice)}
                  </span>
                )}
              </div>

              {savings > 0 && (
                <p className="text-emerald text-sm mb-3">
                  You save {INR(savings)} vs market price
                </p>
              )}

              <div className="flex items-center gap-1.5 text-mist text-sm mb-4">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Campus{product.seller?.college ? `, ${product.seller.college}` : ''}</span>
                {product.created_at && (
                  <>
                    <span className="mx-1 opacity-30">&#8226;</span>
                    <span>{timeAgo(product.created_at)}</span>
                  </>
                )}
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-3 mb-5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="2" className="mt-0.5 shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="text-xs text-mist leading-relaxed">
                  <span className="text-gold-bright font-semibold">CampusCart</span> will <span className="font-bold text-paper">NEVER</span> ask for your password or OTP. Only deal with verified students.
                </p>
              </div>

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mist mb-2">Description</p>
                <p className="text-paper/80 leading-relaxed whitespace-pre-wrap text-sm">
                  {product.description || 'No description provided.'}
                </p>
              </div>

              <div className="rounded-xl border border-hairline bg-white/[0.03] p-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mist mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald/10 border border-emerald/30 text-sm font-bold text-emerald shrink-0">
                    {initials(product.seller?.full_name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-paper font-semibold truncate">
                        {product.seller?.full_name}
                      </p>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#34D399">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {product.seller?.avg_rating > 0 ? (
                      <p className="text-xs text-gold-bright font-mono mt-0.5">&#9733; {product.seller.avg_rating.toFixed(1)}</p>
                    ) : (
                      <p className="text-xs text-emerald mt-0.5">Verified</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isOwner ? (
                  product.status === 'AVAILABLE' ? (
                    <>
                      <div className="flex gap-3">
                        <Link
                          to={`/listing/${product.id}/edit`}
                          className="btn-ghost flex-1 !py-2.5 text-sm"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit Listing
                        </Link>
                        <button
                          onClick={() => setMarkSoldOpen((v) => !v)}
                          className="btn-primary flex-1 !py-2.5 text-sm"
                        >
                          Mark as Sold
                        </button>
                      </div>
                      <Link
                        to="/messages"
                        className="btn-ghost w-full !py-2.5 text-sm"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        View Messages &amp; Buyer Offers
                      </Link>
                    </>
                  ) : (
                    <div className="text-center text-sm text-mist border border-hairline rounded-xl py-3">
                      This listing has been sold.
                    </div>
                  )
                ) : product.status === 'AVAILABLE' ? (
                  user ? (
                    <>
                      <button
                        onClick={() => handleStartChat()}
                        disabled={chatBusy}
                        className="btn-primary w-full !py-3.5 text-base"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {chatBusy ? 'Opening Chat...' : 'Contact Seller'}
                      </button>

                      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                        <span className="text-mist text-[11px] shrink-0">Quick ask:</span>
                        <button
                          onClick={() => handleStartChat('Hi, is this item still available?')}
                          disabled={chatBusy}
                          className="chip !py-1 !px-3 !text-xs whitespace-nowrap hover:border-gold/50"
                        >
                          &#128075; Still available?
                        </button>
                        <button
                          onClick={() => handleStartChat(`Would you accept ${INR(Math.round(askingPrice * 0.9))} for this?`)}
                          disabled={chatBusy}
                          className="chip !py-1 !px-3 !text-xs whitespace-nowrap hover:border-gold/50"
                        >
                          &#128176; Offer {INR(Math.round(askingPrice * 0.9))}
                        </button>
                      </div>

                      {product.seller_phone && (
                        <a
                          href={`tel:${product.seller_phone}`}
                          className="btn-ghost w-full !py-2.5 text-sm"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                          </svg>
                          Call Seller ({product.seller_phone})
                        </a>
                      )}
                    </>
                  ) : (
                    <Link to="/login" className="btn-primary w-full !py-3.5 text-base">
                      Log in to contact seller
                    </Link>
                  )
                ) : null}

                {markSoldOpen && (
                  <form onSubmit={handleMarkSold} className="rounded-xl border border-hairline bg-white/[0.03] p-4 flex flex-col gap-3">
                    <label className="field-label !mb-0">Buyer's User ID</label>
                    <p className="text-xs text-mist -mt-2">
                      Ask the buyer for their profile ID, then enter it here to confirm the sale.
                    </p>
                    <input
                      value={buyerId}
                      onChange={(e) => setBuyerId(e.target.value)}
                      className="field-input"
                      placeholder="e.g. 3"
                      inputMode="numeric"
                    />
                    {markSoldError && <p className="text-sm text-crimson">{markSoldError}</p>}
                    <button type="submit" disabled={markSoldBusy} className="btn-primary w-full disabled:opacity-60">
                      {markSoldBusy ? 'Confirming...' : 'Confirm Sale'}
                    </button>
                  </form>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 rounded-xl border border-crimson/20 bg-crimson/[0.04] px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-mist">
                  Meet in public places on campus during daylight
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}