#!/bin/bash

# Script para actualizar variables de entorno en Vercel para modo prueba
# Este script actualiza las variables críticas para modo prueba

echo "🔧 Actualizando variables de entorno en Vercel para MODO PRUEBA..."
echo ""

# Función para actualizar variable
update_var() {
    local var_name=$1
    local var_value=$2
    
    echo "📝 Actualizando $var_name..."
    echo "$var_value" | vercel env update "$var_name" production <<< "y"
    
    if [ $? -eq 0 ]; then
        echo "✅ $var_name actualizada exitosamente"
    else
        echo "⚠️  Error actualizando $var_name (puede requerir confirmación manual)"
    fi
    echo ""
}

# Actualizar variables críticas para modo prueba
update_var "MERCADOPAGO_ACCESS_TOKEN" "TEST-1806894141402209-111615-607774a8d606f9a7200dc2e23b8e7b4d-143028270"
update_var "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY" "TEST-cc6d31a8-ff84-4644-98dd-e05c6740d95e"
update_var "NEXT_PUBLIC_APP_URL" "https://omnia-app.vercel.app"
update_var "NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI" "https://omnia-app.vercel.app/api/mercadopago/oauth/callback"

echo "✅ Actualización completada"
echo ""
echo "📋 Verificando variables configuradas:"
vercel env ls production | grep -E "MERCADOPAGO|NEXT_PUBLIC_APP_URL" | head -6

