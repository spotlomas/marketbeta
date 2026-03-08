import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";

function Cart() {

    const { cart, confirmOrder } = useContext(AppContext);
    const [buyerName, setBuyerName] = useState("");

    const total = cart.reduce((sum, item) => sum + Number(item.price), 0);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Carrito</h2>

            {cart.map((item, index) => (
                <div key={index} className="p-4 bg-white rounded-xl shadow mb-3">
                    <h3>{item.name}</h3>
                    <p>${item.price}</p>
                </div>
            ))}

            <h3 className="text-xl font-bold mt-4">Total: ${total}</h3>

            <input
                type="text"
                placeholder="Tu nombre"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="mt-4 p-2 border rounded w-full"
            />

            <button
                onClick={() => confirmOrder(buyerName)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg w-full"
            >
                Confirmar Pedido
            </button>
        </div>
    );
}

export default Cart;
