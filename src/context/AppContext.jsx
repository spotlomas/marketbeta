import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = cargando
  const [usuario, setUsuario]   = useState(null)
  const [cart, setCart]         = useState([])         // { product, quantity }[]
  const [loading, setLoading]   = useState(true)

  // ── Auth listener ────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUsuario(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUsuario(session.user.id)
      else { setUsuario(null); setCart([]); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch perfil de usuario ───────────────────────────────
  async function fetchUsuario(uid) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .single()

    if (!error) setUsuario(data)
    setLoading(false)
  }

  // ── Cart helpers ─────────────────────────────────────────
  function addToCart(product) {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id)
      if (exists) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) { removeFromCart(productId); return }
    setCart(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity } : i)
    )
  }

  function clearCart() { setCart([]) }

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <AppContext.Provider value={{
      session, usuario, setUsuario,
      loading,
      cart, cartCount, cartTotal,
      addToCart, removeFromCart, updateQuantity, clearCart,
      fetchUsuario,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
