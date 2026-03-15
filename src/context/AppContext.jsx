import { createContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchProducts();
        fetchOrders();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase
            .from("products")
            .select("*");

        setProducts(data || []);
    };

    const fetchOrders = async () => {
        const { data } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        setOrders(data || []);
    };

    const addProduct = async (product) => {
        await supabase.from("products").insert([
            {
                name: product.name,
                price: Number(product.price),
            },
        ]);
        fetchProducts();
    };

    const addToCart = (product) => {
        setCart([...cart, product]);
    };

    const confirmOrder = async (buyerName) => {
        for (let item of cart) {
            await supabase.from("orders").insert([
                {
                    product_id: item.id,
                    product_name: item.name,
                    buyer_name: buyerName,
                    total: item.price,
                    status: "Pendiente"
                }
            ]);
        }

        setCart([]);
        fetchOrders();
    };

    return (
        <AppContext.Provider value={{
            products,
            addProduct,
            cart,
            addToCart,
            confirmOrder,
            orders
        }}>
            {children}
        </AppContext.Provider>
    );
};
