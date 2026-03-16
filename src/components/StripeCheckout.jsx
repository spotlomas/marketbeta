import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

const stripePromise = loadStripe('pk_test_51TB2WTF9eAehPvmBGJOZcJY40DQ80stmDJYWjB2b6fZgZOHU0h1JPHxODnnbjlaX6CEX4SNJ9p9IPOuVIfGOUeo100eqTttFIX')

// ── Formulario de pago interno ────────────────────────────
function CheckoutForm({ onSuccess, onError }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/' },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message)
      setPaying(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors mt-2"
      >
        {paying ? 'Procesando pago...' : 'Pagar ahora'}
      </button>
    </form>
  )
}

// ── Componente principal exportado ────────────────────────
export default function StripeCheckout({ onSuccess, onClose }) {
  const { cart, session } = useApp()
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  async function initPayment() {
    setLoading(true)
    setError('')

    const { data: { session: currentSession } } = await supabase.auth.getSession()

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          items: cart,
          buyer_id: session.user.id,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || data?.error) {
      setError('Error al iniciar el pago. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setClientSecret(data.clientSecret)
    setLoading(false)
  }

  useEffect(() => { initPayment() }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Pago seguro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >✕</button>
        </div>

        {/* Resumen del monto */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subtotal</span>
            <span>${cart.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(2)} MXN</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Comisión de servicio (6%)</span>
            <span>incluida</span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <CheckoutForm
              onSuccess={onSuccess}
              onError={(msg) => setError(msg)}
            />
          </Elements>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          🔒 Pago procesado de forma segura por Stripe
        </p>
      </div>
    </div>
  )
}
