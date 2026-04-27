# Carrito de Compras Deportivo — Frontend

SPA desarrollada en Vue 3 que consume la API REST del backend (Serverless + DynamoDB Local).

## Tecnologías

| Herramienta | Propósito |
|---|---|
| Vue 3 + Composition API | Framework principal (`<script setup>`) |
| Pinia | Gestión de estado global |
| Vue Router 4 | Navegación SPA con guards de autenticación |
| Axios | Cliente HTTP con interceptores JWT |
| Vite | Bundler y servidor de desarrollo |
| GSAP | Animaciones de página y stagger en grilla |
| Lucide Vue Next | Librería de íconos |

---

## Estructura del proyecto

```
Frontend/
├── src/
│   ├── api/
│   │   ├── axios.js          # Instancia Axios con interceptores JWT y 401
│   │   ├── auth.js           # Endpoints de registro y login
│   │   ├── products.js       # Endpoints de productos
│   │   ├── cart.js           # Endpoints del carrito
│   │   ├── orders.js         # Endpoints de órdenes
│   │   └── favorites.js      # Endpoints de favoritos
│   ├── stores/               # Estado global con Pinia
│   │   ├── auth.js           # Sesión del usuario (JWT en localStorage)
│   │   ├── cart.js           # Carrito con optimistic updates + debounce
│   │   ├── products.js       # Productos con caché de páginas y prefetch
│   │   ├── orders.js         # Historial de órdenes
│   │   ├── favorites.js      # Favoritos con toggle optimista
│   │   └── locale.js         # Internacionalización ES / EN
│   ├── views/
│   │   ├── HomeView.vue      # Landing con hero, categorías y productos destacados
│   │   ├── ProductsView.vue  # Catálogo completo con filtros y paginación
│   │   ├── CartView.vue      # Carrito de compras y checkout
│   │   ├── OrdersView.vue    # Historial de órdenes
│   │   ├── FavoritesView.vue # Productos guardados
│   │   ├── LoginView.vue     # Inicio de sesión
│   │   └── RegisterView.vue  # Registro de usuario
│   ├── components/
│   │   ├── AppHeader.vue     # Header sticky con nav, búsqueda, selector de idioma
│   │   ├── AppFooter.vue     # Footer
│   │   ├── ProductCard.vue   # Tarjeta de producto reutilizable
│   │   ├── CartItem.vue      # Ítem del carrito con stepper de cantidad
│   │   └── LoadingSpinner.vue# Indicador de carga
│   ├── composables/
│   │   └── useReveal.js      # Animaciones de scroll reveal con GSAP
│   ├── router/
│   │   └── index.js          # Rutas y guards de navegación
│   ├── App.vue               # Raíz de la app con transiciones de página
│   └── main.js               # Punto de entrada
├── index.html
├── vite.config.js            # Proxy /dev → http://localhost:4000
└── package.json
```

---

## Instalación y ejecución

### Prerrequisitos

- Node.js 18+
- El **backend** debe estar corriendo en `http://localhost:4000`  
  (ver instrucciones en `Backend/README.md`)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

> El servidor de desarrollo incluye un **proxy automático**: las peticiones a `/dev/*`
> se redirigen a `http://localhost:4000`, por lo que no es necesario configurar CORS
> durante el desarrollo.

### 3. Build de producción (opcional)

```bash
npm run build
npm run preview   # previsualizar el build
```

---

## Funcionalidades

### Productos
- Listado de productos con **paginación numerada** y caché de páginas
- **Prefetch silencioso** de la página siguiente para navegación instantánea
- **Filtrado por categoría** (fútbol, calzado, ropa, accesorios, tenis, ciclismo)
- **Filtro por rango de precio** (mín – máx)
- **Búsqueda en tiempo real** por nombre y categoría
- **Ordenación**: relevancia, precio ascendente/descendente, nombre A–Z

### Carrito
- **Optimistic updates**: la UI refleja cambios al instante, con rollback si la API falla
- **Debounce de 400 ms** en actualizaciones de cantidad para reducir llamadas a la API
- **Mini carrito en el hero** con stepper de cantidad y checkout directo
- Vaciado completo del carrito
- Checkout con validación de stock en tiempo real

### Autenticación
- Registro e inicio de sesión con JWT
- Sesión persistida en `localStorage`
- Guards de navegación: rutas protegidas redirigen a `/login` con query `?redirect=`
- Carga paralela del carrito, favoritos y órdenes al iniciar sesión
- Auto-logout al detectar token expirado (interceptor 401)

### Órdenes
- Historial de compras con filtro por estado (todas / activas / canceladas)
- Cancelación de órdenes

### Favoritos
- Toggle optimista: agrega/quita sin esperar respuesta del servidor
- Rollback automático si la API falla

### UX
- Transiciones de página con GSAP (fade + deslizamiento vertical)
- Animaciones stagger en la grilla de productos al cambiar de página o filtro
- Scroll reveal en secciones con Intersection Observer
- Indicadores de carga granulares por sección (no bloquean la UI)
- Manejo de errores con alertas inline (sin bloquear la navegación)
- Selector de idioma / región (Español / English) con banderas

---

## Endpoints consumidos

| Método | Endpoint | Store |
|--------|----------|-------|
| POST | `/dev/auth/register` | `auth` |
| POST | `/dev/auth/login` | `auth` |
| GET | `/dev/products` | `products` |
| GET | `/dev/cart` | `cart` |
| POST | `/dev/cart/add` | `cart` |
| PUT | `/dev/cart/:productId` | `cart` |
| DELETE | `/dev/cart/:productId` | `cart` |
| DELETE | `/dev/cart` | `cart` |
| POST | `/dev/orders/checkout` | `cart` |
| GET | `/dev/orders` | `orders` |
| PATCH | `/dev/orders/:id/cancel` | `orders` |
| GET | `/dev/favorites` | `favorites` |
| POST | `/dev/favorites/:productId` | `favorites` |
| DELETE | `/dev/favorites/:productId` | `favorites` |

---

## Gestión de estado (Pinia)

| Store | Responsabilidad |
|-------|----------------|
| `auth` | Token JWT, datos del usuario, login/logout |
| `cart` | Ítems, totales, checkout, optimistic updates |
| `products` | Listado, paginación, caché, filtros |
| `orders` | Historial, cancelación |
| `favorites` | Toggle optimista, lista de favoritos |
| `locale` | Idioma activo (ES/EN), función `t()` de traducción |
