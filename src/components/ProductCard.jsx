import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function Stars({ rating }) {
  if (!rating || rating === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-[10px] ${s <= Math.round(rating) ? 'text-brand-500' : 'text-gray-800'}`}>★</span>
      ))}
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
      <div className="flex-shrink-0 w-40 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col group hover:border-brand-500/50 transition-colors">
        <div className="h-28 bg-[#151515] overflow-hidden flex-shrink-0 relative">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" />
            : <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">🛍️</div>
          }
        </div>
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs font-mono uppercase tracking-tight text-white truncate">{product.name}</p>
          <div className="h-4 mt-1">
            <Stars rating={product.avg_rating} />
          </div>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-brand-500 font-mono text-sm tracking-wider">${Number(product.price).toFixed(2)}</span>
            <button onClick={handleAgregar}
              className="w-8 h-8 rounded-full border border-white/20 hover:border-brand-500 hover:bg-brand-500 text-white hover:text-black flex items-center justify-center text-lg leading-none transition-all flex-shrink-0 focus:outline-none"
            >
              {perfilIncompleto ? '🔒' : '+'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full group hover:border-brand-500/50 transition-colors">
      <div className="h-40 bg-[#151515] overflow-hidden flex-shrink-0 relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity grayscale-[0.5] group-hover:grayscale-0" />
          : <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-[#111] to-[#050505] opacity-50">🛍️</div>
        }
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm font-mono tracking-tight text-white line-clamp-2 leading-tight uppercase">{product.name}</p>
        <div className="h-5 mt-2 flex items-center">
          <Stars rating={product.avg_rating} />
        </div>
        {product.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        {!product.stock_ilimitado && product.stock <= 5 && product.stock > 0 && (
          <p className="text-[10px] font-mono uppercase text-red-500 mt-2 tracking-widest border border-red-500/20 bg-red-500/10 inline-block px-2 py-0.5 rounded-full w-fit">Solo {product.stock} left</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-4 gap-2">
          <span className="text-brand-500 font-mono tracking-wider">${Number(product.price).toFixed(2)}</span>
          <button onClick={handleAgregar}
            className={`text-xs px-4 py-2 font-mono uppercase tracking-widest rounded-full transition-all flex-shrink-0 border 
              ${perfilIncompleto
                ? 'border-gray-800 text-gray-500 hover:text-white'
                : 'border-white/20 text-white hover:bg-brand-500 hover:border-brand-500 hover:text-black'
              }`}
          >
            {perfilIncompleto ? 'LOCK' : 'ADD'}
          </button>
        </div>
      </div>
    </div>
  )
}
