import ProductCard from './ProductCard'

export default function ProductList({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-white/5 animate-pulse">
            <div className="bg-gray-200 dark:bg-[#121212] h-40 rounded-t-2xl" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-[#121212] rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-[#121212] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">📦</p>
        <p className="text-sm">No hay productos disponibles.</p>
      </div>
    )
  }

  return (
    // items-stretch hace que todos los cards tengan la misma altura en cada fila
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
