# 📸 Guía Visual: Configurar Web Push en Render

## 🎯 Objetivo
Agregar las variables de entorno `WEB_PUSH_PUBLIC_KEY` y `WEB_PUSH_PRIVATE_KEY` a tu servicio en Render.

---

## Las Claves (copia estas)

```
WEB_PUSH_PUBLIC_KEY
BGWxslRM9p1BMlnWE4MGqp4qNB6VYzUBBsddHVbo37cBgiZrIujZI1kg1WiP9McKe9GQsw6TwBBhR77lvW_hjLY

WEB_PUSH_PRIVATE_KEY
sCn0QRUJki7HmNQfadIbDJ1JtsyU0Y3kt16tRnagzMA

WEB_PUSH_SUBJECT
mailto:admin@mantenance.app
```

---

## Pasos en Render.com

### 1️⃣ Abre Render Dashboard
- Ve a: https://dashboard.render.com
- Asegúrate de estar logeado con tu cuenta

### 2️⃣ Busca tu servicio backend
- Haz click en "mantenancedb-backend" (o tu nombre de servicio)

### 3️⃣ Ve a Environment
```
En el menú lateral:
Servicios → mantenancedb-backend → Environment
```

### 4️⃣ Agrega las variables
Elige una de estas opciones:

#### ✏️ Opción A: Agregar manualmente (recomendado)

Haz clic en "Add Environment Variable"

Para **WEB_PUSH_PUBLIC_KEY**:
```
Key:   WEB_PUSH_PUBLIC_KEY
Value: BGWxslRM9p1BMlnWE4MGqp4qNB6VYzUBBsddHVbo37cBgiZrIujZI1kg1WiP9McKe9GQsw6TwBBhR77lvW_hjLY
```

Para **WEB_PUSH_PRIVATE_KEY**:
```
Key:   WEB_PUSH_PRIVATE_KEY
Value: sCn0QRUJki7HmNQfadIbDJ1JtsyU0Y3kt16tRnagzMA
```

Para **WEB_PUSH_SUBJECT**:
```
Key:   WEB_PUSH_SUBJECT
Value: mailto:admin@mantenance.app
```

#### 📋 Opción B: Copiar/Pegar todo junto (alternativa)

En el campo de texto de Render, pega:
```
WEB_PUSH_PUBLIC_KEY=BGWxslRM9p1BMlnWE4MGqp4qNB6VYzUBBsddHVbo37cBgiZrIujZI1kg1WiP9McKe9GQsw6TwBBhR77lvW_hjLY
WEB_PUSH_PRIVATE_KEY=sCn0QRUJki7HmNQfadIbDJ1JtsyU0Y3kt16tRnagzMA
WEB_PUSH_SUBJECT=mailto:admin@mantenance.app
```

### 5️⃣ Guarda los cambios
- Haz clic en "Save Environment Variables"
- Render te pedirá confirmación

### 6️⃣ Espera el redeploy
- El servicio se redeployará automáticamente
- Espera a ver "✓ Live" en verde (2-3 minutos)

---

## ✅ Verificar que Funcionó

### En tu navegador:
1. Abre la app: https://mantenancedb-frontend.onrender.com (o tu URL)
2. Abre DevTools (F12)
3. Ve a Console
4. **Si NO ves el error "Push web no configurado"**, ¡funcionó! ✅

### En Mobile:
1. Abre la app en tu móvil
2. Presiona para instalar como PWA ("Agregar a pantalla de inicio")
3. Abre la app instalada
4. Debería pedir permiso para notificaciones
5. Acepta el permiso
6. Cierra la app completamente
7. Las notificaciones push ahora funcionarán

---

## 🆘 Si Algo Sale Mal

### Error: "Las variables no se guardan"
- Asegúrate de hacer clic en el botón "Save"
- Espera a que termine el redeploy (verde)

### Error: "Sigue diciendo Push no configurado"
1. Ve a Render Logs y revisa los últimos logs
2. Busca la línea `[dotenv] injecting env` 
3. Debe mostrar las 3 variables que configuraste

### El Service Worker no aparece en DevTools
1. Va a Application → Service Workers
2. Si no hay nada activo, tu PWA no se instaló correctamente
3. Desinstala la PWA e instálala nuevamente

---

## 📞 Tutorial Rápido para Render

Si Render es muy nuevo para ti:

1. Render = plataforma similar a Heroku
2. "Environment Variables" = variables como en tu `.env` local
3. Cuando agregas variables, Render automáticamente redeploya tu app
4. El redeploy toma 2-5 minutos

---

## 💾 Respaldo de Claves

Copia y guarda estas claves en un lugar seguro (notas privadas, gestor de contraseñas):

```
Público: BGWxslRM9p1BMlnWE4MGqp4qNB6VYzUBBsddHVbo37cBgiZrIujZI1kg1WiP9McKe9GQsw6TwBBhR77lvW_hjLY
Privado: sCn0QRUJki7HmNQfadIbDJ1JtsyU0Y3kt16tRnagzMA
```

**Si pierdes la clave privada, necesitas generar nuevas claves ejecutando:**
```bash
node scripts/generateVapidKeys.js
```

---

**¡Listo! Después de estos pasos, las notificaciones push deberían funcionar.** 🎉
