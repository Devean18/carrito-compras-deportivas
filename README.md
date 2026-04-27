

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
git clone <url-del-repo>
cd carrito-compras-deportivo
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


6. **Ejecutar backend**

  ```bash
  cd Backend
  npx serverless offline
  # o
  npm run dev
  ```
  Backend disponible en: http://localhost:4000

7. **Ejecutar frontend**
  ```bash
  cd Frontend
  npm run dev
  ```
  Frontend disponible en: http://localhost:5173

---


   - Abre una terminal en esa carpeta y ejecuta:
     ```bash
     java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
   - Deja esta terminal abierta; DynamoDB Local debe estar corriendo durante todo el uso del sistema.

2. **Levantar el servicio de almacenamiento (MinIO)**
     ```bash
     minio.exe server C:\minio-data --console-address ":9001"
     ```
   - Accede a la consola web en [http://localhost:9001](http://localhost:9001) con usuario `minioadmin` y contraseña `minioadmin`.
   - Deja esta terminal abierta; MinIO debe estar corriendo durante todo el uso del sistema.

3. **Iniciar el backend (Serverless Offline)**
   - Abre una nueva terminal y navega a la carpeta `Backend` del proyecto.
     ```bash
     npm install
     ```
   - Ejecuta el backend en modo offline:

4. **Iniciar el frontend (Vite)**
   - Abre una nueva terminal y navega a la carpeta `Frontend` del proyecto.
   - Ejecuta el frontend:
     npm run dev
     ```

---


## URLs de Acceso
- **Frontend:** http://localhost:5173
- **Backend (API):** http://localhost:4000
- **MinIO (S3 local):** http://localhost:9001

---


## Formato de Respuesta del Backend
Respuestas en formato:
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
- Las imágenes de productos se simulan en MinIO 
- El correo de confirmación se envía solo en modo desarrollo usando Ethereal (ver URL de vista previa en consola)
- Las instrucciones detalladas y endpoints están en los README internos


## Variables de entorno (Backend)

Ejemplo `.env` para Backend:
```
PORT=4000
JWT_SECRET=your_secret
DYNAMODB_ENDPOINT=http://localhost:8000
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## Variables de entorno (Frontend)

Ejemplo `.env` para Frontend:
```
VITE_API_URL=http://localhost:4000/dev
```
---

## Documentación Interna
- [Backend/README.md](Backend/README.md): detalles de endpoints, configuración y lógica del backend
- [Frontend/README.md](Frontend/README.md): detalles de ejecución y estructura del frontend

---

