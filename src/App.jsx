import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login        from './auth/Login'
import Register     from './auth/Register'
import Home         from './pages/Home'
import Cart         from './pages/Cart'
import Seller       from './pages/Seller'
import MisCompras   from './pages/MisCompras'
import PuntoDeVenta from './pages/PuntoDeVenta'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/"               element={<Home />} />
            <Route path="/cart"           element={<Cart />} />
            <Route path="/seller"         element={<Seller />} />
            <Route path="/mis-compras"    element={<MisCompras />} />
            <Route path="/punto-de-venta" element={<PuntoDeVenta />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
