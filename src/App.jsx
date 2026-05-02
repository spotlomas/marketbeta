import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login              from './auth/Login'
import Register           from './auth/Register'
import CompletarRegistro  from './pages/CompletarRegistro'
import Home               from './pages/Home'
import Cart               from './pages/Cart'
import Seller             from './pages/Seller'
import MisCompras         from './pages/MisCompras'
import PuntoDeVenta       from './pages/PuntoDeVenta'
import Admin              from './pages/Admin'
import Buscar             from './pages/Buscar'
import Tienda             from './pages/Tienda'
import Tiendas            from './pages/Tiendas'
import Perfil             from './pages/Perfil'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/completar-registro" element={<CompletarRegistro />} />
            <Route path="/"                   element={<Home />} />
            <Route path="/cart"               element={<Cart />} />
            <Route path="/seller"             element={<Seller />} />
            <Route path="/mis-compras"        element={<MisCompras />} />
            <Route path="/punto-de-venta"     element={<PuntoDeVenta />} />
            <Route path="/admin"              element={<Admin />} />
            <Route path="/buscar"             element={<Buscar />} />
            <Route path="/tienda/:id"         element={<Tienda />} />
            <Route path="/tiendas"            element={<Tiendas />} />
            <Route path="/perfil"             element={<Perfil />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
