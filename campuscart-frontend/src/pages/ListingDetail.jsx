import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const CONDITION_LABEL = {
  NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
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

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)

  const [markSoldOpen, setMarkSoldOpen] = useState(false)
  const [buyerId, setBuyerId] = useState('')
  const [markSoldError, setMarkSoldError] = useState('')
  const [markSoldBusy, setMarkSoldBusy] = useState(false)

  useEffect(() => {
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadProduct() {
    setLoading(true)
    setNotFound(false)
    setImgFailed(false)
    try {
      const { data } = await api.get(`/api/products/${id}/`)
      setProduct(data)
      if (data.seller?.id) {
        api.get(`/api/reviews/user/${data.seller.id}/`).then((r) => setReviews(r.data)).catch(() => {})
      }
      if (user) {
        api.get('/api/wishlist/').then((r) => {
          setInWishlist(r.data.some((item) => item.product.id === data.id))
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
    } catch (err) {
      // most likely a stale/duplicate state — refresh truth from the server
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
        (Array.isArray(data) && data[0]) || data?.non_field_errors?.[0] || data?.detail || 'Could not mark as sold — check the buyer ID and try again.'
      )
    } finally {
      setMarkSoldBusy(false)
    }
  }

  const isOwner = user && product && user.id === product.seller?.id
  const hasImage = product?.images?.length > 0 && !imgFailed

  return (
    <div className="min-h-screen">
      <Navbar search="" onSearchChange={() => {}} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/" className="text-sm text-mist hover:text-paper inline-flex items-center gap-1.5 mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to browsing
        </Link>

        {loading && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="id-card glass aspect-[4/3] animate-pulse bg-white/[0.02]" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-6 w-1/3 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-24 rounded bg-white/[0.04] animate-pulse" />
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
          <div className="grid md:grid-cols-2 gap-8">
            {/* image */}
            <div className="id-card glass aspect-[4/3] overflow-hidden relative">
              {hasImage ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-ink-raised to-black/40">
                  <span className="font-display text-6xl text-hairline">CC</span>
                </div>
              )}
              {product.status === 'SOLD' && (
                <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                  <span className="font-display text-2xl text-crimson border-2 border-crimson rounded-lg px-6 py-2 rotate-[-8deg]">
                    SOLD
                  </span>
                </div>
              )}
            </div>

            {/* details */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-display text-2xl sm:text-3xl text-paper leading-tight">{product.title}</h1>
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistBusy}
                  title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                  className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full border border-hairline hover:border-gold/50 transition-colors disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? '#C9A227' : 'none'} stroke={inWishlist ? '#C9A227' : '#A8A6A0'} strokeWidth="2">
                    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <span className="font-mono text-gold-bright text-3xl">
                  ₹{Number(product.asking_price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-mist border border-hairline rounded-full px-2.5 py-1">
                  {CONDITION_LABEL[product.condition] || product.condition}
                </span>
                {product.category && (
                  <span className="chip !py-1 !px-2.5 !text-xs">{product.category}</span>
                )}
              </div>

              <p className="text-mist mt-5 leading-relaxed whitespace-pre-wrap">
                {product.description || 'No description provided.'}
              </p>

              {/* seller card */}
              <div className="id-card glass p-4 mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald/15 border border-emerald/40 text-sm font-semibold text-emerald">
                  {initials(product.seller?.full_name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-paper font-medium truncate">{product.seller?.full_name}</p>
                  <p className="text-xs text-mist">
                    {product.seller?.avg_rating > 0
                      ? <span className="text-gold-bright font-mono">★ {product.seller.avg_rating.toFixed(1)}</span>
                      : 'No ratings yet'}
                  </p>
                </div>
              </div>

              {/* actions */}
              <div className="mt-5 flex flex-col gap-3">
                {isOwner ? (
                  product.status === 'AVAILABLE' ? (
                    <button onClick={() => setMarkSoldOpen((v) => !v)} className="btn-primary w-full">
                      Mark as Sold
                    </button>
                  ) : (
                    <div className="text-center text-sm text-mist border border-hairline rounded-xl py-3">
                      This listing has been sold.
                    </div>
                  )
                ) : product.status === 'AVAILABLE' ? (
                  user ? (
                    product.seller_phone ? (
                      <a href={`tel:${product.seller_phone}`} className="btn-primary w-full">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        Call {product.seller?.full_name?.split(' ')[0]} — {product.seller_phone}
                      </a>
                    ) : (
                      <div className="text-center text-sm text-mist border border-hairline rounded-xl py-3">
                        No phone number on file for this seller.
                      </div>
                    )
                  ) : (
                    <Link to="/login" className="btn-primary w-full">
                      Log in to contact seller
                    </Link>
                  )
                ) : null}

                {markSoldOpen && (
                  <form onSubmit={handleMarkSold} className="id-card glass p-4 flex flex-col gap-3">
                    <label className="field-label !mb-0">Buyer's User ID</label>
                    <p className="text-xs text-mist -mt-2">
                      Ask the buyer for their profile ID (shown after they log in), then enter it here to confirm the sale.
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
                      {markSoldBusy ? 'Confirming…' : 'Confirm Sale'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* reviews */}
        {!loading && !notFound && product && (
          <section className="mt-14">
            <h2 className="font-display text-xl text-paper mb-4">
              Reviews for {product.seller?.full_name}
              {reviews.length > 0 && <span className="text-mist font-sans text-sm font-normal"> · {reviews.length}</span>}
            </h2>

            {reviews.length === 0 ? (
              <p className="text-mist text-sm">No reviews yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div key={r.id} className="id-card glass p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-paper font-medium text-sm">{r.reviewer.full_name}</span>
                      <span className="font-mono text-gold-bright text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className="text-mist text-sm mb-2">{r.comment}</p>}
                    <p className="text-xs text-mist/70">{timeAgo(r.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
