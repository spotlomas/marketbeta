import { useState } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"

export default function Register() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: "",
        password: "",
        tipo_usuario: "comprador",
        nombre: "",
        numero_control: "",
        edad: "",
        curp: "",
        escuela: "",
        rfc: "",
        tipo_pago: ""
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleRegister = async () => {

        // 1️⃣ Crear usuario en Auth
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password
        })

        if (error) {
            alert(error.message)
            return
        }

        // 2️⃣ Guardar datos adicionales
        const { error: dbError } = await supabase
            .from("usuarios")
            .insert([{
                id: data.user.id,
                ...form
            }])

        if (dbError) {
            alert(dbError.message)
            return
        }

        alert("Cuenta creada correctamente")
        navigate("/home")
    }

    return (
        <div>
            <h2>Registro</h2>

            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <input name="nombre" placeholder="Nombre" onChange={handleChange} />
            <input name="numero_control" placeholder="Número de control" onChange={handleChange} />
            <input name="edad" placeholder="Edad" onChange={handleChange} />

            <select name="tipo_usuario" onChange={handleChange}>
                <option value="comprador">Comprador</option>
                <option value="vendedor">Vendedor</option>
            </select>

            {form.tipo_usuario === "vendedor" && (
                <>
                    <input name="curp" placeholder="CURP" onChange={handleChange} />
                    <input name="escuela" placeholder="Escuela" onChange={handleChange} />
                    <input name="rfc" placeholder="RFC (opcional)" onChange={handleChange} />
                </>
            )}

            <select name="tipo_pago" onChange={handleChange}>
                <option value="">Método de pago (opcional)</option>
                <option value="paypal">PayPal</option>
                <option value="apple_pay">Apple Pay</option>
                <option value="credito_debito">Crédito/Débito</option>
            </select>

            <button onClick={handleRegister}>Registrarse</button>
        </div>
    )
}