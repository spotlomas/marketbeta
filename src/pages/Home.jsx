import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import ProductList from '../components/ProductList'
import { useApp } from '../context/AppContext'

export default function Home() {
  const { usuario } = useApp()
  const [products, setProducts] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Filtrar productos sin stock (solo los que tienen stock_ilimitado=false y stock=0 se ocultan)
      const disponibles = data.filter(p => p.stock_ilimitado || p.stock > 0)
      setProducts(disponibles)
      setFeatured(disponibles.filter(p => p.featured))
    }
    setLoading(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {usuario?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Descubre los productos disponibles en MarketBeta</p>
        </div>

        {/* Destacados */}
        {featured.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">⭐ Destacados</h2>
            <ProductList products={featured} loading={false} />
          </section>
        )}

        {/* Buscador */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full max-w-md border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Todos los productos */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Todos los productos
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
            )}
          </h2>
          <ProductList products={filtered} loading={loading} />
        </section>

      </main>
    </div>
  )
}
