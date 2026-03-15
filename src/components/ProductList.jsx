function ProductList({ productos, agregarAlCarrito }) {

    const productoDestacado = productos.find(p => p.destacado);

    return (
        <div>

            {productoDestacado && (
                <div style={{
                    backgroundColor: "#ffe082",
                    padding: "15px",
                    borderRadius: "10px",
                    marginBottom: "20px"
                }}>
                    <h2>🔥 Producto Destacado</h2>
                    <h3>{productoDestacado.nombre}</h3>
                    <p>Precio: ${productoDestacado.precio}</p>
                    <button onClick={() => agregarAlCarrito(productoDestacado)}>
                        Agregar al carrito
                    </button>
                </div>
            )}

            <h2>Productos disponibles</h2>

            {productos.map(producto => (
                <div key={producto.id} style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    marginBottom: "10px",
                    borderRadius: "8px"
                }}>
                    <h3>{producto.nombre}</h3>
                    <p>Precio: ${producto.precio}</p>
                    <button onClick={() => agregarAlCarrito(producto)}>
                        Agregar al carrito
                    </button>
                </div>
            ))}

        </div>
    );
}

export default ProductList;
