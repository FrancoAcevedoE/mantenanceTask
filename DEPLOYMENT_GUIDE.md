# Guía de Despliegue: MongoDB Atlas + Render + Vercel

## 1️⃣ CONFIGURAR MONGODB ATLAS

### Paso 1: Obtener la Connection String
1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. En tu cluster, haz clic en "Connect"
3. Selecciona "Drivers" 
4. Copia la connection string
5. Reemplaza `<password>` con tu contraseña

### Paso 2: Actualizar el archivo .env del backend
En `/backend/.env`:
```
MONGODB_URI=mongodb+srv://dbTool:<tu-contraseña>@cluster0.ihztqvq.mongodb.net/mantenanceDB?retryWrites=true&w=majority
PORT=3000
NODE_ENV=production
```

---

## 2️⃣ DESPLEGAR BACKEND EN RENDER

### Paso 1: Preparar el repositorio
```bash
cd /Users/francoemanuelacevedo/Desktop/mantenanceTask
git add .
git commit -m "Preparar para producción"
git push origin main
```

### Paso 2: Crear servicio en Render
1. Ve a [render.com](https://render.com)
2. Regístrate/inicia sesión
3. Haz clic en "New +"
4. Selecciona "Web Service"
5. Conecta tu repositorio GitHub

### Paso 3: Configurar el servicio en Render

**Configuración:**
- **Name:** `mantenanceDB-backend` (o tu preferencia)
- **Environment:** `Node`
- **Build Command:** 
  ```
  npm install
  ```
- **Start Command:** 
  ```
  npm start
  ```
- **Plan:** Free (suficiente para desarrollo)

### Paso 4: Agregar Variables de Entorno en Render

1. Ve a la sección "Environment" del servicio
2. Agrega estas variables:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://dbTool:<contraseña>@cluster0.ihztqvq.mongodb.net/mantenanceDB?retryWrites=true&w=majority`
   
   - **Key:** `NODE_ENV`
   - **Value:** `production`

3. Haz clic en "Save"

### Paso 5: Copiar la URL del servicio
Después del despliegue, Render te dará una URL como:
```
https://tu-backend-xxxx.onrender.com
```
**Guarda esta URL** - la necesitarás para el frontend.

---

## 3️⃣ DESPLEGAR FRONTEND EN VERCEL

### Paso 1: Actualizar .env del frontend
En `/tool/.env`:
```
VITE_API_BASE_URL=https://tu-backend-xxxx.onrender.com/api
```

### Paso 2: Crear repositorio git (si aún no existe)
```bash
cd /Users/francoemanuelacevedo/Desktop/mantenanceTask
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/mantenanceTask.git
git push -u origin main
```

### Paso 3: Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Selecciona "Import Git Repository"
4. Pega la URL de tu repositorio GitHub
5. Haz clic en "Import"

### Paso 4: Configurar en Vercel

**Project Settings:**
- **Framework Preset:** Vite
- **Root Directory:** `./tool`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Paso 5: Agregar Variables de Entorno en Vercel

1. En el proyecto de Vercel, ve a "Settings" → "Environment Variables"
2. Agrega:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://tu-backend-xxxx.onrender.com/api`

3. Haz clic en "Save"

### Paso 6: Triggear el despliegue
```bash
git push origin main
```

Vercel se disparará automáticamente.

---

## 4️⃣ CONFIGURAR CORS

Para que el frontend y backend se comuniquen correctamente, actualiza el backend `server.js`:

```javascript
app.use(cors({
  origin: [
    "http://localhost:3000", // Para desarrollo local
    "http://localhost:5173", // Para desarrollo local
    "https://tu-frontend.vercel.app" // Tu dominio de Vercel
  ],
  credentials: true
}))
```

---

## 5️⃣ VERIFICAR FUNCIONAMIENTO

### En desarrollo local:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd tool
npm run dev
```

Deberías ver:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`

### En producción:
- Frontend: `https://tu-frontend.vercel.app`
- Backend: `https://tu-backend-xxxx.onrender.com`

---

## 🚨 PROBLEMAS COMUNES

### "CORS Error"
- Asegúrate de agregar tu dominio Vercel en el CORS del backend
- Redeploy el backend después de hacer cambios en CORS

### "Cannot find API"
- Verifica que `VITE_API_BASE_URL` esté correctamente configurado en Vercel
- Comprueba que la URL del backend en Vercel esté activa

### "Timeout on Render"
- El plan Free de Render se duerme después de 15 minutos de inactividad
- Para activar, visita el sitio o configura uptime checks

---

## 📝 RESUMEN DE URLS

Después del despliegue, tendrás:
- **Frontend:** `https://tu-frontend.vercel.app`
- **Backend API:** `https://tu-backend-xxxx.onrender.com/api`
- **MongoDB:** `mongodb+srv://...` (en la nube)

¡Listo para producción! 🚀
