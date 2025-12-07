#!/bin/bash

# Script para consultar las variables de Google desde Vercel
# Este script muestra las variables relacionadas con Google OAuth

echo "🔍 Consultando variables de Google desde Vercel..."
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "   Instálalo con: npm i -g vercel"
    exit 1
fi

# Verificar que estamos autenticados
if ! vercel whoami &> /dev/null; then
    echo "❌ No estás autenticado en Vercel CLI"
    echo "   Ejecuta: vercel login"
    exit 1
fi

echo "📥 Descargando variables de entorno desde Vercel..."
echo ""

# Descargar variables de entorno de producción
vercel env pull .env.vercel-google.tmp --environment=production --yes > /dev/null 2>&1

if [ ! -f .env.vercel-google.tmp ]; then
    echo "❌ No se pudo descargar las variables"
    echo "   Verifica que tengas acceso al proyecto en Vercel"
    exit 1
fi

echo "✅ Variables descargadas exitosamente"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📋 VARIABLES DE GOOGLE EN VERCEL (PRODUCCIÓN)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Función para mostrar variable de forma segura
show_var() {
    local var_name=$1
    local value=$(grep "^${var_name}=" .env.vercel-google.tmp 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ ! -z "$value" ]; then
        echo "✅ ${var_name}:"
        # Para secretos, mostrar solo una parte
        if [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"PRIVATE_KEY"* ]]; then
            local prefix="${value:0:10}"
            local suffix="${value: -10}"
            echo "   ${prefix}...${suffix} (oculto por seguridad)"
        else
            echo "   ${value}"
        fi
        echo ""
        return 0
    else
        echo "❌ ${var_name}: NO ENCONTRADA"
        echo ""
        return 1
    fi
}

# Verificar variables de Google
found_count=0

echo "🔑 Variables OAuth:"
echo ""
if show_var "GOOGLE_CLIENT_ID"; then
    found_count=$((found_count + 1))
fi

if show_var "GOOGLE_CLIENT_SECRET"; then
    found_count=$((found_count + 1))
fi

echo ""
echo "🔧 Variables de Service Account (Opcionales):"
echo ""
if show_var "GOOGLE_SA_EMAIL"; then
    found_count=$((found_count + 1))
fi

if show_var "GOOGLE_SA_PRIVATE_KEY"; then
    found_count=$((found_count + 1))
fi

echo ""
echo "🌐 Variables de Configuración:"
echo ""
if show_var "NEXT_PUBLIC_APP_URL"; then
    found_count=$((found_count + 1))
fi

if show_var "NEXT_PUBLIC_GOOGLE_REDIRECT_URI"; then
    found_count=$((found_count + 1))
fi

echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Resumen:"
echo "   Variables encontradas: ${found_count}"
echo ""

# Mostrar todas las variables que contienen "GOOGLE"
echo "🔍 Todas las variables relacionadas con Google:"
echo ""
grep -i "google" .env.vercel-google.tmp 2>/dev/null | cut -d'=' -f1 | sort -u | while read var; do
    echo "   - ${var}"
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Para copiar valores completos, puedes:"
echo "   1. Ver el archivo temporal: cat .env.vercel-google.tmp | grep GOOGLE"
echo "   2. O usar: vercel env pull .env.vercel-full.tmp --environment=production"
echo ""
echo "🧹 Limpiando archivo temporal..."
rm -f .env.vercel-google.tmp
echo "✅ Limpieza completada"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Copia los valores que necesites"
echo "   2. Agrégalos a tu .env.local"
echo "   3. Reinicia tu servidor de desarrollo"
echo ""


