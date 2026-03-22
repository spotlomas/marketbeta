import { Link } from 'react-router-dom'

export default function StoreCard({ store }) {
  const avgRating = store.avg_rating || 0
  const totalSales = store.sales_count || 0

  return (
    <Link
      to={`/tienda/${store.id}`}
      className="flex-shrink-0 w-40 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col group transition-all hover:border-[#CCFF00]/30 hover:shadow-[0_0_20px_rgba(204,255,0,0.05)] pb-3 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
      
      <div className="aspect-square bg-[#121212] overflow-hidden flex-shrink-0 relative border-b border-white/5 z-10 w-full">
        {store.imagen_tienda
          ? <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏪</div>
        }
      </div>

      <div className="p-4 flex flex-col flex-1 items-center text-center z-10 relative">
        <p className="text-sm font-mono font-bold tracking-widest uppercase text-white truncate w-full mb-1">
          {store.nombre_tienda || store.nombre}
        </p>
        
        {store.descripcion_tienda && (
          <p className="text-[9px] font-mono tracking-widest text-gray-500 mt-1 line-clamp-2 leading-relaxed w-full uppercase">
            {store.descripcion_tienda}
          </p>
        )}

        <div className="flex items-center gap-1 bg-[#121212] px-3 py-1 rounded-md border border-white/5 mt-3 justify-center w-auto">
          <span className="text-[#CCFF00] text-[9px]">★</span>
          <span className="text-[10px] text-gray-300 font-mono tracking-widest">{avgRating > 0 ? avgRating.toFixed(1) : 'NEW'}</span>
        </div>
      </div>
    </Link>
  )
}
