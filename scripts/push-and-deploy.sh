#!/bin/bash

# Script para hacer push a GitHub y trigger deploy en Vercel

echo "🚀 Iniciando push y deploy..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar commits pendientes
COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")

if [ "$COMMITS_AHEAD" -eq "0" ]; then
    echo "✅ No hay commits pendientes de push."
    echo "   Todos los cambios ya están en GitHub."
else
    echo "📦 Encontrados $COMMITS_AHEAD commit(s) pendientes de push:"
    git log --oneline origin/main..HEAD
    echo ""
    
    echo "🔄 Haciendo push a GitHub..."
    if git push origin main; then
        echo "✅ Push exitoso a GitHub!"
        echo ""
        echo "📡 Vercel debería detectar los cambios automáticamente."
        echo "   Ve a https://vercel.com/dashboard para ver el deploy."
    else
        echo "❌ Error al hacer push."
        echo ""
        echo "💡 Opciones:"
        echo "   1. Verifica tus credenciales de GitHub"
        echo "   2. Intenta hacer push manualmente: git push origin main"
        echo "   3. O usa: git push origin main --force (solo si estás seguro)"
        exit 1
    fi
fi

# Intentar deploy manual con Vercel CLI si está disponible
if command -v vercel &> /dev/null; then
    echo ""
    echo "🔧 Vercel CLI detectado. ¿Deseas hacer un deploy manual? (s/n)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        echo "🚀 Iniciando deploy manual con Vercel..."
        vercel --prod
    else
        echo "⏭️  Saltando deploy manual. Vercel debería hacer deploy automático."
    fi
else
    echo ""
    echo "💡 Para hacer deploy manual, instala Vercel CLI:"
    echo "   npm i -g vercel"
    echo "   Luego ejecuta: vercel --prod"
fi

echo ""
echo "✅ Proceso completado!"
