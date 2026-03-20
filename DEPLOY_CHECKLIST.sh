#!/bin/bash
# Script de Despliegue Rápido - Cheat Sheet

echo "=== CHECKLIST DE DESPLIEGUE ===" 

echo ""
echo "1️⃣ MongoDB Atlas"
echo "   ✓ Ir a https://www.mongodb.com/cloud/atlas"
echo "   ✓ Copiar Connection String"
echo "   ✓ Reemplazar en backend/.env"

echo ""
echo "2️⃣ Backend en Render"
echo "   ✓ Ir a https://render.com"
echo "   ✓ Crear Web Service"
echo "   ✓ Conectar repositorio GitHub"
echo "   ✓ Build: npm install"
echo "   ✓ Start: npm start"
echo "   ✓ Env vars: MONGODB_URI, NODE_ENV"
echo "   ✓ Copiar URL final (ej: https://xxx.onrender.com)"

echo ""
echo "3️⃣ Actualizar Frontend"
echo "   ✓ En tool/.env:"
echo "       VITE_API_BASE_URL=https://xxx.onrender.com/api"

echo ""
echo "4️⃣ Frontend en Vercel"
echo "   ✓ Ir a https://vercel.com"
echo "   ✓ Importar repositorio GitHub"
echo "   ✓ Root: ./tool"
echo "   ✓ Build: npm run build"
echo "   ✓ Output: dist"
echo "   ✓ Env var: VITE_API_BASE_URL"

echo ""
echo "5️⃣ Git Push"
echo "   ✓ git add ."
echo "   ✓ git commit -m 'Deploy'"
echo "   ✓ git push origin main"

echo ""
echo "✅ ¡Listo! Tu aplicación está en la nube"
