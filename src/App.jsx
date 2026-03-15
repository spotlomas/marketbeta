import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login    from './auth/Login'
import Register from './auth/Register'
import Home     from './pages/Home'
import Cart     from './pages/Cart'
import Seller   from './pages/Seller'

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
            <Route path="/"       element={<Home />} />
            <Route path="/cart"   element={<Cart />} />
            <Route path="/seller" element={<Seller />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
