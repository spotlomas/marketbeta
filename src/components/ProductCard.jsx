import { useApp } from '../context/AppContext'

function Stars({ rating }) {
  if (!rating || rating === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-xs ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

export default function ProductCard({ product, horizontal = false }) {
  const { addToCart } = useApp()

  if (horizontal) {
    return (
      <div className="flex-shrink-0 w-40 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="h-28 bg-gray-100 overflow-hidden flex-shrink-0">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
          }
        </div>
        <div className="p-2.5 flex flex-col flex-1">
          <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
          <div className="h-4 mt-0.5">
            <Stars rating={product.avg_rating} />
          </div>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-brand-600 font-bold text-sm">${Number(product.price).toFixed(2)}</span>
            <button
              onClick={() => addToCart(product)}
              className="w-7 h-7 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center text-lg leading-none transition-colors flex-shrink-0"
            >+</button>
          </div>
        </div>
      </div>
    )
  }

  // Grid card — altura fija para que todos los botones queden al mismo nivel
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Image — altura fija */}
      <div className="h-40 bg-gray-100 overflow-hidden flex-shrink-0">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100">🛍️</div>
        }
      </div>

      {/* Content — flex-1 para que el botón siempre quede al fondo */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>

        {/* Stars — altura fija para que no desplace el botón */}
        <div className="h-5 mt-1 flex items-center">
          <Stars rating={product.avg_rating} />
        </div>

        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
        )}

        {!product.stock_ilimitado && product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-orange-500 mt-1">¡Solo {product.stock} disponibles!</p>
        )}

        {/* Price + button — siempre al fondo */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-brand-600 font-bold">${Number(product.price).toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
          >Agregar</button>
        </div>
      </div>
    </div>
  )
}
