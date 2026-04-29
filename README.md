

# Carrito de Compras Deportivo

Proyecto que permite a cualquier usuario explorar, agregar y comprar productos deportivos en un entorno local, simulando la experiencia de una tienda real. Está compuesto por un backend serverless, un frontend y servicios locales para base de datos y almacenamiento, simulando una arquitectura basada en servicios cloud (AWS).

## Flujo General 

1. El usuario se registra/inicia sesión
2. Explora productos 
3. Agrega productos al carrito 
4. Realiza el checkout 
5. Recibe confirmación de compra por correo (Ethereal, vista previa en consola)
6. Puede consultar historial de pedidos

Todo el sistema es ejecutable en local.

--- 

## Arquitectura 

- **Backend:** API REST serverless (Node.js + Serverless Framework + DynamoDB Local + MinIO + Nodemailer) 

- **Frontend:** SPA (Vue.js + Vite) 

- **Servicios Locales:** DynamoDB Local (base de datos NoSQL), MinIO (simulación de S3 para imágenes)

┌────────────┐      ┌──────────────┐      ┌────────────┐
│  Frontend  │ <--> │   Backend    │ <--> │  Servicios │
│   (Vue)    │      │ (Node.js)    │      │  Locales   │
└────────────┘      └──────────────┘      └────────────┘
--- 

## Tecnologías 

### Backend 

- Node.js - Serverless Framework + serverless-offline 
- DynamoDB Local - MinIO - JWT + bcryptjs 
- Winston (logs) - Nodemailer (Ethereal) 

### Frontend 

- Vue.js 3 
- Vite 
- Pinia (state management) 
- Axios 
---


## Instrucciones de instalación y ejecución


1. **Requisitos previos**
  - Node.js >= 18
  - npm >= 9
  - Java 17+ (para DynamoDB Local)
  - MinIO instalado


2. **Clonar el repositorio**

```bash
    git clone https://github.com/devean18/carrito-compras-deportivas.git
    cd carrito-compras-deportivas
```
  

3. **Instalar dependencias**

```bash
    cd Backend
    npm install

    cd ../Frontend
    npm install
```

4. **Configuracion de entorno**

  - Copiar los archivos `.env.example` a `.env` en Backend y Frontend y editarlos según sea necesario.
  
  - Ejemplo Backend:

    ```env
    PORT=4000
    JWT_SECRET=your_secret
    DYNAMODB_ENDPOINT=http://localhost:8000
    MINIO_ENDPOINT=http://localhost:9000
    MINIO_ACCESS_KEY=minioadmin
    MINIO_SECRET_KEY=minioadmin
    ```

  - Ejemplo Frontend:

    ```env
    VITE_API_URL=http://localhost:4000/dev
    ```

5. **Levantar servicios locales**

  - **DynamoDB Local:**

    - Descargar:

     (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html).

    - Verificar que Java 17+ esté instalado.

    - Descomprimir y ubicar `DynamoDBLocal.jar` y la carpeta `DynamoDBLocal_lib`.

    - Ejecutar:

     ```bash
     java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb

     ```

  - **MinIO:**

    - Descargar 
      https://min.io/download.

    - Ejecutar:

     ```bash
      minio.exe server C:\minio-data --console-address ":9001"
     ```

    - Acceder a la consola web: 

      http://localhost:9001 

      (usuario: `minioadmin`, 
      contraseña: `minioadmin`)


6. **Backend**

```bash
   cd Backend

   npx serverless offline
   # o
   npm run dev
  ```
  Backend disponible en: http://localhost:4000


7. **Frontend**

```bash
  cd Frontend
  npm run dev
  ```
  Frontend disponible en: http://localhost:5173

8. **Cargar datos de muestra (seed)**

```bash
   cd Backend
   node seed.js
   ```
   Esto insertará productos de ejemplo en DynamoDB Local.

---


## URLs del sistema

- **Frontend:** http://localhost:5173

- **Backend (API):** http://localhost:4000

- **MinIO (S3 local):** http://localhost:9001

---


## Respuesta estándar del API

```json
{
  "data": { ... },
  "message": "Mensaje descriptivo",
  "meta": { ... }
}
```
- `data`: información principal solicitada
- `message`: mensaje de éxito o error
- `meta`: datos adicionales (paginación, conteos, etc.)

---

## Estructura del Proyecto
```
Carrito de Compras/
├── Backend/   # API REST serverless
├── Frontend/  # SPA Vue.js
└── README.md  # Este archivo principal
```

---

## Notas Técnicas

- DynamoDB → DynamoDB Local

- Las imágenes de productos se simulan en MinIO 

- Las instrucciones detalladas y endpoints están en los README internos

- El correo de confirmación se envía usando Ethereal 


### ¿Cómo ver el correo de confirmación?

1. Realizar una compra desde el frontend o usando el endpoint `/dev/orders/checkout`.

2. En la consola donde corre el backend, visualizar una línea como:

  previewUrl: 'https://ethereal.email/message/XXXXX' 
  
3. Abrir URL 

---

## Logging

Los logs se almacenan en la carpeta `logs/`:

- `logs/combined.log` — todos los logs
- `logs/error.log` — solo errores


## Documentación Interna

- [Backend/README.md](Backend/README.md): detalles de endpoints, configuración y lógica del backend

- [Frontend/README.md](Frontend/README.md): detalles de ejecución y estructura del frontend

---

