#!/bin/bash

# Script para configurar variables de entorno en Vercel para modo prueba
# IMPORTANTE: Este script usa Vercel CLI, pero algunas variables pueden requerir configuración manual

echo "🔧 Configurando variables de entorno en Vercel para MODO PRUEBA..."
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "   Instálalo con: npm i -g vercel"
    exit 1
fi

# Variables de entorno para modo prueba
declare -A ENV_VARS=(
    ["MERCADOPAGO_ACCESS_TOKEN"]="TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270"
    ["NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"]="TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e"
    ["MERCADOPAGO_CLIENT_ID"]="1806894141402209"
    ["MERCADOPAGO_CLIENT_SECRET"]="7dtInztF6aQwAGQCfWk2XGdMbWBd54QS"
    ["NEXT_PUBLIC_APP_URL"]="https://omnia-app.vercel.app"
    ["NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI"]="https://omnia-app.vercel.app/api/mercadopago/oauth/callback"
    ["ENCRYPTION_KEY"]="1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4"
)

echo "📋 Variables a configurar:"
for var in "${!ENV_VARS[@]}"; do
    echo "  - $var"
done
echo ""

# Confirmar antes de continuar
read -p "¿Deseas configurar estas variables en Vercel? (s/n): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

# Configurar cada variable
for var in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$var]}"
    echo "🔧 Configurando $var..."
    
    # Verificar si la variable ya existe
    if vercel env ls production 2>/dev/null | grep -q "^[[:space:]]*$var[[:space:]]"; then
        echo "   ⚠️  Variable ya existe, actualizando..."
        echo "$value" | vercel env update "$var" production
    else
        echo "   ➕ Agregando nueva variable..."
        echo "$value" | vercel env add "$var" production
    fi
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $var configurada exitosamente"
    else
        echo "   ❌ Error configurando $var"
        echo "   💡 Intenta configurarla manualmente en Vercel Dashboard"
    fi
    echo ""
done

echo "✅ Configuración completada"
echo ""
echo "📋 Verificación:"
vercel env ls production | grep -E "MERCADOPAGO|NEXT_PUBLIC_APP_URL|ENCRYPTION_KEY"

