# Carrito de Compras Deportivo — Backend

API REST serverless que simula una arquitectura AWS usando herramientas locales.

## Tecnologías


| Node.js| Base del servidor |
| serverless-offline | Simulación de AWS Lambda |
| DynamoDB Local | Base de datos |
| MinIO | Almacenamiento de imágenes|
| JWT + bcryptjs | Autenticación y seguridad |
| Winston | Logging |
| Nodemailer | Envío de correos de confirmación |

---

## Estructura del proyecto

```
Backend/
├── src/
│   ├── config/
│   │   ├── dynamodb.js       # Conexión y creación de tablas DynamoDB
│   │   ├── minio.js          # Cliente MinIO y subida de imágenes
│   │   ├── logger.js         # Winston logger
│   │   └── email.js          # Transporte Nodemailer
│   ├── services/
│   │   ├── authService.js    # Registro/Login de usuarios
│   │   ├── productService.js # CRUD de productos + stock
│   │   ├── cartService.js    # Gestión del carrito
│   │   ├── orderService.js   # Checkout e historial de ordenes
│   │   ├── favoritesService.js # Gestión de favoritos
│   │   └── emailService.js   # Envío de emails
│   ├── handlers/             # Funciones Lambda (entrypoints serverless)
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── favorites.js
│   └── utils/
│       ├── response.js       # Respuestas HTTP estandarizadas
│       └── lambda.js         # Helpers para handlers Lambda (auth, parseo)
├── seed.js                   # Insertar DynamoDB con datos de muestra
├── serverless.yml
├── package.json
├── .env.example
└── README.md
```


## Instalación y ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo y edítar 
copy .env.example .env
```

### 3. Descargar e instalar DynamoDB Local
Descarga desde: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html

```bash
# Ejecutar DynamoDB Local (requiere Java). 

#Para ejecutar DynamoDB v2.6.0 o superior en su equipo, debe tener instalada la versión 17.x o posterior del Entorno de Ejecución de Java (JRE). La aplicación no funciona con versiones anteriores de JRE.

#Para iniciar DynamoDB en su computadora, abra una ventana del símbolo del sistema, navegue hasta el directorio donde extrajo el archivo DynamoDBLocal.jary escriba el siguiente comando.

java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

### 4. Instalar y ejecutar MinIO
Descarga desde: https://min.io/download 

```bash
# Windows
minio.exe server C:\minio-data --console-address ":9001"
```

Accede a la consola en `http://localhost:9001` (usuario: `minioadmin`, contraseña: `minioadmin`).

### 5. Ejecutar el backend
```bash
npx serverless offline
# o en modo desarrollo con recarga automática:
npm run dev
```


El servidor quedará disponible en `http://localhost:4000`.

---

## Endpoints de la API

### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/dev/auth/register` | Registrar usuario | No |
| POST | `/dev/auth/login` | Iniciar sesión | No |

### Productos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/dev/products` | Listar productos (paginación + filtro categoría) | No |
| GET | `/dev/products/:id` | Obtener producto por ID | No |
| POST | `/dev/products` | Crear producto | Sí |
| PUT | `/dev/products/:id` | Actualizar producto | Sí |
| DELETE | `/dev/products/:id` | Eliminar producto | Sí |

**Parámetros de query para `GET /dev/products`:**
- `category` — filtrar por categoría (ej. `?category=futbol`)
- `limit` — ítems por página (default: 10, máx: 100)
- `lastKey` — token de paginación retornado en la respuesta anterior

### Carrito
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/dev/cart` | Ver carrito del usuario | Sí |
| POST | `/dev/cart/add` | Agregar producto al carrito | Sí |
| DELETE | `/dev/cart/:productId` | Eliminar producto del carrito | Sí |
| DELETE | `/dev/cart` | Vaciar carrito | Sí |

### Órdenes
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/dev/orders/checkout` | Finalizar compra | Sí |
| GET | `/dev/orders` | Historial de compras | Sí |
| GET | `/dev/orders/:id` | Detalle de una orden | Sí |

---

## Ejemplos de uso

### Registrar usuario
```http
POST http://localhost:4000/dev/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "mipassword123"
}
```

### Login
```http
POST http://localhost:4000/dev/auth/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "mipassword123"
}
```

### Crear producto (requiere token JWT)
```http
POST http://localhost:4000/dev/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Balón Nike Premier",
  "category": "futbol",
  "price": 599.99,
  "stock": 50,
  "imageUrl": "http://localhost:9000/products/balon-nike.webp"
}
```

### Agregar al carrito
```http
POST http://localhost:4000/dev/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "uuid-del-producto",
  "quantity": 2
}
```

### Checkout
```http
POST http://localhost:4000/dev/orders/checkout
Authorization: Bearer <token>

```
## Confirmación de compra por correo (Ethereal)

Cuando finalizas una compra (`/dev/orders/checkout`), el sistema envía automáticamente un correo de confirmación al email del usuario usando **Nodemailer** y la plataforma de testing **Ethereal**.

### ¿Cómo ver el correo de confirmación?

1. Realizar una compra desde el frontend o usando el endpoint `/dev/orders/checkout`.
2. En la consola donde corre el backend, visualizar una línea como:

  previewUrl: 'https://ethereal.email/message/XXXXX' 
  ```
3. Abrir URL 
  ```
---

## Tablas DynamoDB

| Tabla | Clave primaria | Índice GSI |
|-------|----------------|------------|
| `products` | `id` (String) | `category-index` |
| `users` | `id` (String) | `email-index` |
| `carts` | `userId` (String) | — |
| `orders` | `id` (String) | `userId-index` |

> Las tablas se crean automáticamente al iniciar el servidor.

---

## Seguridad implementada

- Contraseñas hasheadas con **bcryptjs** (salt rounds: 10)
- Autenticación con **JWT** en rutas sensibles
- Validación de inputs en todos los endpoints
- Manejo de errores con `try/catch` en todas las capas
- Separación de responsabilidades (handler → controller → service)

---

## Logging

Los logs se almacenan en la carpeta `logs/`:
- `logs/combined.log` — todos los logs
- `logs/error.log` — solo errores

También se imprimen en consola con colores durante el desarrollo.
