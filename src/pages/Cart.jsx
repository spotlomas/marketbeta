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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
            <p className="text-gray-500 text-sm">Muestra el código QR al vendedor para confirmar tu entrega.</p>
          </div>

          <div className="space-y-4">
            {orders.map(order => (
              <OrderQRCard key={order.id} order={order} />
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <Link to="/mis-compras" className="flex-1 text-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Ver mis compras
            </Link>
            <Link to="/" className="flex-1 text-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tu carrito</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-sm mb-6">Tu carrito está vacío</p>
            <Link to="/" className="text-brand-600 hover:underline text-sm font-medium">Ver productos</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                    <p className="text-brand-600 font-bold text-sm mt-0.5">${Number(product.price).toFixed(2)}</p>
                    {product.stock > 0 && !product.stock_ilimitado && (
                      <p className="text-xs text-gray-400 mt-0.5">Stock: {product.stock}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">−</button>
                    <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">+</button>
                  </div>
                  <button onClick={() => removeFromCart(product.id)}
                    className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
              <h2 className="font-semibold text-gray-800 mb-4">Resumen</h2>
              <div className="space-y-2 text-sm text-gray-600">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between">
                    <span className="truncate mr-2">{product.name} ×{quantity}</span>
                    <span className="flex-shrink-0">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 text-xs text-gray-400 flex justify-between">
                <span>Comisión (6%)</span>
                <span>${(cartTotal * COMMISSION).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setShowCheckout(true)}
                className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                💳 Pagar con Stripe
              </button>
              <button onClick={clearCart}
                className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Vaciar carrito
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

// ── QR Card component ─────────────────────────────────────
function OrderQRCard({ order }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.id)}`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        {order.products?.image_url
          ? <img src={order.products.image_url} alt={order.products.name} className="w-12 h-12 object-cover rounded-lg" />
          : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">🛍️</div>
        }
        <div>
          <p className="font-medium text-gray-800 text-sm">{order.products?.name}</p>
          <p className="text-brand-600 font-bold text-sm">${Number(order.amount).toFixed(2)}</p>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Pendiente entrega</span>
        </div>
      </div>
      <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
        <img src={qrUrl} alt="QR de orden" className="w-40 h-40 rounded-lg" />
        <p className="text-xs text-gray-400 mt-2 text-center">Muestra este QR al vendedor</p>
        <p className="text-xs text-gray-300 mt-1 font-mono">{order.id.slice(0, 8)}...</p>
      </div>
    </div>
  )
}
