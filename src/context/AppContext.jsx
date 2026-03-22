import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession]           = useState(undefined)
  const [usuario, setUsuario]           = useState(null)
  const [cart, setCart]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [perfilIncompleto, setPerfilIncompleto] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUsuario(session)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUsuario(session)
      else { setUsuario(null); setCart([]); setPerfilIncompleto(false); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUsuario(session) {
    const uid = session.user.id
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .single()

    if (data) {
      setUsuario(data)
      // Perfil incompleto si le falta numero_control o edad
      const incompleto = !data.numero_control || data.numero_control === '' || data.edad === null || data.edad === undefined
      setPerfilIncompleto(incompleto)
      if (!incompleto) await fetchCart(uid)
    } else {
      // Usuario sin perfil (Google nuevo) — crear perfil mínimo automáticamente
      const meta = session.user.user_metadata || {}
      const { data: newUser } = await supabase
        .from('usuarios')
        .insert({
          id:           uid,
          email:        session.user.email,
          nombre:       meta.full_name || meta.name || session.user.email,
          tipo_usuario: 'comprador',
          // numero_control y edad vacíos → perfilIncompleto = true
        })
        .select()
        .single()

      if (newUser) {
        setUsuario(newUser)
        setPerfilIncompleto(true)
      }
    }
    setLoading(false)
  }

  async function fetchCart(uid) {
    const { data } = await supabase
      .from('cart')
      .select('*, products(*)')
      .eq('user_id', uid)

    if (data) {
      setCart(data.map(item => ({
        cartItemId: item.id,
        product:    item.products,
        quantity:   item.quantity,
      })))
    }
  }

  async function addToCart(product) {
    if (!session || !usuario || perfilIncompleto) return

    const existing = cart.find(i => i.product.id === product.id)

    if (existing) {
      const newQty = existing.quantity + 1
      await supabase.from('cart').update({ quantity: newQty }).eq('id', existing.cartItemId)
      setCart(prev => prev.map(i =>
        i.product.id === product.id ? { ...i, quantity: newQty } : i
      ))
    } else {
      const { data, error } = await supabase
        .from('cart')
        .insert({ user_id: session.user.id, product_id: product.id, quantity: 1 })
        .select('*, products(*)')
        .single()

      if (!error && data) {
        setCart(prev => [...prev, {
          cartItemId: data.id,
          product:    data.products,
          quantity:   data.quantity,
        }])
      }
    }
  }

  async function removeFromCart(productId) {
    const item = cart.find(i => i.product.id === productId)
    if (!item) return
    await supabase.from('cart').delete().eq('id', item.cartItemId)
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  async function updateQuantity(productId, quantity) {
    if (quantity <= 0) { removeFromCart(productId); return }
    const item = cart.find(i => i.product.id === productId)
    if (!item) return
    await supabase.from('cart').update({ quantity }).eq('id', item.cartItemId)
    setCart(prev => prev.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    ))
  }

  async function clearCart() {
    if (!session) return
    await supabase.from('cart').delete().eq('user_id', session.user.id)
    setCart([])
  }

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cart.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0)

  return (
    <AppContext.Provider value={{
      session, usuario, setUsuario,
      loading, perfilIncompleto, setPerfilIncompleto,
      cart, cartCount, cartTotal,
      addToCart, removeFromCart, updateQuantity, clearCart,
      fetchUsuario, fetchCart,
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
