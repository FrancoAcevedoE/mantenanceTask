#!/bin/bash

echo "🔍 DEBUG - Verificando errores de Login 500"
echo ""
echo "=========================================="
echo "1️⃣  Verificando MongoDB"
echo "=========================================="

# Check if MongoDB is running
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ MongoDB está corriendo"

    # Check if database exists
    DB_RESULT=$(mongosh --eval "use mantenanceDB; db.getName()" 2>&1)
    echo "✓ Base de datos: $DB_RESULT"

    # Check if admin user exists
    ADMIN_COUNT=$(mongosh --eval "use mantenanceDB; db.users.countDocuments({dni: 40317809})" 2>&1)
    echo "✓ Admin user encontrado: $ADMIN_COUNT"

    if [ "$ADMIN_COUNT" = "0" ]; then
        echo ""
        echo "⚠️  ADMIN USER NO ENCONTRADO - CREANDO..."
        mongosh --eval "use mantenanceDB; db.users.insertOne({
            name: 'Franco Acevedo',
            dni: 40317809,
            password: 3121,
            role: 'admin',
            isDeleted: false,
            deletedAt: null,
            deletedBy: ''
        })"
        echo "✓ Admin user creado"
    fi

    # Show all users
    echo ""
    echo "📋 Usuarios en la BD:"
    mongosh --eval "use mantenanceDB; db.users.find({}, {name: 1, dni: 1, role: 1})"
else
    echo "✗ MongoDB NO está corriendo"
    echo ""
    echo "Para iniciar MongoDB en macOS:"
    echo "  brew services start mongodb-community"
    exit 1
fi

echo ""
echo "=========================================="
echo "2️⃣  Verificando Backend"
echo "=========================================="

# Check if backend is running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Backend está respondiendo"

    HEALTH=$(curl -s http://localhost:3000/api/health)
    echo "  Response: $HEALTH"
else
    echo "✗ Backend NO está respondiendo"
    echo ""
    echo "Para iniciar el backend:"
    echo "  cd backend && npm run dev"
    exit 1
fi

echo ""
echo "=========================================="
echo "3️⃣  Probando Login"
echo "=========================================="

echo "Enviando solicitud de login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "40317809",
    "password": "3121"
  }')

echo "Respuesta: $LOGIN_RESPONSE"

# Check if token is in response
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✓ Login exitoso - Token recibido"
else
    echo "✗ Login fallido"
    echo ""
    echo "📋 Verificaciones adicionales:"
    echo "1. Revisa los logs del backend (terminal donde corre npm run dev)"
    echo "2. Busca errores como:"
    echo "   - Connection refused (MongoDB no está corriendo)"
    echo "   - validation error (problema con el modelo)"
    echo "   - Otro error específico"
fi

echo ""
echo "=========================================="
echo "✅ DEBUG COMPLETADO"
echo "=========================================="
echo ""
echo "Si ves errores, copia el mensaje de error exacto"
echo "de la terminal del backend y verifica:"
echo ""
echo "1. ¿MongoDB está corriendo?"
echo "   mongosh"
echo ""
echo "2. ¿El backend tiene permisos a MongoDB?"
echo "   Verifica MONGODB_URI en backend/.env"
echo ""
echo "3. ¿El .env tiene las variables correctas?"
echo "   cat backend/.env"
