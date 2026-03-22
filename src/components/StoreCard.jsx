import { Link } from 'react-router-dom'

export default function StoreCard({ store }) {
  const avgRating = store.avg_rating || 0

  return (
    <Link
      to={`/tienda/${store.id}`}
      className="flex-shrink-0 w-40 bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col group transition-all hover:border-green-400 dark:hover:border-[#CCFF00]/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(204,255,0,0.05)] pb-3 relative"
    >
      <div className="aspect-square bg-gray-100 dark:bg-[#121212] overflow-hidden flex-shrink-0 relative border-b border-gray-200 dark:border-white/5 z-10 w-full">
        {store.imagen_tienda
          ? <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏪</div>
        }
      </div>

      <div className="p-3 flex flex-col flex-1 items-center text-center z-10 relative">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate w-full mb-1">
          {store.nombre_tienda || store.nombre}
        </p>
        
        {store.descripcion_tienda && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed w-full">
            {store.descripcion_tienda}
          </p>
        )}

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#121212] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5 mt-2 justify-center w-auto">
          <span className="text-yellow-500 dark:text-[#CCFF00] text-[9px]">★</span>
          <span className="text-[10px] text-gray-600 dark:text-gray-300">{avgRating > 0 ? avgRating.toFixed(1) : 'Nuevo'}</span>
        </div>
      </div>
    </Link>
  )
}
