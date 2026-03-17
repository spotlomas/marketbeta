import { Link } from 'react-router-dom'

export default function StoreCard({ store }) {
  const avgRating = store.avg_rating || 0
  const totalSales = store.sales_count || 0

  return (
    <Link
      to={`/tienda/${store.id}`}
      className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Store image */}
      <div className="h-24 bg-gradient-to-br from-brand-50 to-brand-100 overflow-hidden">
        {store.imagen_tienda
          ? <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🏪</div>
        }
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {store.nombre_tienda || store.nombre}
        </p>
        {store.descripcion_tienda && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{store.descripcion_tienda}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {avgRating > 0 && (
            <span className="text-xs text-yellow-500 font-medium">⭐ {avgRating.toFixed(1)}</span>
          )}
          {totalSales > 0 && (
            <span className="text-xs text-gray-400">{totalSales} ventas</span>
          )}
        </div>
      </div>
    </Link>
  )
}
