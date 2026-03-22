import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function Stars({ rating }) {
  if (!rating || rating === 0) return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 font-inter">Nuevo</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1">
      <span className="text-food-500 text-[10px]">★</span>
      <span className="text-xs font-inter font-semibold text-gray-700">{Number(rating).toFixed(1)}</span>
    </div>
  )
}

export default function ProductCard({ product, horizontal = false }) {
  const { addToCart, perfilIncompleto } = useApp()
  const navigate = useNavigate()

  function handleAgregar(e) {
    e.preventDefault()
    if (perfilIncompleto) {
      navigate('/perfil')
      return
    }
    addToCart(product)
  }

  if (horizontal) {
    return (
      <div className="flex-shrink-0 w-40 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group hover:shadow-sm transition-shadow">
        <div className="h-28 bg-gray-50 overflow-hidden flex-shrink-0 relative">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍔</div>
          }
        </div>
        <div className="p-3 flex flex-col flex-1">
          <p className="text-sm font-inter font-bold text-gray-900 line-clamp-1">{product.name}</p>
          <div className="mt-1">
            <Stars rating={product.avg_rating} />
          </div>
          <div className="flex items-center justify-between mt-auto pt-3">
            <span className="text-gray-900 font-inter font-semibold">${Number(product.price).toFixed(2)}</span>
            <button onClick={handleAgregar}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-lg leading-none focus:outline-none 
                ${perfilIncompleto ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
            >
              {perfilIncompleto ? '🔒' : '+'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow">
      <div className="h-44 bg-gray-50 overflow-hidden flex-shrink-0 relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍔</div>
        }
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-inter font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</p>
          <span className="text-gray-900 font-inter font-semibold">${Number(product.price).toFixed(2)}</span>
        </div>
        {product.description && (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 font-inter leading-relaxed">{product.description}</p>
        )}
        <div className="mt-2.5">
          <Stars rating={product.avg_rating} />
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-4 relative">
          {!product.stock_ilimitado && product.stock <= 5 && product.stock > 0 ? (
            <p className="text-[10px] font-inter text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">Quedan {product.stock}</p>
          ) : <div />}
          <button onClick={handleAgregar}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors text-xl leading-none flex-shrink-0 z-10 
              ${perfilIncompleto ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:scale-105'}`}
          >
            {perfilIncompleto ? '🔒' : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}
