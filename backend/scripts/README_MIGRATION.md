# 🔄 Migración: machinePart a Array (Múltiples Partes)

## Descripción del cambio
Se cambió el modelo de datos para permitir seleccionar **múltiples partes de máquina** en un mismo trabajo de mantenimiento. Anteriormente, `machinePart` era un string único; ahora es un array de strings.

## Cambios realizados

### Backend
- **Modelo** (`mantenanceModels.js`): `machinePart: String` → `machinePart: [String]`
- **Controlador** (`mantenanceController.js`): Validación actualizada para soportar arrays
- **Base de datos**: Todos los documents existentes se migran automáticamente

### Frontend
- **newMantenance.vue**: Interfaz mejorada con chips para múltiples partes
- **historyView.vue**: Muestra correctamente partes como lista

## Pasos para ejecutar la migración

### 1️⃣ Asegurar que el backend esté actualizado
```bash
cd backend
npm install  # Por si hay dependencias nuevas
```

### 2️⃣ Ejecutar el script de migración
```bash
node scripts/migrateMachinePartToArray.js
```

### Qué hace el script
✅ Conecta a MongoDB
✅ Verifica documentos con `machinePart` en formato string
✅ Convierte automáticamente `"Parte1"` → `["Parte1"]`
✅ Deja `null` o vacíos como arrays vacíos `[]`
✅ Muestra estadísticas antes y después
✅ Verifica que la migración fue exitosa

### Ejemplo de salida
```
🔄 Iniciando migración de machinePart a array...
✅ Conectado a MongoDB

📊 Estadísticas iniciales:
   Total de documentos: 245
   Con machinePart string: 245
   Con machinePart array: 0

✅ Migración completada:
   Documentos modificados: 245
   Documentos sin cambios: 0

📊 Estadísticas finales:
   Con machinePart string: 0
   Con machinePart array: 245

✅ ¡Migración exitosa! Todos los documentos tienen el formato correcto.

✅ Desconectado de MongoDB
```

## Seguridad de la migración

✅ **No destructiva**: No elimina datos, solo convierte el formato
✅ **Idempotente**: Puedes ejecutarla múltiples veces sin problemas
✅ **Validada**: Chequea antes y después del cambio
✅ **Reversible**: Los datos siguen siendo recuperables

## Rollback (si es necesario)

Si necesitas revertir (aunque no es recomendado):
```javascript
// En MongoDB directamente:
db.maintenances.updateMany(
  { machinePart: { $type: "array" } },
  [{ $set: { machinePart: { $arrayElemAt: ["$machinePart", 0] } } }]
)
```

## Testing

Después de la migración, verifica:
1. Ver histórico de mantenimientos ✅
2. Crear nuevo mantenimiento con 1 parte ✅
3. Crear nuevo mantenimiento con múltiples partes ✅
4. Editar mantenimiento existente ✅

## Soporte

Si encuentras problemas:
1. Revisa los logs en la consola
2. Verifica que MONGO_URI está correctamente configurado en `.env`
3. Asegúrate de que MongoDB está funcionando
4. Contacta al desarrollador si persisten los problemas
