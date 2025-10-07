#!/bin/bash

# Script para reiniciar el servidor de desarrollo y limpiar cache

echo "🔄 Reiniciando servidor de desarrollo..."

# Matar procesos en puertos 3000 y 3001
echo "🛑 Deteniendo procesos en puertos 3000 y 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Limpiar cache de Next.js
echo "🧹 Limpiando cache de Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Esperar un momento
sleep 2

# Iniciar servidor en puerto 3000
echo "🚀 Iniciando servidor en puerto 3000..."
npm run dev

echo "✅ Servidor reiniciado. Abre http://localhost:3000 en tu navegador"
