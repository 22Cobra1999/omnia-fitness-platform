#!/bin/bash

# Script para actualizar credenciales de PRODUCCIÓN de Mercado Pago en Vercel
# ⚠️ ADVERTENCIA: Estas credenciales procesan pagos REALES

echo "⚠️  ADVERTENCIA: Estás a punto de configurar credenciales de PRODUCCIÓN"
echo "   Estas credenciales procesan pagos REALES"
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "   Instálalo con: npm i -g vercel"
    exit 1
fi

# Credenciales de PRODUCCIÓN
PROD_PUBLIC_KEY="APP_USR-9ed1ca79-fa3c-4328-9b09-eee5dea88a8e"
PROD_ACCESS_TOKEN="APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270"

echo "📋 Credenciales de PRODUCCIÓN a configurar:"
echo "   Public Key: $PROD_PUBLIC_KEY"
echo "   Access Token: ${PROD_ACCESS_TOKEN:0:30}..."
echo ""

# Confirmar
read -p "¿Estás seguro de que quieres configurar credenciales de PRODUCCIÓN? (escribe 'SI' para confirmar): " confirm
if [ "$confirm" != "SI" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "🔧 Actualizando credenciales de PRODUCCIÓN..."

# Actualizar MERCADOPAGO_ACCESS_TOKEN
echo "🔧 Actualizando MERCADOPAGO_ACCESS_TOKEN..."
vercel env rm MERCADOPAGO_ACCESS_TOKEN production --yes 2>/dev/null
echo "$PROD_ACCESS_TOKEN" | vercel env add MERCADOPAGO_ACCESS_TOKEN production
if [ $? -eq 0 ]; then
    echo "   ✅ MERCADOPAGO_ACCESS_TOKEN actualizado"
else
    echo "   ❌ Error actualizando MERCADOPAGO_ACCESS_TOKEN"
fi

echo ""

# Actualizar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
echo "🔧 Actualizando NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY..."
vercel env rm NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY production --yes 2>/dev/null
echo "$PROD_PUBLIC_KEY" | vercel env add NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY production
if [ $? -eq 0 ]; then
    echo "   ✅ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY actualizado"
else
    echo "   ❌ Error actualizando NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"
fi

echo ""
echo "✅ Credenciales de PRODUCCIÓN configuradas"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Estas credenciales procesan pagos REALES"
echo "   - Haz un nuevo deploy para aplicar los cambios"
echo "   - Verifica que todo funcione antes de usar en producción"
echo ""
echo "🚀 Para hacer deploy:"
echo "   git push origin main"
echo "   # O"
echo "   vercel --prod"

