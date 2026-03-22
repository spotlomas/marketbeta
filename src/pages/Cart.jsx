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
      <div className="min-h-screen bg-white text-gray-900 font-inter">
        <TopNav />
        <div className="max-w-lg mx-auto px-4 py-16 pb-28">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">¡Pedido Confirmado!</h2>
            <p className="text-sm text-gray-500 font-medium">Muestra el código QR al vendedor para recibir tu pedido.</p>
          </div>

          <div className="space-y-6">
            {orders.map(order => (
              <OrderQRCard key={order.id} order={order} />
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-10">
            <Link to="/mis-compras" className="w-full text-center bg-food-500 hover:bg-food-600 text-white px-4 py-4 rounded-full font-bold text-sm transition-colors shadow-sm">
              VER MIS PEDIDOS
            </Link>
            <Link to="/" className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-4 rounded-full font-bold text-sm transition-colors">
              SEGUIR COMPRANDO
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-inter">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8 border-b border-gray-100 pb-4">Tu Carrito</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-6xl mb-6 opacity-40">🛒</p>
            <p className="font-medium text-lg mb-8 text-gray-500">Tu carrito está vacío</p>
            <Link to="/" className="bg-food-500 text-white hover:bg-food-600 transition-colors shadow-sm rounded-full px-8 py-3.5 font-bold text-sm inline-block">
              EXPLORAR COMIDA
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:shadow-sm shadow-sm">
                  <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🛍️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className="font-bold text-gray-900 text-lg truncate">{product.name}</p>
                    <p className="text-gray-500 font-medium text-sm mt-0.5">${Number(product.price).toFixed(2)} c/u</p>
                    {product.stock > 0 && !product.stock_ilimitado && (
                      <p className="text-xs font-semibold text-orange-500 bg-orange-50 w-fit px-2 py-0.5 rounded-full mt-2">Quedan {product.stock}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-4">
                    <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1 shadow-inner">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-50 shadow-sm text-lg font-medium transition-colors">−</button>
                      <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-50 shadow-sm text-lg font-medium transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(product.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 h-fit md:sticky top-24 shadow-sm">
              <h2 className="font-bold text-xl text-gray-900 mb-6 border-b border-gray-200 pb-4">Resumen de compra</h2>
              <div className="space-y-4 text-sm text-gray-600 font-medium">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between items-start gap-4">
                    <span className="flex-1 leading-snug">{product.name} <span className="text-gray-400">x{quantity}</span></span>
                    <span className="flex-shrink-0 text-gray-900 font-semibold">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-6 pt-4 text-sm text-gray-500 font-medium flex justify-between">
                <span>Tarifa de servicio (6%)</span>
                <span>${(cartTotal * COMMISSION).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setShowCheckout(true)}
                className="w-full mt-8 bg-food-500 hover:bg-food-600 text-white font-bold py-4 rounded-full text-sm transition-colors shadow-sm focus:ring-4 ring-food-500/20">
                PASAR POR CAJA
              </button>
              <button onClick={clearCart}
                className="w-full mt-4 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-2 uppercase tracking-wide">
                Vaciar Carrito
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />

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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(order.id)}&color=000000&bgcolor=ffffff&margin=4`

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden">
          {order.products?.image_url
            ? <img src={order.products.image_url} alt={order.products.name} className="w-full h-full object-cover" />
            : <span className="text-3xl opacity-30">🛍️</span>
          }
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{order.products?.name}</p>
          <p className="text-gray-500 font-medium text-sm mt-1">Total: <span className="text-food-600 font-bold">${Number(order.amount).toFixed(2)}</span></p>
        </div>
        <div className="flex-shrink-0">
           <span className="inline-block text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full">Pendiente</span>
        </div>
      </div>

      <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
           <img src={qrUrl} alt="QR_CODE" className="w-48 h-48" />
        </div>
        <p className="font-bold text-gray-900 uppercase tracking-wide text-xs mt-6">ID DEL PEDIDO</p>
        <p className="text-sm text-gray-500 font-mono mt-1 font-medium">{order.id.slice(0, 12).toUpperCase()}</p>
      </div>
    </div>
  )
}
