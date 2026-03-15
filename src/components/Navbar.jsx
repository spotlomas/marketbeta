function Navbar({ carrito }) {
    const total = carrito.reduce((acc, item) => acc + item.precio, 0);

    return (
        <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#1976d2",
            color: "white",
            padding: "10px 15px",
            borderRadius: "8px"
        }}>
            🛒 {carrito.length} | ${total}
        </div>
    );
}

export default Navbar;
