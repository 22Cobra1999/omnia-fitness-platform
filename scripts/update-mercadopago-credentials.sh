#!/bin/bash

# Script para actualizar credenciales de Mercado Pago en Vercel
# Credenciales actualizadas: Enero 2025 - Argentina

echo "🔧 Actualizando credenciales de Mercado Pago en Vercel..."
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "   Instálalo con: npm i -g vercel"
    exit 1
fi

echo "📋 Variables a actualizar:"
echo "  - MERCADOPAGO_ACCESS_TOKEN"
echo "  - NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"
echo "  - NEXT_PUBLIC_APP_URL"
echo "  - NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI"
echo "  - ENCRYPTION_KEY"
echo ""

# Confirmar antes de continuar
read -p "¿Deseas actualizar estas variables en Vercel? (s/n): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

# Actualizar MERCADOPAGO_ACCESS_TOKEN
echo "🔧 Actualizando MERCADOPAGO_ACCESS_TOKEN..."
vercel env rm MERCADOPAGO_ACCESS_TOKEN production --yes 2>/dev/null
echo "APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181" | vercel env add MERCADOPAGO_ACCESS_TOKEN production
echo ""

# Actualizar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
echo "🔧 Actualizando NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY..."
vercel env rm NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY production --yes 2>/dev/null
echo "APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb" | vercel env add NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY production
echo ""

# Actualizar NEXT_PUBLIC_APP_URL
echo "🔧 Actualizando NEXT_PUBLIC_APP_URL..."
vercel env rm NEXT_PUBLIC_APP_URL production --yes 2>/dev/null
echo "https://omnia-app.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
echo ""

# Actualizar NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI
echo "🔧 Actualizando NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI..."
vercel env rm NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI production --yes 2>/dev/null
echo "https://omnia-app.vercel.app/api/mercadopago/oauth/callback" | vercel env add NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI production
echo ""

# Actualizar ENCRYPTION_KEY
echo "🔧 Actualizando ENCRYPTION_KEY..."
vercel env rm ENCRYPTION_KEY production --yes 2>/dev/null
echo "1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4" | vercel env add ENCRYPTION_KEY production
echo ""

echo "✅ Actualización completada"
echo ""
echo "📋 Verificación:"
vercel env ls production | grep -E "MERCADOPAGO|NEXT_PUBLIC_APP_URL|ENCRYPTION_KEY"
