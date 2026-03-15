import { useApp } from '../context/AppContext'

export default function ProductList({ products, loading }) {
  const { addToCart } = useApp()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-sm">No hay productos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(product => (
        <div
          key={product.id}
          className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
        >
          {/* Image */}
          <div className="h-48 overflow-hidden bg-gray-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-brand-50 group-hover:to-brand-100 transition-colors">
                🛍️
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-medium text-gray-800 text-sm truncate">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-brand-600 font-bold text-base">
                ${Number(product.price).toFixed(2)}
              </span>
              <button
                onClick={() => addToCart(product)}
                className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
