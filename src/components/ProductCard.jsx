import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

function Stars({ rating }) {
  if (!rating || rating === 0) return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 dark:text-gray-500">Nuevo</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#121212] px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5">
      <span className="text-yellow-500 dark:text-[#CCFF00] text-[9px]">★</span>
      <span className="text-[10px] text-gray-600 dark:text-gray-300">{Number(rating).toFixed(1)}</span>
    </div>
  )
}

export default function ProductCard({ product, horizontal = false }) {
  const { addToCart, updateQuantity, cart, perfilIncompleto, setHideBottomNav, session } = useApp()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  function handleAgregar(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      alert("Por favor inicia sesión para agregar productos al carrito.")
      navigate('/login')
      return
    }
    if (perfilIncompleto) {
      alert("¡Hola! Para poder comprar, primero necesitamos que completes tu perfil (Número de control y Edad). Te llevaremos ahí ahora mismo.")
      navigate('/perfil')
      return
    }
    setShowModal(true)
  }

  const btn3D = "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all text-xl leading-none focus:outline-none active:translate-y-0.5 active:shadow-none border border-transparent"

  if (horizontal) {
    return (
      <>
        <div 
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 w-40 bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col group transition-all hover:border-green-400 dark:hover:border-[#CCFF00]/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(204,255,0,0.05)] pb-3 relative cursor-pointer"
        >
          <div className="aspect-square bg-gray-100 dark:bg-[#121212] overflow-hidden flex-shrink-0 relative border-b border-gray-200 dark:border-white/5 z-10">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍔</div>
            }
          </div>
          <div className="p-3 flex flex-col flex-1 items-center text-center z-10">
            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 w-full mb-1">{product.name}</p>
            <div className="mt-1 mb-2">
              <Stars rating={product.avg_rating} />
            </div>
            <div className="flex items-center justify-between w-full mt-auto">
              <span className="text-green-600 dark:text-[#CCFF00] font-bold text-sm">${Number(product.price).toFixed(2)}</span>
              <button onClick={handleAgregar}
                className={`${btn3D} ${perfilIncompleto ? 'bg-gray-200 dark:bg-[#121212] border-gray-300 dark:border-white/10 text-gray-400 shadow-none' : 'bg-green-100 dark:bg-[#CCFF00]/10 text-green-600 dark:text-[#CCFF00] hover:bg-green-200 dark:hover:bg-[#CCFF00]/20 border border-green-300 dark:border-[#CCFF00]/30'}`}
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
      <div 
        onClick={() => setShowModal(true)}
        className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col h-full group transition-all hover:border-green-400 dark:hover:border-[#CCFF00]/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(204,255,0,0.05)] pb-4 relative cursor-pointer"
      >
        <div className="aspect-square bg-gray-100 dark:bg-[#121212] overflow-hidden flex-shrink-0 relative border-b border-gray-200 dark:border-white/5 z-10">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍔</div>
          }
        </div>
        <div className="p-4 flex flex-col flex-1 items-center text-center relative z-10">
          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight w-full mb-1">{product.name}</p>
          {product.description && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed w-full">{product.description}</p>
          )}
          <div className="mt-3 mb-4">
            <Stars rating={product.avg_rating} />
          </div>
          
          <div className="flex items-center justify-between w-full mt-auto relative pt-2">
            <div className="flex flex-col items-start leading-none gap-1">
              <span className="text-green-600 dark:text-[#CCFF00] font-bold text-sm">${Number(product.price).toFixed(2)}</span>
              {!product.stock_ilimitado && product.stock <= 5 && product.stock > 0 && (
                <span className="text-[9px] text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-1.5 py-0.5 rounded">Quedan {product.stock}</span>
              )}
            </div>
            <button onClick={handleAgregar}
              className={`${btn3D} ${perfilIncompleto ? 'bg-gray-200 dark:bg-[#121212] text-gray-400 border-gray-300 dark:border-white/10 shadow-none' : 'bg-green-600 dark:bg-[#CCFF00] text-white dark:text-black hover:bg-green-700 dark:hover:bg-white border-transparent shadow-md'}`}
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
  const { addToCart, cart, updateQuantity, setHideBottomNav } = useApp()
  const [related, setRelated] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(true)

  const cartItem = cart.find(i => i?.product?.id === product?.id)
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

    // Global state control for the bottom nav
    setHideBottomNav(true);
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    return () => {
      setHideBottomNav(false);
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
  }, [product.id, product.seller_id, setHideBottomNav])

  function handleAdd() {
    if (quantity === 0) {
      addToCart(product)
    } else {
      updateQuantity(product?.id, quantity + 1)
    }
  }

  function handleRemove() {
    if (quantity > 0) {
      updateQuantity(product?.id, quantity - 1)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center" onClick={onClose}>
      
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-[#1a1a1a] w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Fixed Header Image */}
        <div className="relative flex-none h-56 sm:h-64 bg-gray-100 dark:bg-[#121212]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">🍔</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-[#050505] to-transparent pointer-events-none"></div>
          <div className="absolute top-4 left-4 z-50 bg-black/40 backdrop-blur-md text-[8px] text-white px-2 py-1 rounded-full font-black uppercase tracking-tighter border border-white/10">v0.2.3 Live</div>
          <button onClick={onClose} className="absolute top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-md active:scale-95 transition-transform">
            ✕
          </button>
        </div>

        {/* Scrollable Internal Content */}
        <div className="flex-1 overflow-y-auto w-full px-6 py-6 pb-32">
          
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight uppercase">{product.name}</h2>
              <div className="mt-2 inline-flex items-center bg-green-50 dark:bg-[#CCFF00]/10 border border-green-200 dark:border-[#CCFF00]/20 px-3 py-1 rounded-full text-green-600 dark:text-[#CCFF00] font-bold text-sm tracking-wide">
                ${Number(product.price).toFixed(2)}
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">{product.description}</p>

          <div className="flex items-center justify-between gap-6 p-2 bg-gray-50 dark:bg-white/5 rounded-full mb-8 border border-gray-100 dark:border-white/5">
            <button onClick={handleRemove} disabled={quantity === 0}
              className="w-14 h-14 rounded-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-center text-3xl shadow-sm hover:border-gray-400 dark:hover:border-white/30 disabled:opacity-30 active:scale-95 transition-all">
              −
            </button>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-green-600 dark:text-[#CCFF00]">{quantity}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Cantidad</span>
            </div>
            <button onClick={handleAdd}
              className="w-14 h-14 rounded-full bg-green-600 dark:bg-[#CCFF00] text-white dark:text-black flex items-center justify-center text-3xl shadow-xl active:scale-95 hover:brightness-110 transition-all">
              +
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5 pt-8 mb-4">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] mb-6">Más de este vendedor</h3>
            
            {loadingRelated ? (
              <div className="flex flex-row gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[1, 2].map(i => (
                  <div key={i} className="w-32 h-44 bg-gray-100 dark:bg-white/5 rounded-[2rem] flex-shrink-0 animate-pulse"></div>
                ))}
              </div>
            ) : related.length > 0 ? (
              <div className="flex flex-row gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-6 sm:-mx-8 px-6 sm:px-8 snap-x">
                {related.map(rel => (
                  <div key={rel.id} className="snap-center flex-shrink-0">
                    <div className="w-32 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col group pb-4 active:scale-95 transition-transform cursor-pointer">
                      <div className="aspect-square bg-gray-200 dark:bg-[#121212] relative">
                         {rel.image_url ? <img src={rel.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-2xl">🍔</div>}
                      </div>
                      <div className="px-3 pt-4 text-center">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate uppercase tracking-tight">{rel.name}</p>
                        <p className="text-[11px] text-green-600 dark:text-[#CCFF00] font-black mt-1">${Number(rel.price).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 pb-4">No hay más productos disponibles.</p>
            )}
          </div>
        </div>

        {/* Fixed Sticky Action Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/10 z-50 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center safe-bottom flex items-center justify-center">
          <button onClick={() => { quantity === 0 ? handleAdd() : onClose() }}
            className="w-full max-w-sm bg-green-600 dark:bg-[#CCFF00] hover:brightness-110 text-white dark:text-black font-black text-sm py-4 rounded-[2rem] shadow-lg active:scale-[0.98] transition-all flex items-center justify-between px-8 group">
            <span className="uppercase tracking-widest text-base">
              {quantity === 0 ? 'Agregar' : 'Listo'}
            </span>
            <div className="flex items-center gap-3">
              {quantity > 0 && (
                <span className="text-xs opacity-60 font-bold uppercase tracking-widest">{quantity} Producto(s)</span>
              )}
              <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
