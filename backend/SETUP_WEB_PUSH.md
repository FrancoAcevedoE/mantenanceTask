# 🔧 Configurar Web Push Notifications en Render

## ❌ Problema Actual

```
Error: Push web no configurado en el servidor
```

**Causa:** Las variables de entorno `WEB_PUSH_PUBLIC_KEY` y `WEB_PUSH_PRIVATE_KEY` no están configuradas en Render.

---

## ✅ Solución: Configurar Variables en Render

### Paso 1: Obtener las claves VAPID

Ya están generadas en el script `scripts/generateVapidKeys.js`:

```
WEB_PUSH_PUBLIC_KEY=BGWxslRM9p1BMlnWE4MGqp4qNB6VYzUBBsddHVbo37cBgiZrIujZI1kg1WiP9McKe9GQsw6TwBBhR77lvW_hjLY
WEB_PUSH_PRIVATE_KEY=sCn0QRUJki7HmNQfadIbDJ1JtsyU0Y3kt16tRnagzMA
WEB_PUSH_SUBJECT=mailto:admin@mantenance.app
```

### Paso 2: Configurar en Render.com

1. **Abre tu dashboard de Render:** https://dashboard.render.com
2. **Selecciona el servicio backend:** `mantenancedb-backend`
3. **Ve a la sección "Environment"**
4. **Agrega estas 3 variables de entorno:**

   | Key | Value |
   |-----|-------|
   | `WEB_PUSH_PUBLIC_KEY` | `BGWxslRM9p1BMlnWE4MGqp4qNB6VYzUBBsddHVbo37cBgiZrIujZI1kg1WiP9McKe9GQsw6TwBBhR77lvW_hjLY` |
   | `WEB_PUSH_PRIVATE_KEY` | `sCn0QRUJki7HmNQfadIbDJ1JtsyU0Y3kt16tRnagzMA` |
   | `WEB_PUSH_SUBJECT` | `mailto:admin@mantenance.app` |

5. **Haz click en "Save"**
6. **Render hará un redeploy automático** (espera 2-3 minutos)

### Paso 3: Verificar que funcionó

Una vez redeployado, intenta:

1. En el navegador: vuelve a la app y revisa si el botón de notificaciones funcionaactualmente ahora

2. En mobile (PWA): cierra la app completamente y envía una notificación desde el backend

---

## 📱 Para Notificaciones Push en Mobile (PWA)

Además de configurar las variables, asegúrate de:

1. **Instalar la PWA en tu dispositivo** (agregar a pantalla principal)
2. **Dar permiso de notificaciones** cuando se solicite
3. **Cerrar la app completamente** antes de enviar notificaciones
4. **El Service Worker debe estar registrado** (revisa en DevTools → Application → Service Workers)

---

## 🔍 Cómo Probar

### En navegador (web):
```bash
# 1. Abre la DevTools
# 2. Ve a Application → Service Workers
# 3. Verifica que haya un Service Worker activo
# 4. Revisa Application → Manifest
# 5. Intenta habilitar notificaciones en Settings
```

### En mobile:
```bash
# 1. Instala la PWA ("Agregar a pantalla de inicio")
# 2. Abre la app
# 3. Acepta el permiso de notificaciones
# 4. Cierra la app completamente
# 5. Desde backend, envía una notificación push
```

---

## 🛠 Si Algo Sigue Sin Funcionar

1. **Revisa los logs en Render:**
   ```
   Dashboard → Logs
   ```
   Busca errores relacionados a "push" o "notification"

2. **Verifica que el Service Worker está registrado:**
   - Abre DevTools (F12)
   - Application → Service Workers
   - Debería ver tu Service Worker activo

3. **Regenera las claves si es necesario:**
   ```bash
   cd backend
   node scripts/generateVapidKeys.js
   ```
   Y repite los pasos anteriores con las nuevas claves

---

## 📌 Notas de Seguridad

- ⚠️ **NUNCA** compartas la `WEB_PUSH_PRIVATE_KEY` públicamente
- Las claves están vinculadas a tu servidor
- Si pierdes la clave privada, tendrás que generar nuevas claves y reconfigurar

---

## ✨ Resultado Esperado

Después de configurar:

✅ Web: Botón de notificaciones funcional  
✅ Mobile: Notificaciones push incluso con la app cerrada  
✅ Backend: Puede enviar notificaciones a todos los clientes suscritos
