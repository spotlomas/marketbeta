import { useContext } from "react";
import { AppContext } from "../context/AppContext";

function Home() {
    const {
        products,
        featuredProduct,
        addToCart,
        user,
        userMode,
        toggleMode
    } = useContext(AppContext);

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = "/login"
    }

    return (
        <div className="p-6">

            {/* Barra superior usuario */}
            {user && (
                <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow">
                    <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-sm text-gray-500">
                            Modo actual: {userMode}
                        </p>
                    </div>

                    <button
                        onClick={toggleMode}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                    >
                        Cambiar a {userMode === "buyer" ? "Vendedor" : "Comprador"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        Cerrar sesión
                    </button>

                </div>
            )}

            {/* Producto Destacado */}
            {featuredProduct && (
                <div className="mb-6 p-6 bg-yellow-100 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">
                        ⭐ Producto Destacado
                    </h2>
                    <h3 className="text-xl">{featuredProduct.name}</h3>
                    <p className="text-lg font-semibold">
                        ${featuredProduct.price}
                    </p>
                </div>
            )}

            {/* Lista productos */}
            <h2 className="text-2xl font-bold mb-4">Productos</h2>

            {products.length === 0 ? (
                <p className="text-gray-500">No hay productos disponibles.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
                        >
                            <h3 className="font-bold text-lg">
                                {product.name}
                            </h3>

                            <p className="text-gray-600 mb-3">
                                ${product.price}
                            </p>

                            {userMode === "buyer" && (
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Agregar al carrito
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Home;