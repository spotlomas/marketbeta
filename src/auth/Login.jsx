import { useState } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate, Link } from "react-router-dom"

export default function Login({ setIsAuthenticated }) {
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            alert("Credenciales incorrectas")
            return
        }

        setIsAuthenticated(true)
        navigate("/home")
    }

    return (
        <div className="p-10">
            <h2 className="text-2xl mb-4">Login</h2>

            <input
                className="border p-2 block mb-3"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                className="border p-2 block mb-3"
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
            />

            <button
                className="bg-blue-600 text-white px-4 py-2"
                onClick={handleLogin}
            >
                Iniciar sesión
            </button>

            <p className="mt-4">
                ¿No tienes cuenta?
                <Link to="/register" className="text-blue-600 ml-2">
                    Regístrate
                </Link>
            </p>
        </div>
    )
}