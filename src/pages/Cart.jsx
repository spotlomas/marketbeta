import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import TopNav from '../components/TopNav'
import BottomNav from '../components/BottomNav'
import StripeCheckout from '../components/StripeCheckout'

const COMMISSION = 0.06

export default function Cart() {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart, session } = useApp()
  const [showCheckout, setShowCheckout] = useState(false)
  const [success, setSuccess]           = useState(false)
  const [orders, setOrders]             = useState([])

  async function handlePaymentSuccess() {
    const newOrders = []

    for (const item of cart) {
      const qrData = JSON.stringify({
        buyer_id:   session.user.id,
        product_id: item.product.id,
        amount:     item.product.price * item.quantity,
        quantity:   item.quantity,
        ts:         Date.now(),
      })

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          buyer_id:   session.user.id,
          seller_id:  item.product.seller_id,
          product_id: item.product.id,
          amount:     item.product.price * item.quantity,
          quantity:   item.quantity,
          status:     'pendiente_entrega',
          qr_code:    qrData,
        })
        .select('*, products(name, price, image_url)')
        .single()

      if (!error && order) {
        newOrders.push(order)

        // Actualizar wallet del vendedor
        const netAmount = item.product.price * item.quantity * (1 - COMMISSION)
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', item.product.seller_id)
          .single()

        if (wallet) {
          await supabase.from('wallets')
            .update({ balance: wallet.balance + netAmount, updated_at: new Date() })
            .eq('user_id', item.product.seller_id)
        } else {
          await supabase.from('wallets')
            .insert({ user_id: item.product.seller_id, balance: netAmount })
        }

        await supabase.from('transactions').insert({
          seller_id:    item.product.seller_id,
          order_id:     order.id,
          gross_amount: item.product.price * item.quantity,
          commission:   item.product.price * item.quantity * COMMISSION,
          net_amount:   netAmount,
          status:       'completado',
        })
      }
    }

    setOrders(newOrders)
    await clearCart()
    setShowCheckout(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-inter transition-colors">
        <TopNav />
        <div className="max-w-lg mx-auto px-4 py-16 pb-28">
          <div className="text-center mb-10">
            <div className="text-6xl mb-6 animate-bounce opacity-80">✅</div>
            <h2 className="text-xl font-mono tracking-widest uppercase text-[#CCFF00] mb-3">TRANSACTION_SUCCESS</h2>
            <p className="text-[10px] font-mono tracking-widest uppercase text-gray-400">Present the following QR codes to the merchants for local fulfillment.</p>
          </div>

          <div className="space-y-6">
            {orders.map(order => (
              <OrderQRCard key={order.id} order={order} />
            ))}
          </div>

          <div className="flex flex-col gap-4 mt-12">
            <Link to="/mis-compras" className="w-full text-center bg-[#CCFF00] hover:bg-[#b3ff00] text-black px-4 py-4 rounded-full font-mono font-bold tracking-widest text-xs uppercase transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              ACCESS_ORDER_HISTORY
            </Link>
            <Link to="/" className="w-full text-center bg-[#121212] hover:bg-[#1a1a1a] text-white border border-white/10 hover:border-white/30 px-4 py-4 rounded-full font-mono font-bold tracking-widest text-xs uppercase transition-all">
              CONTINUE_BROWSING
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-inter transition-colors relative">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#CCFF00]/5 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10">
        <TopNav />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 relative z-10">
        <h1 className="text-sm font-mono tracking-widest uppercase text-white mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#CCFF00] rounded-full animate-pulse"></span>
          ACTIVE_CART_SESSION
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-24 bg-[#0A0A0A] rounded-3xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <p className="text-5xl mb-6 opacity-20">🛒</p>
            <p className="font-mono text-[11px] tracking-widest uppercase text-gray-500 mb-8">BASKET_IS_EMPTY</p>
            <Link to="/" className="bg-[#121212] text-white hover:bg-white/5 border border-white/10 hover:border-[#CCFF00]/50 transition-all rounded-full px-8 py-4 font-mono font-bold tracking-widest text-[10px] inline-block uppercase shadow-sm">
              INITIATE_BROWSING
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="bg-[#0A0A0A] rounded-3xl border border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all hover:border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="w-full sm:w-28 h-32 sm:h-28 rounded-2xl overflow-hidden bg-[#121212] flex-shrink-0 relative border border-white/5">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 w-full py-1">
                    <p className="font-bold text-white text-lg truncate tracking-tight">{product.name}</p>
                    <p className="text-[#CCFF00] font-mono text-[11px] font-bold tracking-widest mt-1">${Number(product.price).toFixed(2)} UNIT</p>
                    {product.stock > 0 && !product.stock_ilimitado && (
                      <p className="text-[9px] font-mono tracking-widest text-orange-400 bg-orange-950/30 border border-orange-900/50 w-fit px-2 py-1 rounded-full mt-3 uppercase">STOCK: {product.stock}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-4">
                    <div className="flex items-center gap-3 bg-[#121212] rounded-full p-1 border border-white/5">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#050505] text-white hover:text-[#CCFF00] border border-white/10 hover:border-[#CCFF00]/50 text-lg font-medium transition-colors">−</button>
                      <span className="font-mono font-bold text-xs w-5 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#050505] text-white hover:text-[#CCFF00] border border-white/10 hover:border-[#CCFF00]/50 text-lg font-medium transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(product.id)}
                      className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-red-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0A0A0A] rounded-3xl border border-white/5 p-6 h-fit md:sticky top-24 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <h2 className="font-mono text-xs text-[#CCFF00] uppercase tracking-widest mb-6 border-b border-white/10 pb-4">TX_SUMMARY</h2>
              <div className="space-y-4 text-[11px] font-mono tracking-widest text-gray-400 uppercase">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between items-start gap-4">
                    <span className="flex-1 leading-relaxed truncate">{product.name} <span className="opacity-50">x{quantity}</span></span>
                    <span className="flex-shrink-0 text-white font-bold">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 mt-6 pt-5 text-[10px] font-mono text-gray-500 uppercase tracking-widest flex justify-between">
                <span>SYSTEM_FEE (6%)</span>
                <span>${(cartTotal * COMMISSION).toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 mt-5 pt-5 flex justify-between items-end">
                <span className="text-xs font-mono tracking-widest text-gray-400 uppercase mb-1">FINAL_TOTAL</span>
                <span className="text-2xl font-bold text-white tracking-tight">${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setShowCheckout(true)}
                className="w-full mt-8 bg-[#CCFF00] hover:bg-[#b3ff00] text-black font-mono font-bold py-4 rounded-full text-[11px] tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-[0.98]">
                PROCEED_TO_CHECKOUT
              </button>
              <button onClick={clearCart}
                className="w-full mt-4 text-[9px] font-mono font-bold text-red-500/50 hover:text-red-500 transition-colors py-3 uppercase tracking-widest">
                FLUSH_BASKET_DATA
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="relative z-20">
        <BottomNav />
      </div>

      {showCheckout && (
        <StripeCheckout
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}

function OrderQRCard({ order }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(order.id)}&color=CCFF00&bgcolor=050505&margin=4`

  return (
    <div className="bg-[#0A0A0A] rounded-[2rem] border border-white/10 p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden relative group">
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-14 h-14 bg-[#121212] rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
          {order.products?.image_url
            ? <img src={order.products.image_url} alt={order.products.name} className="w-full h-full object-cover" />
            : <span className="text-2xl opacity-20">📦</span>
          }
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-base leading-tight line-clamp-2">{order.products?.name}</p>
          <p className="text-[#CCFF00] font-mono tracking-widest text-[10px] uppercase font-bold mt-2">AMT: ${(Number(order.amount)).toFixed(2)}</p>
        </div>
        <div className="flex-shrink-0">
           <span className="inline-block text-[9px] font-mono font-bold bg-orange-950/30 text-orange-400 border border-orange-900/50 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">PENDING</span>
        </div>
      </div>

      <div className="flex flex-col items-center bg-[#121212] rounded-3xl p-8 border border-white/5 relative z-10">
        <div className="bg-[#050505] p-4 rounded-[2rem] border-2 border-white/5 shadow-[0_0_30px_rgba(204,255,0,0.1)] group-hover:border-[#CCFF00]/20 transition-colors">
           <img src={qrUrl} alt="QR_CODE" className="w-48 h-48 rounded-xl opacity-90" />
        </div>
        <p className="font-mono text-[#CCFF00] uppercase tracking-widest text-[10px] mt-8 opacity-80">AUTHORIZATION_ID</p>
        <p className="text-xl text-white font-mono mt-2 font-bold tracking-widest">{order.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  )
}
