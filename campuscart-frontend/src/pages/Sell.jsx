import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import FormField from '../components/FormField'
import { uploadImageToCloudinary } from '../api/cloudinary'

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
]

const CATEGORIES = [
  'Books',
  'Electronics',
  'Calculators',
  'stationery',
  'Furniture',
  'General',
  'Other',
]

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

  const [images, setImages] = useState([])
  const [imageUrl, setImageUrl] = useState('')

  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({
      ...f,
      [field]: value,
    }))
  }

  // -----------------------------------------
  // ADD IMAGE USING URL
  // -----------------------------------------
  function addImageUrl() {
    const url = imageUrl.trim()

    if (!url) return

    try {
      new URL(url)
    } catch {
      setFormError('Please enter a valid image URL.')
      return
    }

    setImages((prev) => [...prev, url])
    setImageUrl('')
    setFormError('')
  }

  // -----------------------------------------
  // UPLOAD LOCAL IMAGES
  // -----------------------------------------
  async function handleImageSelect(e) {
    const files = Array.from(e.target.files || [])

    if (!files.length) return

    setUploadingImages(true)
    setUploadProgress(0)
    setFormError('')

    try {
      const uploadedUrls = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file.`)
        }

        const baseProgress = Math.round((i / files.length) * 100)

        const url = await uploadImageToCloudinary(
          file,
          (fileProgress) => {
            const progress = Math.round(
              baseProgress + fileProgress / files.length
            )

            setUploadProgress(progress)
          },
          'campuscart/products'
        )

        uploadedUrls.push(url)
      }

      setImages((prev) => [...prev, ...uploadedUrls])
      setUploadProgress(100)
    } catch (err) {
      console.error('Image upload error:', err)

      setFormError(
        err.message ||
        'Failed to upload image. Please check your Cloudinary configuration.'
      )
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  // -----------------------------------------
  // REMOVE IMAGE
  // -----------------------------------------
  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // -----------------------------------------
  // SUBMIT LISTING
  // -----------------------------------------
  async function handleSubmit(e) {
    e.preventDefault()

    setFormError('')
    setErrors({})

    if (uploadingImages) {
      setFormError('Please wait until all images finish uploading.')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post('/api/products/', {
        ...form,
        asking_price: Number(form.asking_price),
        images,
      })

      navigate(`/listing/${data.id}`)
    } catch (err) {
      console.error(err)

      const data = err.response?.data

      if (data && typeof data === 'object') {
        const fieldErrors = {}

        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value
        })

        setErrors(fieldErrors)
      } else {
        setFormError(
          'Could not create the listing. Please check your details and try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------
  // LOGIN REQUIRED
  // -----------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar search="" onSearchChange={() => { }} />

        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold text-white">
            Please log in to sell an item
          </h1>

          <p className="mt-3 text-sm text-mist">
            You need to be logged in before creating a listing.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black"
          >
            Log In
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar search="" onSearchChange={() => { }} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Sell an Item
          </h1>

          <p className="mt-2 text-sm text-mist">
            Create a listing for students on campus.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* TITLE */}
          <FormField
            label="Title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Data Structures textbook"
            error={errors.title}
          />

          {/* DESCRIPTION */}
          <div>
            <label className="field-label">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                update('description', e.target.value)
              }
              placeholder="Describe your item..."
              rows={5}
              className="w-full rounded-xl border border-hairline bg-black/20 px-4 py-3 text-white outline-none focus:border-gold/50"
            />

            {errors.description && (
              <p className="mt-1 text-xs text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* PRICE */}
          <FormField
            label="Asking Price"
            type="number"
            value={form.asking_price}
            onChange={(e) =>
              update('asking_price', e.target.value)
            }
            placeholder="e.g. 500"
            error={errors.asking_price}
          />

          {/* CONDITION */}
          <div>
            <label className="field-label">
              Condition
            </label>

            <select
              value={form.condition}
              onChange={(e) =>
                update('condition', e.target.value)
              }
              className="w-full rounded-xl border border-hairline bg-black/20 px-4 py-3 text-white outline-none focus:border-gold/50"
            >
              {CONDITIONS.map((condition) => (
                <option
                  key={condition.value}
                  value={condition.value}
                  className="bg-black"
                >
                  {condition.label}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="field-label">
              Category
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                update('category', e.target.value)
              }
              className="w-full rounded-xl border border-hairline bg-black/20 px-4 py-3 text-white outline-none focus:border-gold/50"
            >
              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                  className="bg-black"
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* ========================================= */}
          {/* IMAGES */}
          {/* ========================================= */}
          <div>
            <label className="field-label">
              Photos (optional)
            </label>

            <p className="mb-4 mt-1 text-xs text-mist">
              Upload photos directly from your device or add
              an image using a URL.
            </p>

            {/* LOCAL IMAGE UPLOAD */}
            <label
              htmlFor="product-images"
              className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-black/20 transition-colors hover:border-gold/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mb-2 text-gold"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>

              <span className="text-sm font-medium text-white">
                {uploadingImages
                  ? 'Uploading photos...'
                  : 'Choose photos from your device'}
              </span>

              <span className="mt-1 text-xs text-mist">
                JPG, PNG, WEBP
              </span>

              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>

            {/* UPLOAD PROGRESS */}
            {uploadingImages && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-mist">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* OR */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-hairline" />

              <span className="text-xs text-mist">
                OR
              </span>

              <div className="h-px flex-1 bg-hairline" />
            </div>

            {/* IMAGE URL */}
            <div>
              <label className="mb-2 block text-sm text-white">
                Add image using URL
              </label>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) =>
                    setImageUrl(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addImageUrl()
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="min-w-0 flex-1 rounded-xl border border-hairline bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-mist focus:border-gold/50"
                />

                <button
                  type="button"
                  onClick={addImageUrl}
                  className="rounded-xl border border-hairline px-4 py-3 text-sm font-medium text-white transition hover:border-gold/50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* IMAGE PREVIEWS */}
            {images.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-sm text-white">
                  Selected Images ({images.length})
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="group relative overflow-hidden rounded-xl border border-hairline bg-black/20"
                    >
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="h-32 w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.3'
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-red-500"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ERROR */}
          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {formError}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading || uploadingImages}
            className="w-full rounded-xl bg-gold px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingImages
              ? 'Uploading photos...'
              : loading
                ? 'Publishing...'
                : 'Publish Listing'}
          </button>
        </form>
      </main>
    </div>
  )
}