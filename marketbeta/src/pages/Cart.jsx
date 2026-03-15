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

  const commission = cartTotal * COMMISSION
  const vendorTotal = cartTotal * (1 - COMMISSION)

  async function handlePaymentSuccess() {
    // Crear órdenes en la BD
    const orders = cart.map(item => ({
      buyer_id:   session.user.id,
      seller_id:  item.product.seller_id,
      product_id: item.product.id,
      amount:     item.product.price * item.quantity,
      quantity:   item.quantity,
      status:     'completado',
    }))

    await supabase.from('orders').insert(orders)

    // Actualizar wallets de vendedores
    for (const item of cart) {
      const netAmount = item.product.price * item.quantity * (1 - COMMISSION)
      const sellerId  = item.product.seller_id

      // Verificar si ya tiene wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', sellerId)
        .single()

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + netAmount, updated_at: new Date() })
          .eq('user_id', sellerId)
      } else {
        await supabase
          .from('wallets')
          .insert({ user_id: sellerId, balance: netAmount })
      }

      // Registrar transacción
      await supabase.from('transactions').insert({
        seller_id:    sellerId,
        gross_amount: item.product.price * item.quantity,
        commission:   item.product.price * item.quantity * COMMISSION,
        net_amount:   netAmount,
        status:       'completado',
      })
    }

    clearCart()
    setShowCheckout(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
          <p className="text-gray-500 text-sm mb-8">Tu compra ha sido procesada correctamente.</p>
          <Link to="/" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Seguir comprando
          </Link>
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
            <Link to="/" className="text-brand-600 hover:underline text-sm font-medium">
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                    <p className="text-brand-600 font-bold text-sm mt-0.5">${Number(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">−</button>
                    <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">+</button>
                  </div>
                  <button onClick={() => removeFromCart(product.id)}
                    className="text-red-400 hover:text-red-600 transition-colors text-sm ml-2">✕</button>
                </div>
              ))}
            </div>

            {/* Summary */}
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

              <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisión servicio (6%)</span>
                  <span>${commission.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
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

      {/* Stripe Checkout Modal */}
      {showCheckout && (
        <StripeCheckout
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
