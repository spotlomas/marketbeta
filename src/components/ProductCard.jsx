import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

function Stars({ rating }) {
  if (!rating || rating === 0) return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">NEW_RELEASE</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded-md border border-white/5">
      <span className="text-[#CCFF00] text-[9px]">★</span>
      <span className="text-[10px] font-mono text-gray-300">{Number(rating).toFixed(1)}</span>
    </div>
  )
}

export default function ProductCard({ product, horizontal = false }) {
  const { addToCart, updateQuantity, cart, perfilIncompleto } = useApp()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  function handleAgregar(e) {
    e.preventDefault()
    e.stopPropagation()
    if (perfilIncompleto) {
      navigate('/perfil')
      return
    }
    setShowModal(true)
  }

  const btn3D = "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all text-xl leading-none focus:outline-none shadow-[0_0_15px_rgba(204,255,0,0.15)] active:translate-y-0.5 active:shadow-none border border-transparent hover:border-[#CCFF00]/50"

  if (horizontal) {
    return (
      <>
        <div className="flex-shrink-0 w-40 bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col group transition-all hover:border-[#CCFF00]/30 hover:shadow-[0_0_20px_rgba(204,255,0,0.05)] pb-3 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div className="aspect-square bg-[#121212] overflow-hidden flex-shrink-0 relative border-b border-white/5 z-10">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
              : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍔</div>
            }
          </div>
          <div className="p-3 flex flex-col flex-1 items-center text-center z-10">
            <p className="text-[11px] font-mono tracking-widest uppercase text-white line-clamp-1 w-full mb-1">{product.name}</p>
            <div className="mt-1 mb-2">
              <Stars rating={product.avg_rating} />
            </div>
            <div className="flex items-center justify-between w-full mt-auto">
              <span className="text-[#CCFF00] font-mono text-xs tracking-widest">${Number(product.price).toFixed(2)}</span>
              <button onClick={handleAgregar}
                className={`${btn3D} ${perfilIncompleto ? 'bg-[#121212] border-white/10 text-gray-600 shadow-none' : 'bg-[#CCFF00]/10 text-[#CCFF00] hover:bg-[#CCFF00]/20 border border-[#CCFF00]/30'}`}
              >
                {perfilIncompleto ? '🔒' : '+'}
              </button>
            </div>
          </div>
        </div>
        {showModal && <ProductModal product={product} onClose={() => setShowModal(false)} />}
      </>
    )
  }

  return (
    <>
      <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden flex flex-col h-full group transition-all hover:border-[#CCFF00]/30 hover:shadow-[0_0_20px_rgba(204,255,0,0.05)] pb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

        <div className="aspect-square bg-[#121212] overflow-hidden flex-shrink-0 relative border-b border-white/5 z-10">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
            : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍔</div>
          }
        </div>
        <div className="p-4 flex flex-col flex-1 items-center text-center relative z-10">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-white line-clamp-2 leading-tight w-full mb-1">{product.name}</p>
          {product.description && (
            <p className="text-[9px] font-mono tracking-widest text-gray-500 mt-1 line-clamp-2 leading-relaxed w-full uppercase">{product.description}</p>
          )}
          <div className="mt-3 mb-4">
            <Stars rating={product.avg_rating} />
          </div>
          
          <div className="flex items-center justify-between w-full mt-auto relative pt-2">
            <div className="flex flex-col items-start leading-none gap-1">
              <span className="text-[#CCFF00] font-mono text-sm tracking-widest">${Number(product.price).toFixed(2)}</span>
              {!product.stock_ilimitado && product.stock <= 5 && product.stock > 0 && (
                <span className="text-[8px] font-mono tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">LEFT_IN_STOCK: {product.stock}</span>
              )}
            </div>
            <button onClick={handleAgregar}
              className={`${btn3D} ${perfilIncompleto ? 'bg-[#121212] text-gray-600 border-white/10 shadow-none' : 'bg-[#CCFF00] text-black hover:bg-white border-transparent'}`}
            >
              {perfilIncompleto ? '🔒' : '+'}
            </button>
          </div>
        </div>
      </div>
      {showModal && <ProductModal product={product} onClose={() => setShowModal(false)} />}
    </>
  )
}

function ProductModal({ product, onClose }) {
  const { addToCart, cart, updateQuantity } = useApp()
  const [related, setRelated] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(true)

  const cartItem = cart.find(i => i.product.id === product.id)
  const quantity = cartItem ? cartItem.quantity : 0

  useEffect(() => {
    async function fetchRelated() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', product.seller_id)
        .neq('id', product.id)
        .limit(4)
      
      if (data) setRelated(data)
      setLoadingRelated(false)
    }
    fetchRelated()
  }, [product.id, product.seller_id])

  function handleAdd() {
    if (quantity === 0) {
      addToCart(product)
    } else {
      updateQuantity(product.id, quantity + 1)
    }
  }

  function handleRemove() {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#050505] border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(204,255,0,0.05)]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <div className="w-full h-56 bg-[#121212] relative border-b border-white/10">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-80" />
              : <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">🍔</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
          </div>
          <button onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-mono text-xs shadow-sm active:scale-95 transition-all hover:bg-white/10">
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h2 className="text-sm font-mono tracking-widest text-[#CCFF00] uppercase leading-tight">{product.name}</h2>
            <span className="text-sm font-bold font-mono text-white tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/10">${Number(product.price).toFixed(2)}</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-6 leading-relaxed">{product.description}</p>

          <div className="flex items-center justify-center gap-8 py-6 border-y border-white/5 my-2">
            <button onClick={handleRemove} disabled={quantity === 0}
              className="w-14 h-14 rounded-full bg-[#121212] border border-white/10 text-white flex items-center justify-center text-3xl font-mono active:translate-y-1 hover:border-white/30 disabled:opacity-40 disabled:active:translate-y-0 disabled:border-white/10 transition-all">
              −
            </button>
            <span className="text-2xl font-bold font-mono text-[#CCFF00] w-8 text-center">{quantity}</span>
            <button onClick={handleAdd}
              className="w-14 h-14 rounded-full bg-[#CCFF00] text-black flex items-center justify-center text-3xl font-mono shadow-[0_0_20px_rgba(204,255,0,0.3)] active:translate-y-1 hover:bg-white transition-all">
              +
            </button>
          </div>

          <h3 className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-4 mt-6">RELATED_ITEMS</h3>
          
          {loadingRelated ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
              {[1, 2].map(i => (
                <div key={i} className="w-32 h-40 bg-[#121212] border border-white/5 rounded-3xl flex-shrink-0 animate-pulse"></div>
              ))}
            </div>
          ) : related.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6 snap-x">
              {related.map(rel => (
                <div key={rel.id} className="snap-center pointer-events-none flex-shrink-0">
                  <div className="w-28 bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden flex flex-col group pb-2">
                    <div className="aspect-square bg-[#121212] relative border-b border-white/5">
                       {rel.image_url ? <img src={rel.image_url} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-xl">🍔</div>}
                    </div>
                    <div className="px-2 pt-3 text-center">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-[#CCFF00] truncate">{rel.name}</p>
                      <p className="text-[9px] font-mono tracking-widest text-white mt-1">${Number(rel.price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-600 pb-6">NO_FURTHER_ITEMS.</p>
          )}
        </div>

        {quantity > 0 && (
          <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
            <button onClick={onClose}
              className="w-full bg-[#CCFF00] text-black font-mono font-bold tracking-widest text-[11px] uppercase py-4 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.2)] active:translate-y-1 transition-all flex items-center justify-between px-6">
              <span>{`CONFIRM_QTY: ${quantity}`}</span>
              <span>CONTINUE {'->'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

