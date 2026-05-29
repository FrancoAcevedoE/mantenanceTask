#!/bin/bash

echo "🔍 Verificando configuración local..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check MongoDB
echo "1️⃣  Verificando MongoDB..."
if command -v mongosh &> /dev/null; then
    echo -e "${GREEN}✓${NC} mongosh instalado"
    if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} MongoDB está corriendo"
    else
        echo -e "${RED}✗${NC} MongoDB NO está corriendo"
        echo "   Inicia con: brew services start mongodb-community"
    fi
else
    echo -e "${YELLOW}⚠${NC}  mongosh no encontrado. Instala MongoDB:"
    echo "   brew tap mongodb/brew && brew install mongodb-community"
fi

echo ""
echo "2️⃣  Verificando Backend .env..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env existe"
    if grep -q "JWT_SECRET" backend/.env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET está configurado"
    else
        echo -e "${RED}✗${NC} JWT_SECRET falta en backend/.env"
    fi
    if grep -q "MONGODB_URI" backend/.env; then
        echo -e "${GREEN}✓${NC} MONGODB_URI está configurado"
    fi
else
    echo -e "${YELLOW}⚠${NC}  backend/.env no existe"
fi

echo ""
echo "3️⃣  Verificando Frontend .env.local..."
if [ -f "tool/.env.local" ]; then
    echo -e "${GREEN}✓${NC} tool/.env.local existe"
    if grep -q "VITE_API_BASE_URL" tool/.env.local; then
        API_URL=$(grep "VITE_API_BASE_URL" tool/.env.local | cut -d'=' -f2)
        echo -e "${GREEN}✓${NC} VITE_API_BASE_URL = $API_URL"
    fi
else
    echo -e "${YELLOW}⚠${NC}  tool/.env.local no existe"
fi

echo ""
echo "4️⃣  Verificando puertos..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠${NC}  Puerto 3000 está en uso (backend podría estar corriendo)"
else
    echo -e "${GREEN}✓${NC} Puerto 3000 disponible"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠${NC}  Puerto 5173 está en uso (frontend podría estar corriendo)"
else
    echo -e "${GREEN}✓${NC} Puerto 5173 disponible"
fi

echo ""
echo "5️⃣  Verificando salud del Backend..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3000/api/health)
    echo -e "${GREEN}✓${NC} Backend está respondiendo"
    echo "   Respuesta: $HEALTH"
else
    echo -e "${RED}✗${NC} Backend NO está respondiendo"
    echo "   Inicia el backend: cd backend && npm run dev"
fi

echo ""
echo "=========================================="
echo "📋 PRÓXIMOS PASOS:"
echo "=========================================="
echo ""
echo "1. Asegúrate que MongoDB esté corriendo:"
echo "   brew services start mongodb-community"
echo ""
echo "2. Inicia el Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. En otra terminal, inicia el Frontend:"
echo "   cd tool && npm run dev"
echo ""
echo "4. Abre http://localhost:5173 en el navegador"
echo ""
echo "5. Inicia sesión con:"
echo "   DNI: 40317809"
echo "   Contraseña: 3121"
echo ""
