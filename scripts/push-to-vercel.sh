#!/bin/bash

# Script para hacer push y trigger deploy en Vercel

echo "🚀 Iniciando push a GitHub para trigger deploy en Vercel..."

cd "$(dirname "$0")/.."

# Verificar que estamos en la rama main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Error: No estás en la rama main. Estás en: $current_branch"
    exit 1
fi

# Verificar si hay commits pendientes
ahead=$(git rev-list --count origin/main..HEAD)
if [ "$ahead" -eq 0 ]; then
    echo "✅ No hay commits pendientes de push"
    exit 0
fi

echo "📦 Hay $ahead commit(s) pendiente(s) de push"

# Mostrar los commits que se van a pushear
echo ""
echo "📝 Commits a pushear:"
git log origin/main..HEAD --oneline

echo ""
echo "🔄 Haciendo push a origin/main..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push exitoso!"
    echo "🔗 Vercel debería detectar los cambios automáticamente"
    echo "📊 Revisa el deploy en: https://vercel.com/dashboard"
else
    echo ""
    echo "❌ Error al hacer push"
    echo "💡 Intenta ejecutar manualmente: git push origin main"
    exit 1
fi
