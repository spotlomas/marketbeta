import { useState } from "react";

function VendorPanel({ agregarProducto }) {

    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState("");
    const [destacado, setDestacado] = useState(false);

    const manejarEnvio = (e) => {
        e.preventDefault();

        if (!nombre || !precio) return;

        agregarProducto({
            id: Date.now(),
            nombre,
            precio: Number(precio),
            destacado
        });

        setNombre("");
        setPrecio("");
        setDestacado(false);
    };

    return (
        <div style={{ marginBottom: "30px" }}>
            <h2>Panel de Vendedor</h2>

            <form onSubmit={manejarEnvio}>
                <input
                    placeholder="Nombre del producto"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />
                <input
                    placeholder="Precio"
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                />
                <label>
                    Destacado
                    <input
                        type="checkbox"
                        checked={destacado}
                        onChange={(e) => setDestacado(e.target.checked)}
                    />
                </label>
                <button type="submit">Agregar Producto</button>
            </form>
        </div>
    );
}

export default VendorPanel;
