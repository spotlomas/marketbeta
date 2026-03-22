import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
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
      <div className="min-h-screen bg-[#050505] text-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 pb-28">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-dot tracking-widest text-brand-500 mb-2">TRANSACTION_OK</h2>
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">SHOW QR CODE TO VENDOR FOR VERIFICATION</p>
          </div>

          <div className="space-y-6">
            {orders.map(order => (
              <OrderQRCard key={order.id} order={order} />
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-10">
            <Link to="/mis-compras" className="w-full text-center bg-brand-500 hover:bg-brand-400 text-black px-4 py-4 rounded-full font-mono text-[10px] uppercase font-bold tracking-widest transition-colors">
              VIEW LEDGER
            </Link>
            <Link to="/" className="w-full text-center border border-white/20 hover:border-white/50 text-white px-4 py-4 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors">
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <h1 className="text-2xl font-dot tracking-widest text-brand-500 mb-8 border-b border-white/10 pb-4">CART.MODULE</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-6 opacity-30 grayscale">🛒</p>
            <p className="font-mono text-sm mb-8 text-gray-500 uppercase tracking-widest">No components loaded</p>
            <Link to="/" className="border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-black transition-colors rounded-full px-6 py-3 font-mono text-[10px] uppercase tracking-widest">
              DEPLOY LISTING
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-brand-500/30">
                  <div className="w-full sm:w-20 h-32 sm:h-20 rounded-2xl overflow-hidden bg-[#151515] flex-shrink-0 border border-white/5 relative">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover grayscale opacity-90" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🛍️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className="font-mono text-xs uppercase tracking-widest text-white truncate">{product.name}</p>
                    <p className="text-brand-500 font-mono tracking-widest text-sm mt-1">${Number(product.price).toFixed(2)}</p>
                    {product.stock > 0 && !product.stock_ilimitado && (
                      <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mt-2">STOCK_LEVEL: {product.stock}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-4">
                    <div className="flex items-center gap-1 bg-[#151515] rounded-full border border-white/10 p-1">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/10 text-lg transition-colors">−</button>
                      <span className="font-mono text-sm w-6 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/10 text-lg transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(product.id)}
                      className="text-red-500 hover:text-red-400 font-mono text-[10px] tracking-widest px-3 py-2 uppercase border border-red-500/20 rounded-full hover:bg-red-500/10 transition-colors">
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 h-fit md:sticky top-20">
              <h2 className="font-dot text-lg tracking-widest text-gray-300 mb-6 uppercase">TRANSACTION_SUMMARY</h2>
              <div className="space-y-4 font-mono text-xs text-gray-500 tracking-wider">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between items-end gap-4">
                    <span className="truncate flex-1">{product.name}</span>
                    <span className="text-gray-400">x{quantity}</span>
                    <span className="flex-shrink-0 text-white">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 mt-6 pt-4 font-mono text-[10px] uppercase tracking-widest text-gray-500 flex justify-between">
                <span>COMMISSION (6%)</span>
                <span className="text-gray-400">${(cartTotal * COMMISSION).toFixed(2)}</span>
              </div>
              <div className="border-t border-brand-500/30 mt-4 pt-4 flex justify-between font-dot text-xl text-brand-500 tracking-widest">
                <span>TOTAL</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setShowCheckout(true)}
                className="w-full mt-8 bg-brand-500 hover:bg-brand-400 text-black font-mono font-bold py-4 rounded-full text-[11px] uppercase tracking-widest transition-colors focus:ring-4 ring-brand-500/20">
                PROCEED_TO_CHECKOUT
              </button>
              <button onClick={clearCart}
                className="w-full mt-4 text-[10px] font-mono tracking-widest uppercase text-gray-600 hover:text-red-500 transition-colors py-2">
                PURGE_SESSION
              </button>
            </div>
          </div>
        )}
      </main>

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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.id)}&color=000000&bgcolor=CCFF00&margin=4`

  return (
    <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500 blur-3xl opacity-20 pointer-events-none"></div>

      <div className="flex items-center gap-4 mb-6 relative">
        <div className="w-14 h-14 bg-[#151515] rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
          {order.products?.image_url
            ? <img src={order.products.image_url} alt={order.products.name} className="w-full h-full object-cover grayscale" />
            : <span className="text-2xl opacity-30">🛍️</span>
          }
        </div>
        <div className="flex-1">
          <p className="font-mono text-xs text-white uppercase tracking-widest truncate">{order.products?.name}</p>
          <p className="text-brand-500 font-mono tracking-widest text-sm mt-1">${Number(order.amount).toFixed(2)}</p>
        </div>
        <div className="flex-shrink-0 text-right">
           <span className="inline-block text-[9px] font-mono tracking-widest uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-full">PENDING</span>
        </div>
      </div>

      <div className="flex flex-col items-center bg-[#CCFF00] rounded-2xl p-6 relative">
        <div className="bg-white p-2 rounded-xl shadow-lg">
           <img src={qrUrl} alt="QR_CODE" className="w-40 h-40 mix-blend-multiply" />
        </div>
        <p className="font-mono text-[9px] font-bold text-black uppercase tracking-widest mt-4">AUTHORIZATION MATRIX</p>
        <p className="text-[10px] text-black/60 font-mono mt-1">{order.id.slice(0, 12)}</p>
      </div>
    </div>
  )
}
