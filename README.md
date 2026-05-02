# MarketBeta 🛒

Marketplace estudiantil construido con React + Vite + Supabase.

---

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6
- **Backend/BaaS:** Supabase (Auth + PostgreSQL)

---

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/spotlomas/marketbeta.git
cd marketbeta
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://TUPROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtén estos valores en: **Supabase Dashboard → Settings → API**

> ⚠️ Nunca subas el archivo `.env` a GitHub. Ya está en `.gitignore`.

### 3. Configurar base de datos

En el **SQL Editor** de Supabase, ejecuta el archivo:

```
supabase_setup.sql
```

Este script crea las tablas y las políticas de seguridad (RLS).

### 4. Correr el proyecto

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## Estructura del proyecto

```
src/
├── auth/          # Login, Register
├── components/    # Navbar, ProductList, VendorPanel, ProtectedRoute
├── context/       # AppContext (auth + carrito)
├── pages/         # Home, Cart, Seller
└── services/      # supabaseClient.js
```

---

## Rutas

| Ruta        | Descripción             | Protegida |
|-------------|-------------------------|-----------|
| `/login`    | Inicio de sesión        | No        |
| `/register` | Registro de usuarios    | No        |
| `/`         | Home con productos      | Sí        |
| `/cart`     | Carrito y checkout      | Sí        |
| `/seller`   | Panel del vendedor      | Sí        |

---

## Funcionalidades implementadas

- ✅ Registro de compradores y vendedores
- ✅ Login / Logout con Supabase Auth
- ✅ Rutas protegidas con sesión persistente
- ✅ Listado de productos con búsqueda
- ✅ Productos destacados en Home
- ✅ Carrito de compras (estado global)
- ✅ Checkout con creación de órdenes en BD
- ✅ Panel vendedor: crear, editar y eliminar productos
- ✅ Dashboard de ventas con estadísticas
- ✅ Row Level Security en todas las tablas

---

## Próximas features

- [ ] Sistema de billetera (wallets)
- [ ] Retiros de saldo para vendedores
- [ ] Imágenes de productos (Supabase Storage)
- [ ] Notificaciones en tiempo real
- [ ] Sistema de calificaciones
- [ ] Panel de administración
- [ ] App móvil (React Native / Expo)
