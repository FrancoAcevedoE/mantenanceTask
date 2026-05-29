# Configuración Local - Resolución de Errores 401 y 500

## Pasos para ejecutar en local

### 1. **Backend - Requisitos Previos**

#### Instalación de MongoDB
```bash
# macOS con Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community
```

#### Verificar que MongoDB esté corriendo
```bash
# Conectar a MongoDB
mongosh

# Dentro de mongosh
show dbs
exit
```

### 2. **Backend - Configuración**

El archivo `.env` ya está creado en `backend/.env` con los valores por defecto para local.

#### Variables de entorno (backend/.env)
```
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/mantenanceDB
JWT_SECRET=your-secret-key-local-dev
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

### 3. **Backend - Iniciar Servidor**

```bash
cd backend
npm install  # Si no lo has hecho
npm run dev  # Inicia con nodemon

# Esperado en consola:
# [server] startup begin
# [server] dotenv loaded
# [server] imported routes and models
# Mongo conectado
# Admin inicial creado
# Servidor corriendo en 0.0.0.0:3000
```

### 4. **Verificar Salud del Backend**

```bash
curl http://localhost:3000/api/health

# Respuesta esperada:
# {"ok":true,"corsVersion":"v5-cors-middleware","mongoState":"connected"}
```

### 5. **Frontend - Configuración**

El archivo `.env.local` ya está configurado correctamente:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### 6. **Frontend - Iniciar Dev Server**

```bash
cd tool
npm install  # Si no lo has hecho
npm run dev

# Esperado en consola:
# ➜  local:   http://localhost:5173/
```

### 7. **Credenciales de Prueba**

Admin por defecto:
- **DNI**: 40317809
- **Contraseña**: 3121

### 8. **Resolución de Errores Específicos**

#### Error 401 - Token Inválido
**Causa**: Token no se genera correctamente o JWT_SECRET es inconsistente
**Solución**:
1. Verificar que el login retorna un token válido
2. Revisar que `JWT_SECRET` sea el mismo en:
   - `backend/.env`
   - `backend/middlewares/authMiddleware.js` (línea 3)
   - `backend/controllers/userController.js` (línea 11)

#### Error 500 - Error Interno del Servidor
**Causa**: Problemas de conexión con MongoDB o errores no capturados
**Solución**:
1. Revisar los logs en la terminal del backend
2. Verificar que MongoDB está corriendo: `brew services list`
3. Si MongoDB no está corriendo: `brew services start mongodb-community`
4. Limpiar la base de datos si hay corrupción: `mongo` → `use mantenanceDB` → `db.dropDatabase()`

#### Verificar Base de Datos

```bash
mongosh
use mantenanceDB
db.users.find()  # Debe mostrar al menos el admin creado
exit
```

## Puertos en Uso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **MongoDB**: 27017

## Logs Importantes

### Backend
```bash
# Esperado en startup:
[server] startup begin
[server] dotenv loaded
[server] imported routes and models
Mongo conectado
Admin inicial creado
Servidor corriendo en 0.0.0.0:3000
```

### Frontend
```bash
# Esperado en startup:
➜  local:   http://localhost:5173/
```

## Troubleshooting

### MongoDB no inicia
```bash
# Verificar estado
brew services list | grep mongodb

# Reiniciar
brew services restart mongodb-community

# Logs
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

### Puerto 3000 ya está en uso
```bash
# Encuentra qué está usando el puerto
lsof -i :3000

# Termina el proceso
kill -9 <PID>

# O cambia el PORT en backend/.env
PORT=3001
```

### CORS no permite la conexión
```bash
# Verificar que CORS_ORIGINS incluya tu frontend URL
# backend/.env debe tener:
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

## Flujo de Prueba Completo

1. ✅ Verificar MongoDB: `mongosh`
2. ✅ Iniciar Backend: `npm run dev` (desde backend/)
3. ✅ Verificar Health: `curl http://localhost:3000/api/health`
4. ✅ Iniciar Frontend: `npm run dev` (desde tool/)
5. ✅ Abrir http://localhost:5173
6. ✅ Login con DNI: 40317809, Contraseña: 3121
7. ✅ Verifica que el dashboard carga sin errores

Si no funciona, revisar los logs del backend para los mensajes de error específicos.
