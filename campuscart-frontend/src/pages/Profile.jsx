import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { uploadImageToCloudinary } from '../api/cloudinary'

function parseImages(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'object' && item !== null ? item.image_url || item.url || '' : item))
      .filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'object' && item !== null ? item.image_url || item.url || '' : item))
          .filter(Boolean)
      }
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

export default function Profile() {
  const { user, updateUser, fetchProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('listings') // 'listings' | 'orders' | 'wishlist' | 'reviews'
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sub-data states
  const [myListings, setMyListings] = useState([])
  const [listingFilter, setListingFilter] = useState('all') // 'all' | 'available' | 'sold'
  const [orders, setOrders] = useState([])
  const [orderType, setOrderType] = useState('all') // 'all' | 'purchases' | 'sales'
  const [wishlist, setWishlist] = useState([])
  const [reviews, setReviews] = useState([])

  // Modal / Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', college_id: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Delete & Mark Sold states
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadFullProfile()
  }, [user, navigate])

  async function loadFullProfile() {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch user info
      const { data: userData } = await api.get('/api/auth/me/')
      setProfileData(userData)
      setEditForm({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        college_id: userData.college_id || '',
      })

      // 2. Fetch user's listings
      try {
        const { data: listingsData } = await api.get('/api/products/my/')
        setMyListings(Array.isArray(listingsData) ? listingsData : listingsData.results || [])
      } catch (e) {
        console.warn('Failed to load listings', e)
      }

      // 3. Fetch user's orders
      try {
        const { data: ordersData } = await api.get('/api/orders/my/')
        setOrders(Array.isArray(ordersData) ? ordersData : ordersData.results || [])
      } catch (e) {
        console.warn('Failed to load orders', e)
      }

      // 4. Fetch wishlist
      try {
        const { data: wishlistData } = await api.get('/api/wishlist/')
        setWishlist(Array.isArray(wishlistData) ? wishlistData : wishlistData.results || [])
      } catch (e) {
        console.warn('Failed to load wishlist', e)
      }

      // 5. Fetch reviews
      try {
        if (userData.id) {
          const { data: reviewsData } = await api.get(`/api/reviews/user/${userData.id}/`)
          setReviews(Array.isArray(reviewsData) ? reviewsData : reviewsData.results || [])
        }
      } catch (e) {
        console.warn('Failed to load reviews', e)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to load profile information. Please verify your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Handle avatar upload via Cloudinary
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const url = await uploadImageToCloudinary(file, undefined, 'campuscart/avatars')
      const { data: updated } = await api.patch('/api/auth/me/', { profile_image: url })
      setProfileData(updated)
      updateUser({ profileImage: url, fullName: updated.full_name })
      showFlash('Avatar updated successfully!')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to upload profile picture.')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Handle saving text fields
  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data: updated } = await api.patch('/api/auth/me/', editForm)
      setProfileData(updated)
      updateUser({
        fullName: updated.full_name,
        collegeId: updated.college_id,
        phone: updated.phone,
      })
      setIsEditModalOpen(false)
      showFlash('Profile information updated!')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle deleting a listing
  async function handleDeleteListing(id) {
    setDeleting(true)
    try {
      await api.delete(`/api/products/${id}/`)
      setMyListings((prev) => prev.filter((item) => item.id !== id))
      setDeleteConfirmId(null)
      showFlash('Listing removed successfully.')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to delete listing.')
    } finally {
      setDeleting(false)
    }
  }

  // Handle removing an item from wishlist
  async function handleRemoveWishlist(productId) {
    if (!productId) return
    try {
      await api.delete(`/api/wishlist/${productId}/`)
      setWishlist((prev) =>
        prev.filter((item) => {
          const pId = typeof item.product === 'object' && item.product !== null ? item.product.id : item.product
          return pId !== productId && item.product_id !== productId && item.id !== productId
        })
      )
      showFlash('Item removed from saved wishlist.')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to remove item from wishlist.')
    }
  }

  function showFlash(msg) {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(''), 4000)
  }

  const filteredListings = myListings.filter((item) => {
    if (listingFilter === 'available') return item.status === 'AVAILABLE'
    if (listingFilter === 'sold') return item.status === 'SOLD'
    return true
  })

  const activeCount = myListings.filter((i) => i.status === 'AVAILABLE').length
  const soldCount = myListings.filter((i) => i.status === 'SOLD').length

  const filteredOrders = orders.filter((order) => {
    if (orderType === 'purchases') return order.buyer === profileData?.id
    if (orderType === 'sales') return order.seller === profileData?.id
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0c10] text-paper selection:bg-gold/30">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Flash banner */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald/15 border border-emerald/30 text-emerald-bright flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')} className="text-mist hover:text-paper text-sm">
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-mist text-sm">Loading your profile & campus hub...</p>
          </div>
        ) : error ? (
          <div className="glass p-8 rounded-2xl border-crimson/30 text-center max-w-lg mx-auto">
            <p className="text-crimson mb-4">{error}</p>
            <button onClick={loadFullProfile} className="btn-primary">
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PROFILE HERO CARD */}
            <div className="glass id-card p-6 sm:p-8 rounded-2xl border border-hairline relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                
                {/* Left: Avatar + Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-gold/50 bg-gold/10 shadow-lg flex items-center justify-center relative">
                      {profileData?.profile_image ? (
                        <img
                          src={profileData.profile_image}
                          alt={profileData.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-extrabold text-gold">
                          {(profileData?.full_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}

                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Change Avatar Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      title="Upload new avatar"
                      className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-gold text-ink hover:bg-gold-bright transition shadow-md flex items-center justify-center group-hover:scale-105"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-paper">
                        {profileData?.full_name}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
                        {profileData?.role || 'Student'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-mist">
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        {profileData?.email}
                      </span>
                      {profileData?.college_id && (
                        <span className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <circle cx="9" cy="10" r="2" />
                            <path d="M15 8h2M15 12h2M7 16h10" />
                          </svg>
                          ID: <strong className="text-paper">{profileData.college_id}</strong>
                        </span>
                      )}
                      {profileData?.phone && (
                        <span className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {profileData.phone}
                        </span>
                      )}
                    </div>

                    <div className="pt-1 flex items-center gap-3 text-xs text-mist/80">
                      <span>
                        Member since {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2026'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gold">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <strong className="text-paper">{profileData?.avg_rating ? Number(profileData.avg_rating).toFixed(1) : 'New'}</strong>
                        {reviews.length > 0 && <span>({reviews.length} reviews)</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn-ghost flex-1 md:flex-initial text-sm !px-4 !py-2.5 flex items-center justify-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit Profile
                  </button>
                  <Link
                    to="/sell"
                    className="btn-primary flex-1 md:flex-initial text-sm !px-4 !py-2.5 flex items-center justify-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Post Listing
                  </Link>
                </div>

              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-hairline">
                <div className="glass p-3.5 rounded-xl border border-hairline/50 flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-mist">Active Listings</span>
                  <span className="text-2xl font-bold text-gold-bright mt-1">{activeCount}</span>
                </div>
                <div className="glass p-3.5 rounded-xl border border-hairline/50 flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-mist">Items Sold</span>
                  <span className="text-2xl font-bold text-paper mt-1">{soldCount}</span>
                </div>
                <div className="glass p-3.5 rounded-xl border border-hairline/50 flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-mist">Orders & Deals</span>
                  <span className="text-2xl font-bold text-paper mt-1">{orders.length}</span>
                </div>
                <div className="glass p-3.5 rounded-xl border border-hairline/50 flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-mist">Saved Items</span>
                  <span className="text-2xl font-bold text-paper mt-1">{wishlist.length}</span>
                </div>
              </div>
            </div>

            {/* NAVIGATION TABS */}
            <div className="flex items-center justify-between border-b border-hairline pb-2 overflow-x-auto gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'listings'
                      ? 'bg-gold/15 text-gold-bright border border-gold/40 shadow-sm'
                      : 'text-mist hover:text-paper hover:bg-white/5'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  My Listings ({myListings.length})
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-gold/15 text-gold-bright border border-gold/40 shadow-sm'
                      : 'text-mist hover:text-paper hover:bg-white/5'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Orders & Deals ({orders.length})
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'wishlist'
                      ? 'bg-gold/15 text-gold-bright border border-gold/40 shadow-sm'
                      : 'text-mist hover:text-paper hover:bg-white/5'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  Saved Wishlist ({wishlist.length})
                </button>

                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'reviews'
                      ? 'bg-gold/15 text-gold-bright border border-gold/40 shadow-sm'
                      : 'text-mist hover:text-paper hover:bg-white/5'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Reviews ({reviews.length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT: MY LISTINGS */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                {/* Filter Sub-Bar */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setListingFilter('all')}
                      className={`chip ${listingFilter === 'all' ? '!bg-gold/15 !border-gold/50 !text-gold-bright' : ''}`}
                    >
                      All ({myListings.length})
                    </button>
                    <button
                      onClick={() => setListingFilter('available')}
                      className={`chip ${listingFilter === 'available' ? '!bg-emerald/15 !border-emerald/40 !text-emerald-bright' : ''}`}
                    >
                      Active ({activeCount})
                    </button>
                    <button
                      onClick={() => setListingFilter('sold')}
                      className={`chip ${listingFilter === 'sold' ? '!bg-mist/15 !border-mist/40 !text-paper' : ''}`}
                    >
                      Sold ({soldCount})
                    </button>
                  </div>

                  <Link to="/sell" className="btn-primary !py-2 !px-4 text-xs font-semibold">
                    + Add New Item
                  </Link>
                </div>

                {filteredListings.length === 0 ? (
                  <div className="glass p-12 rounded-2xl border border-hairline text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center text-mist">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-paper">No items found</h3>
                    <p className="text-mist text-sm max-w-md mx-auto">
                      {listingFilter === 'all'
                        ? "You haven't listed any items for sale yet. Turn your unused textbooks, gadgets, or bike into cash!"
                        : `You have no ${listingFilter} listings at the moment.`}
                    </p>
                    <Link to="/sell" className="btn-primary inline-flex">
                      Create Your First Listing
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((item) => {
                      const itemImages = parseImages(item.images)
                      const hasImage = itemImages.length > 0

                      return (
                        <div
                          key={item.id}
                          className="glass rounded-2xl border border-hairline/80 overflow-hidden flex flex-col hover:border-gold/40 transition-all duration-200 group"
                        >
                          {/* Image banner */}
                          <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                            {hasImage ? (
                              <img
                                src={itemImages[0]}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-no-img')
                                  if (fallback) fallback.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center text-mist/50 ${hasImage ? 'hidden fallback-no-img' : ''}`}>
                              <span className="font-display text-2xl text-hairline">CC</span>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow ${
                                  item.status === 'AVAILABLE'
                                    ? 'bg-emerald-500/80 text-white'
                                    : 'bg-zinc-700/90 text-zinc-300'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            {/* Price Tag */}
                            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-hairline text-gold font-bold text-sm">
                              ₹{Number(item.asking_price).toLocaleString('en-IN')}
                            </div>
                          </div>

                        {/* Body Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-xs text-mist mb-1">
                              <span className="uppercase tracking-wider font-semibold">{item.category}</span>
                              <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                {item.view_count || 0} views
                              </span>
                            </div>

                            <Link
                              to={`/listing/${item.id}`}
                              className="font-bold text-base text-paper hover:text-gold-bright line-clamp-1 transition-colors"
                            >
                              {item.title}
                            </Link>

                            <p className="text-mist text-xs line-clamp-2 mt-1.5 leading-relaxed">
                              {item.description || 'No description provided.'}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-hairline/60 flex items-center gap-2">
                            <Link
                              to={`/listing/${item.id}`}
                              className="btn-ghost flex-1 !py-2 text-xs text-center"
                            >
                              View
                            </Link>

                            <Link
                              to={`/sell/${item.id}`}
                              className="btn-ghost !py-2 !px-3 text-xs text-gold hover:text-gold-bright"
                              title="Edit listing"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </Link>

                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="btn-ghost !py-2 !px-3 text-xs text-crimson hover:bg-crimson/10"
                              title="Delete listing"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ORDERS & DEALS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOrderType('all')}
                    className={`chip ${orderType === 'all' ? '!bg-gold/15 !border-gold/50 !text-gold-bright' : ''}`}
                  >
                    All Deals ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderType('purchases')}
                    className={`chip ${orderType === 'purchases' ? '!bg-emerald/15 !border-emerald/40 !text-emerald-bright' : ''}`}
                  >
                    Purchases
                  </button>
                  <button
                    onClick={() => setOrderType('sales')}
                    className={`chip ${orderType === 'sales' ? '!bg-gold/15 !border-gold/40 !text-gold-bright' : ''}`}
                  >
                    Sales
                  </button>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="glass p-12 rounded-2xl border border-hairline text-center space-y-3">
                    <p className="text-mist">No orders recorded yet.</p>
                    <p className="text-xs text-mist/70">
                      When you sell an item and confirm the campus buyer, the transaction record will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const isBuyer = order.buyer === profileData?.id
                      const orderImages = parseImages(order.product_details?.images)
                      const hasOrderImg = orderImages.length > 0

                      return (
                        <div
                          key={order.id}
                          className="glass p-4 sm:p-5 rounded-2xl border border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            {hasOrderImg ? (
                              <img
                                src={orderImages[0]}
                                alt={order.product_details?.title || 'Order product'}
                                className="w-12 h-12 rounded-xl object-cover border border-hairline shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-bold shrink-0">
                                {isBuyer ? '🛍️' : '🤝'}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isBuyer ? 'bg-emerald/20 text-emerald-bright' : 'bg-gold/20 text-gold'
                                }`}>
                                  {isBuyer ? 'Bought' : 'Sold'}
                                </span>
                                <span className="text-xs text-mist">
                                  {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </span>
                              </div>
                              <h4 className="font-bold text-paper text-base mt-0.5">
                                {order.product_details?.title || `Item #${order.product}`}
                              </h4>
                              <p className="text-xs text-mist">
                                {isBuyer ? `Seller: ${order.seller_name || 'Campus Student'}` : `Buyer: ${order.buyer_name || 'Campus Student'}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {order.product_details?.asking_price && (
                              <span className="text-base font-bold text-gold">
                                ₹{Number(order.product_details.asking_price).toLocaleString()}
                              </span>
                            )}
                            <Link
                              to={`/messages`}
                              className="btn-ghost !py-1.5 !px-3 text-xs"
                            >
                              Open Chat
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                {wishlist.length === 0 ? (
                  <div className="glass p-12 rounded-2xl border border-hairline text-center space-y-3">
                    <p className="text-mist">Your wishlist is empty.</p>
                    <Link to="/" className="btn-primary inline-flex text-xs">
                      Explore Campus Listings
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => {
                      const prod = typeof item.product === 'object' && item.product !== null ? item.product : null
                      const productId = prod?.id || (typeof item.product === 'number' || typeof item.product === 'string' ? item.product : item.product_id) || item.id
                      const productTitle = prod?.title || item.product_title || `Product #${productId}`
                      const productPrice = prod?.asking_price ?? item.price_at_add
                      const productStatus = prod?.status || 'AVAILABLE'
                      const prodImages = parseImages(prod?.images || item.images)
                      const hasImg = prodImages.length > 0

                      return (
                        <div
                          key={item.id}
                          className="glass rounded-2xl border border-hairline/80 overflow-hidden flex flex-col justify-between hover:border-gold/40 transition-all duration-200 group"
                        >
                          {/* Image banner */}
                          <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                            {hasImg ? (
                              <img
                                src={prodImages[0]}
                                alt={productTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-no-img')
                                  if (fallback) fallback.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center text-mist/50 ${hasImg ? 'hidden fallback-no-img' : ''}`}>
                              <span className="font-display text-2xl text-hairline">CC</span>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow ${
                                  productStatus === 'AVAILABLE'
                                    ? 'bg-emerald-500/80 text-white'
                                    : 'bg-zinc-700/90 text-zinc-300'
                                }`}
                              >
                                {productStatus}
                              </span>
                            </div>

                            {/* Price Tag */}
                            {productPrice && (
                              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-hairline text-gold font-bold text-sm">
                                ₹{Number(productPrice).toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>

                          {/* Body details & actions */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] uppercase tracking-wider text-mist">
                                  Saved {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </span>
                                {item.price_dropped && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald bg-emerald/10 border border-emerald/30 px-2 py-0.5 rounded-full">
                                    ↓ Price Dropped
                                  </span>
                                )}
                              </div>

                              <Link
                                to={`/listing/${productId}`}
                                className="font-bold text-paper text-base mt-1 line-clamp-1 hover:text-gold-bright transition-colors block"
                              >
                                {productTitle}
                              </Link>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-hairline/60">
                              <Link
                                to={`/listing/${productId}`}
                                className="btn-primary flex-1 !py-1.5 text-xs text-center font-medium"
                              >
                                View Item
                              </Link>
                              <button
                                onClick={() => handleRemoveWishlist(productId)}
                                className="btn-ghost !py-1.5 !px-3 text-xs text-crimson hover:bg-crimson/10 transition-colors"
                                title="Remove from saved"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="glass p-12 rounded-2xl border border-hairline text-center space-y-3">
                    <p className="text-mist">No student reviews yet.</p>
                    <p className="text-xs text-mist/70">
                      Ratings and reviews will show here as you complete purchases and sales with your peers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="glass p-5 rounded-2xl border border-hairline space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-paper text-sm">{rev.reviewer_name || 'Student'}</span>
                            <span className="text-xs text-mist">• {new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-gold text-xs font-bold gap-1">
                            {'★'.repeat(rev.rating)}
                            <span className="text-mist">({rev.rating}/5)</span>
                          </div>
                        </div>
                        {rev.comment && <p className="text-sm text-paper/90 leading-relaxed">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-2xl border border-hairline p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-lg font-bold text-paper">Edit Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-mist hover:text-paper text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="field-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="field-input"
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div>
                <label className="field-label">College / Student ID</label>
                <input
                  type="text"
                  value={editForm.college_id}
                  onChange={(e) => setEditForm({ ...editForm, college_id: e.target.value })}
                  className="field-input"
                  placeholder="e.g. CS2024-042"
                />
              </div>

              <div>
                <label className="field-label">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="field-input"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-ghost !py-2.5 !px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary !py-2.5 !px-5 text-sm"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full rounded-2xl border border-crimson/40 p-6 space-y-4 animate-fadeIn text-center">
            <div className="w-12 h-12 rounded-full bg-crimson/15 text-crimson mx-auto flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-paper">Delete Listing?</h3>
            <p className="text-xs text-mist">
              This action cannot be undone. The listing and all associated buyer inquiries will be permanently removed.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-ghost flex-1 !py-2 text-xs"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteListing(deleteConfirmId)}
                className="btn-primary !bg-crimson hover:!bg-crimson/90 !text-white flex-1 !py-2 text-xs font-bold"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
