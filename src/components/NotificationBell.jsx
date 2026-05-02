import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useApp } from '../context/AppContext'
import ReviewModal from './ReviewModal'

export default function NotificationBell() {
  const { session } = useApp()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen]                   = useState(false)
  const [reviewOrder, setReviewOrder]     = useState(null)

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, () => fetchNotifications())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setNotifications(data)
  }

  async function handleNotificationClick(notif) {
    if (notif.type === 'review_request') {
      // Cargar la orden con producto
      const { data: order } = await supabase
        .from('orders')
        .select('*, products(name, price, image_url)')
        .eq('id', notif.data?.order_id)
        .single()

      if (order) {
        setReviewOrder(order)
        setOpen(false)
      }
    }

    // Marcar como leída
    await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
    fetchNotifications()
  }

  const unread = notifications.length

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative text-gray-600 hover:text-brand-600 transition-colors"
        >
          🔔
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-8 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">Notificaciones</p>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No tienes notificaciones
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                    {notif.message && <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>}
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(notif.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => {
            setReviewOrder(null)
            fetchNotifications()
          }}
        />
      )}
    </>
  )
}
