import { Link } from 'react-router-dom'

export default function StoreCard({ store }) {
  const avgRating = store.avg_rating || 0
  const totalSales = store.sales_count || 0

  return (
    <Link
      to={`/tienda/${store.id}`}
      className="flex-shrink-0 w-44 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden hover:border-brand-500/50 transition-colors group"
    >
      {/* Store image */}
      <div className="h-24 bg-[#151515] overflow-hidden relative border-b border-white/5">
        {store.imagen_tienda
          ? <img src={store.imagen_tienda} alt={store.nombre_tienda} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🏪</div>
        }
      </div>

      <div className="p-4">
        <p className="text-xs font-mono tracking-widest text-white truncate uppercase">
          {store.nombre_tienda || store.nombre}
        </p>
        {store.descripcion_tienda && (
          <p className="text-[10px] text-gray-500 truncate mt-1">{store.descripcion_tienda}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          {avgRating > 0 && (
            <span className="text-[9px] font-mono tracking-widest bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded-full border border-brand-500/20">
              ★ {avgRating.toFixed(1)}
            </span>
          )}
          {totalSales > 0 && (
            <span className="text-[9px] font-mono tracking-widest text-gray-600 uppercase pt-0.5">{totalSales} SALES</span>
          )}
        </div>
      </div>
    </Link>
  )
}
