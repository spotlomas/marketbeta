import { Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"

import Home from "./pages/Home"
import Seller from "./pages/Seller"
import Login from "./auth/Login"
import Register from "./auth/Register"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login setIsAuthenticated={setIsAuthenticated} />}
      />

      {/* REGISTER */}
      <Route path="/register" element={<Register />} />

      {/* HOME PROTEGIDO */}
      <Route
        path="/home"
        element={
          isAuthenticated
            ? <Home />
            : <Navigate to="/login" />
        }
      />

      {/* SELLER PROTEGIDO */}
      <Route
        path="/seller"
        element={
          isAuthenticated
            ? <Seller />
            : <Navigate to="/login" />
        }
      />

      {/* SI ENTRA A / DIRECTO */}
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App