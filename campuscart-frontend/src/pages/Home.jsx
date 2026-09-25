import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'

const CATEGORIES = ['All', 'Books', 'Electronics', 'Calculators', 'Bicycles', 'Furniture', 'General', 'Other']

export default function Home() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts()
    }, 300) // small debounce so we're not firing a request per keystroke
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category])

  async function fetchProducts() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (search) params.search = search
      if (category !== 'All') params.category = category
      const { data } = await api.get('/api/products/', { params })
      setProducts(data)
    } catch (err) {
      setError(
        'Could not reach the CampusCart server. Make sure the Django backend is running on http://localhost:8000.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar search={search} onSearchChange={setSearch} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* category chips */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="chip"
              data-active={category === c}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="id-card glass aspect-[4/3] animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="id-card glass p-10 text-center">
            <p className="text-mist">{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="id-card glass p-14 text-center">
            <p className="font-display text-xl text-paper mb-2">No listings yet</p>
            <p className="text-mist text-sm">
              {search || category !== 'All'
                ? 'Try a different search or category.'
                : 'Be the first to list something on CampusCart.'}
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
