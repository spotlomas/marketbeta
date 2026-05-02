import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'

export default function ReviewModal({ order, onClose, onSubmitted }) {
  const { session } = useApp()
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Selecciona una calificación.'); return }
    setSaving(true)
    setError('')

    // 1. Insertar review
    const { error: reviewError } = await supabase.from('reviews').insert({
      order_id:   order.id,
      product_id: order.product_id,
      buyer_id:   session.user.id,
      seller_id:  order.seller_id,
      rating,
      comment: comment.trim() || null,
    })

    if (reviewError) {
      if (reviewError.code === '23505') {
        setError('Ya calificaste este producto.')
      } else {
        setError('Error al enviar la calificación.')
      }
      setSaving(false)
      return
    }

    // 2. Actualizar avg_rating, total_reviews y score en products
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', order.product_id)

    if (reviews) {
      const total    = reviews.length
      const avg      = reviews.reduce((s, r) => s + r.rating, 0) / total

      // Obtener sales_count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', order.product_id)
        .eq('status', 'entregado')

      const salesCount = count || 0

      // Score balanceado: ventas pesan 60%, rating 40%, con log para suavizar
      const score = (salesCount * 0.6) + (avg * 0.4) * Math.log10(salesCount + 1)

      await supabase.from('products').update({
        avg_rating:    parseFloat(avg.toFixed(2)),
        total_reviews: total,
        sales_count:   salesCount,
        score:         parseFloat(score.toFixed(4)),
      }).eq('id', order.product_id)
    }

    // 3. Marcar notificación como leída
    await supabase.from('notifications')
      .update({ read: true })
      .eq('data->>order_id', order.id)
      .eq('user_id', session.user.id)

    setSaving(false)
    onSubmitted?.()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">¿Cómo estuvo tu compra?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Producto */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-5">
          {order.products?.image_url
            ? <img src={order.products.image_url} alt={order.products.name} className="w-12 h-12 object-cover rounded-lg" />
            : <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xl">🛍️</div>
          }
          <div>
            <p className="font-medium text-gray-800 text-sm">{order.products?.name}</p>
            <p className="text-xs text-gray-400">${Number(order.amount).toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estrellas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calificación *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl select-none transition-opacity ${star <= rating ? 'opacity-100' : 'opacity-25'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
              </p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="¿Qué te pareció el producto?"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={saving || rating === 0}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
            {saving ? 'Enviando...' : 'Enviar calificación'}
          </button>
        </form>
      </div>
    </div>
  )
}
