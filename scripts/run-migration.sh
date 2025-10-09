#!/bin/bash

# ============================================
# Script de Migración de Storage
# Ejecuta la migración de archivos a estructura por coach
# ============================================

echo "🚀 MIGRACIÓN DE STORAGE - Organización por Coach"
echo "================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar variables de entorno
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Variables de entorno no detectadas, cargando desde .env.local..."
    
    if [ -f ".env.local" ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
        echo "✅ Variables cargadas desde .env.local"
    else
        echo "❌ Error: Archivo .env.local no encontrado"
        echo "   Crea el archivo con:"
        echo "   NEXT_PUBLIC_SUPABASE_URL=tu_url"
        echo "   SUPABASE_SERVICE_ROLE_KEY=tu_service_key"
        exit 1
    fi
fi

echo ""
echo "📋 Opciones:"
echo "  1) Simulación (DRY RUN) - Ver qué se movería sin mover nada"
echo "  2) Migración Real - Mover archivos permanentemente"
echo "  3) Cancelar"
echo ""
read -p "Selecciona una opción (1-3): " option

case $option in
    1)
        echo ""
        echo "🔍 Ejecutando SIMULACIÓN..."
        echo "─────────────────────────────────────────────────"
        DRY_RUN=true npx tsx scripts/migrate-storage-to-coach-folders.ts
        ;;
    2)
        echo ""
        echo "⚠️  ADVERTENCIA: Esto moverá archivos permanentemente"
        read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirm
        
        if [ "$confirm" = "SI" ]; then
            echo ""
            echo "🚀 Ejecutando MIGRACIÓN REAL..."
            echo "─────────────────────────────────────────────────"
            DRY_RUN=false npx tsx scripts/migrate-storage-to-coach-folders.ts
        else
            echo "❌ Migración cancelada"
            exit 0
        fi
        ;;
    3)
        echo "❌ Operación cancelada"
        exit 0
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Script completado"





