import { Link } from 'react-router-dom'

export default function StoreCard({ store }) {
  const avgRating = store.avg_rating || 0
  const totalSales = store.sales_count || 0

  return (
    <Link
      to={`/tienda/${store.id}`}
      className="flex-shrink-0 w-56 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
    >
      {/* Store image */}
      <div className="h-32 bg-gray-50 overflow-hidden relative">
        {store.imagen_tienda
          ? <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏪</div>
        }
      </div>

      <div className="p-3">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-inter font-bold text-gray-900 truncate">
            {store.nombre_tienda || store.nombre}
          </p>
          {avgRating > 0 && (
            <div className="flex bg-gray-100 px-1.5 py-0.5 rounded-full items-center gap-1 flex-shrink-0 mt-0.5">
              <span className="text-[10px] text-gray-800 font-inter font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-[9px] text-food-500">★</span>
            </div>
          )}
        </div>
        {store.descripcion_tienda && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5 font-inter">{store.descripcion_tienda}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-gray-400 font-inter bg-gray-50 px-2 py-0.5 rounded-full">Envío MX$25</span>
          <span className="text-[10px] text-gray-400 font-inter bg-gray-50 px-2 py-0.5 rounded-full">25-35 min</span>
        </div>
      </div>
    </Link>
  )
}
