import { useState } from 'react'
import { Link } from 'react-router-dom'

const CONDITION_LABEL = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const images = parseImages(product.images)
  const hasImage = images.length > 0 && !imageFailed

  return (
    <Link
      to={`/listing/${product.id}`}
      className="id-card sheen-hover glass group flex flex-col transition-transform duration-300 hover:-translate-y-1"
    >
      {/* image / placeholder */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-ink-raised to-black/40 overflow-hidden">
        {hasImage ? (
          <img
            src={images[0]}
            alt={product.title}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="font-display text-4xl text-hairline">CC</span>
          </div>
        )}

        {product.category && (
          <span className="absolute top-3 left-3 chip !py-1 !px-2.5 !text-xs bg-ink/70 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex-1 flex flex-col gap-2 p-4">
        <h3 className="font-medium text-paper leading-snug line-clamp-2">{product.title}</h3>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-mono text-gold-bright text-lg">
            ₹{Number(product.asking_price).toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-mist border border-hairline rounded-full px-2 py-0.5">
            {CONDITION_LABEL[product.condition] || product.condition}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-hairline mt-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald/15 border border-emerald/40 text-[10px] font-semibold text-emerald">
            {initials(product.seller?.full_name)}
          </span>
          <span className="text-xs text-mist truncate">{product.seller?.full_name}</span>
          {product.seller?.avg_rating > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gold-bright font-mono">
              ★ {product.seller.avg_rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
