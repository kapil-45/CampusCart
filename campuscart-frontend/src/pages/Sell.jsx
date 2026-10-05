import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
]

const CATEGORIES = ['Books', 'Electronics', 'Calculators', 'stationery', 'Furniture', 'General', 'Other']

export default function Sell() {
  const { user } = useAuth()
  const navigate = useNavigate()

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

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addImage() {
    const url = imageUrl.trim()
    if (!url) return
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
    try {
      const { data } = await api.post('/api/products/', {
        ...form,
        asking_price: Number(form.asking_price),
        images,
      })
      navigate(`/listing/${data.id}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldErrors = {}
        Object.entries(data).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val
        })
        setErrors(fieldErrors)
      } else {
        setFormError('Could not create the listing. Please check your details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Not logged in — send to login instead of showing a form that will just 401.
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar search="" onSearchChange={() => { }} />
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="id-card glass p-12">
            <p className="font-display text-2xl text-paper mb-2">Log in to sell on CampusCart</p>
            <p className="text-mist text-sm mb-6">You need a student account to list an item.</p>
            <Link to="/login" className="btn-primary inline-flex">Log In</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar search="" onSearchChange={() => { }} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link to="/" className="text-sm text-mist hover:text-paper inline-flex items-center gap-1.5 mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to browsing
        </Link>

        <div className="id-card glass p-8">
          <h1 className="font-display text-2xl text-paper mb-1">List an item</h1>
          <p className="text-sm text-mist mb-7">
            Give it a clear title and honest condition — buyers on your campus will see this right away.
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

            <div>
              <label className="field-label">Photos (optional)</label>
              <p className="text-xs text-mist -mt-1 mb-2">
                Paste a direct image URL for now — proper photo upload is coming soon.
              </p>
              <div className="flex gap-2">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
                  placeholder="https://…"
                  className="field-input flex-1"
                />
                <button type="button" onClick={addImage} className="btn-ghost !px-4 shrink-0">
                  Add
                </button>
              </div>
              {images.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {images.map((url, i) => (
                    <li key={i} className="flex items-center justify-between text-xs text-mist bg-black/20 border border-hairline rounded-lg px-3 py-2">
                      <span className="truncate">{url}</span>
                      <button type="button" onClick={() => removeImage(i)} className="text-crimson hover:text-crimson/80 ml-3 shrink-0">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {formError && (
              <p className="text-sm text-crimson bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
              {loading ? 'Publishing…' : 'Publish Listing'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
