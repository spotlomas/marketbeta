import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

function Seller() {
    const { addProduct, products, setFeatured } = useContext(AppContext);

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        addProduct({ name, price });
        setName("");
        setPrice("");
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Panel Vendedor</h2>

            <form onSubmit={handleSubmit} className="mb-6 space-y-3">
                <input
                    type="text"
                    placeholder="Nombre producto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border p-2 w-full rounded"
                    required
                />

                <input
                    type="number"
                    placeholder="Precio"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="border p-2 w-full rounded"
                    required
                />

                <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Guardar
                </button>
            </form>

            <h3 className="text-xl font-bold mb-3">Tus productos</h3>

            {products.map((product) => (
                <div key={product.id} className="mb-2 p-3 bg-gray-100 rounded">
                    {product.name} - ${product.price}
                    <button
                        onClick={() => setFeatured(product.id)}
                        className="ml-4 text-sm bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                        Destacar
                    </button>
                </div>
            ))}
        </div>
    );
}

export default Seller;
