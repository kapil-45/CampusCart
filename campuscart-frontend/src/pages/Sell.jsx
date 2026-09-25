import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import {
  uploadImageToCloudinary,
  createLocalPreview,
  isCloudinaryConfigured,
  CLOUDINARY_CLOUD_NAME,
} from '../api/cloudinary'

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
]

const CATEGORIES = ['Books', 'Electronics', 'Calculators', 'Bicycles', 'Furniture', 'General', 'Other']

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

export default function Sell() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    asking_price: '',
    condition: 'GOOD',
    category: 'Books',
  })
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingProduct, setFetchingProduct] = useState(isEdit)
  const [unauthorized, setUnauthorized] = useState(false)

  // Uploading state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  useEffect(() => {
    if (isEdit) {
      loadInitialProduct()
    }
  }, [id])

  async function loadInitialProduct() {
    setFetchingProduct(true)
    setFormError('')
    try {
      const { data } = await api.get(`/api/products/${id}/`)
      if (user && data.seller?.id && data.seller.id !== user.id) {
        setUnauthorized(true)
        return
      }
      setForm({
        title: data.title || '',
        description: data.description || '',
        asking_price: data.asking_price ? String(data.asking_price) : '',
        condition: data.condition || 'GOOD',
        category: data.category || 'Books',
      })
      setImages(parseImages(data.images))
    } catch (err) {
      setFormError('Could not load listing details. It may not exist or has been removed.')
    } finally {
      setFetchingProduct(false)
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return
    setUploadError('')
    setUploading(true)
    setUploadProgress(10)

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileList.length === 0) {
      setUploadError('Please select valid image files (JPG, PNG, WebP).')
      setUploading(false)
      return
    }

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (isCloudinaryConfigured) {
          // Real Cloudinary upload
          const uploadedUrl = await uploadImageToCloudinary(file, (percent) => {
            const overall = Math.round(((i + percent / 100) / fileList.length) * 100)
            setUploadProgress(overall)
          })
          setImages((prev) => [...prev, uploadedUrl])
        } else {
          // Local base64 data preview fallback when Cloudinary is not configured yet
          const dataUrl = await createLocalPreview(file)
          setImages((prev) => [...prev, dataUrl])
          setUploadProgress(Math.round(((i + 1) / fileList.length) * 100))
        }
      }
    } catch (err) {
      setUploadError(err.message || 'Image upload failed. Try adding via direct URL or configure Cloudinary.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function addImageUrl() {
    const url = imageUrl.trim()
    if (!url) return
    if (images.includes(url)) {
      setImageUrl('')
      return
    }
    setImages((imgs) => [...imgs, url])
    setImageUrl('')
  }

  function removeImage(idx) {
    setImages((imgs) => imgs.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setErrors({})
    setLoading(true)

    const finalImages = [...images]
    const pendingUrl = imageUrl.trim()
    if (pendingUrl && !finalImages.includes(pendingUrl)) {
      finalImages.push(pendingUrl)
    }

    const payload = {
      ...form,
      asking_price: Number(form.asking_price),
      images: finalImages,
    }

    try {
      if (isEdit) {
        await api.patch(`/api/products/${id}/`, payload)
        navigate(`/listing/${id}`)
      } else {
        const { data } = await api.post('/api/products/', payload)
        navigate(`/listing/${data.id}`)
      }
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors = {}
        Object.entries(data).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val
        })
        setErrors(fieldErrors)
      } else {
        setFormError(
          isEdit
            ? 'Could not update the listing. Please check your details and try again.'
            : 'Could not create the listing. Please check your details and try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Not logged in — send to login instead of showing a form that will just 401.
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar search="" onSearchChange={() => {}} />
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="id-card glass p-12">
            <p className="font-display text-2xl text-paper mb-2">
              {isEdit ? 'Log in to edit your listing' : 'Log in to sell on CampusCart'}
            </p>
            <p className="text-mist text-sm mb-6">You need a student account to manage listings.</p>
            <Link to="/login" className="btn-primary inline-flex">Log In</Link>
          </div>
        </main>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen">
        <Navbar search="" onSearchChange={() => {}} />
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="id-card glass p-12">
            <p className="font-display text-2xl text-crimson mb-2">Permission Denied</p>
            <p className="text-mist text-sm mb-6">You can only edit your own listings.</p>
            <Link to="/" className="btn-primary inline-flex">Back to Browse</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar search="" onSearchChange={() => {}} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          to={isEdit ? `/listing/${id}` : '/'}
          className="text-sm text-mist hover:text-paper inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          {isEdit ? 'Back to listing' : 'Back to browsing'}
        </Link>

        {fetchingProduct ? (
          <div className="id-card glass p-10 text-center animate-pulse">
            <p className="text-mist">Loading listing details…</p>
          </div>
        ) : (
          <div className="id-card glass p-8">
            <h1 className="font-display text-2xl text-paper mb-1">
              {isEdit ? 'Edit listing' : 'List an item'}
            </h1>
            <p className="text-sm text-mist mb-7">
              {isEdit
                ? 'Update your product details, price, condition, or photos.'
                : 'Give it a clear title and honest condition — buyers on your campus will see this right away.'}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FormField
                label="Title"
                required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Data Structures Textbook, 4th Edition"
                error={errors.title}
              />

              <div>
                <label className="field-label">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Condition details, why you're selling, pickup info…"
                  className="field-input resize-none"
                />
                {errors.description && <p className="mt-1.5 text-sm text-crimson">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Asking Price (₹)"
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={form.asking_price}
                  onChange={(e) => update('asking_price', e.target.value)}
                  placeholder="450"
                  error={errors.asking_price}
                />
                <div>
                  <label className="field-label">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => update('condition', e.target.value)}
                    className="field-input"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => update('category', c)}
                      className="chip"
                      data-active={form.category === c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Photos Section with Cloudinary Drag & Drop */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="field-label !mb-0">Product Photos</label>
                    {isCloudinaryConfigured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Cloudinary Active ({CLOUDINARY_CLOUD_NAME})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfigModal(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-gold/10 text-gold-bright border border-gold/20 hover:bg-gold/20 transition-colors"
                      >
                        ℹ Setup Cloudinary
                      </button>
                    )}
                  </div>
                  {images.length > 0 && (
                    <span className="text-xs text-mist font-mono">{images.length} added</span>
                  )}
                </div>
                <p className="text-xs text-mist mb-3">
                  Upload photos of the item so buyers can inspect the condition.
                </p>

                {/* Drag and Drop Zone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFiles(e.target.files)}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(201,162,39,0.2)]'
                      : 'border-hairline bg-black/20 hover:border-gold/50 hover:bg-black/40'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold-bright">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-paper">
                        <span className="text-gold-bright underline">Click to upload photos</span> or drag & drop
                      </p>
                      <p className="text-xs text-mist mt-0.5">
                        Supports JPG, PNG, WebP (multiple files allowed)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {uploading && (
                  <div className="mt-3 p-3 rounded-xl bg-black/50 border border-gold/30">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gold-bright flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Uploading photos…
                      </span>
                      <span className="font-mono text-mist">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gold h-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <p className="mt-2 text-xs text-crimson bg-crimson/10 border border-crimson/20 rounded-lg px-3 py-2">
                    {uploadError}
                  </p>
                )}

                {/* Collapsible Direct URL Option */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-mist hover:text-gold-bright flex items-center gap-1 transition-colors"
                  >
                    <span>{showUrlInput ? '▾ Hide direct image URL input' : '▸ Or paste direct image URL'}</span>
                  </button>

                  {showUrlInput && (
                    <div className="mt-2 flex gap-2 animate-fadeIn">
                      <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addImageUrl()
                          }
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="field-input flex-1 !text-xs !py-2"
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        disabled={!imageUrl.trim()}
                        className="btn-ghost !px-4 !py-2 text-xs shrink-0 disabled:opacity-40"
                      >
                        + Add URL
                      </button>
                    </div>
                  )}
                </div>

                {/* Added images list with live previews and cover badge */}
                {images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-mist/80 mb-2">
                      Attached Images ({images.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((url, i) => (
                        <div
                          key={i}
                          className="group relative rounded-xl overflow-hidden border border-hairline bg-black/30 aspect-[4/3] transition-all hover:border-gold/40"
                        >
                          <img
                            src={url}
                            alt={`Preview ${i + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = ''
                              e.currentTarget.classList.add('hidden')
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden h-full w-full flex flex-col items-center justify-center p-2 text-center bg-black/60">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-crimson mb-1">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="text-[11px] text-mist">Image failed to load</span>
                          </div>

                          {/* Top badge */}
                          <div className="absolute top-1.5 left-1.5">
                            <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-mono text-paper backdrop-blur-sm border border-white/10">
                              {i === 0 ? '★ Cover' : `#${i + 1}`}
                            </span>
                          </div>

                          {/* Delete overlay button */}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            title="Remove image"
                            className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-crimson/90 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-105 transition-all shadow-md"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <p className="text-sm text-crimson bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || uploading}
                className="btn-primary w-full mt-2 disabled:opacity-60"
              >
                {loading
                  ? (isEdit ? 'Saving changes…' : 'Publishing…')
                  : (isEdit ? 'Save Changes' : 'Publish Listing')}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Cloudinary Setup Info Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="id-card glass max-w-md w-full p-6 relative">
            <h3 className="font-display text-xl text-paper mb-2 flex items-center gap-2">
              <span className="text-gold-bright">☁️</span> Free Cloudinary Setup
            </h3>
            <p className="text-xs text-mist mb-4 leading-relaxed">
              Enable instant cloud image hosting for your product photos in 2 minutes:
            </p>
            <ol className="text-xs text-mist space-y-2 mb-5 list-decimal list-inside bg-black/40 p-3 rounded-xl border border-hairline">
              <li>Sign up for a free account at <strong className="text-paper">cloudinary.com</strong></li>
              <li>Go to <strong className="text-paper">Settings → Upload</strong></li>
              <li>Click <strong className="text-paper">Add Upload Preset</strong></li>
              <li>Set <em className="text-gold-bright">Signing Mode</em> to <strong className="text-paper">Unsigned</strong> and save.</li>
              <li>
                Add both to <code className="text-gold-bright bg-white/5 px-1 py-0.5 rounded font-mono">campuscart-frontend/.env</code>:
                <div className="mt-1 font-mono text-[11px] text-paper bg-black/60 p-2 rounded border border-hairline">
                  VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name<br/>
                  VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name
                </div>
              </li>
            </ol>
            <p className="text-[11px] text-mist/80 mb-5">
              * Note: If not set up yet, images will preview locally and allow full submission for testing!
            </p>
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="btn-primary w-full !py-2 text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
