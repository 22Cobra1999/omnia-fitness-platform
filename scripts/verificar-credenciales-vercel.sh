#!/bin/bash

# Script para verificar las credenciales de Mercado Pago en Vercel
# Este script muestra los valores actuales (sin exponerlos completamente por seguridad)

echo "🔍 Verificando credenciales de Mercado Pago en Vercel..."
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    echo "   Instálalo con: npm i -g vercel"
    exit 1
fi

echo "📋 Variables de Mercado Pago configuradas:"
echo ""

# Verificar MERCADOPAGO_ACCESS_TOKEN
echo "🔑 MERCADOPAGO_ACCESS_TOKEN:"
TOKEN=$(vercel env pull .env.vercel.tmp --environment=production 2>/dev/null | grep MERCADOPAGO_ACCESS_TOKEN | cut -d'=' -f2- | tr -d '"')
if [ ! -z "$TOKEN" ]; then
    # Mostrar solo los primeros y últimos caracteres por seguridad
    PREFIX=$(echo "$TOKEN" | cut -c1-20)
    SUFFIX=$(echo "$TOKEN" | rev | cut -c1-20 | rev)
    echo "   Valor: ${PREFIX}...${SUFFIX}"
    
    # Verificar si es de prueba o producción
    if echo "$TOKEN" | grep -q "8497664518687621"; then
        echo "   ✅ Tipo: PRUEBA (Test)"
    elif echo "$TOKEN" | grep -q "1806894141402209"; then
        echo "   ⚠️  Tipo: PRODUCCIÓN"
    else
        echo "   ❓ Tipo: Desconocido"
    fi
else
    echo "   ❌ No encontrada"
fi
echo ""

# Verificar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
echo "🔑 NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY:"
PUBLIC_KEY=$(vercel env pull .env.vercel.tmp --environment=production 2>/dev/null | grep NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY | cut -d'=' -f2- | tr -d '"')
if [ ! -z "$PUBLIC_KEY" ]; then
    echo "   Valor: $PUBLIC_KEY"
    
    # Verificar si es de prueba o producción
    if echo "$PUBLIC_KEY" | grep -q "f5589935-8dea-4963-af32-b0f57a9ad7fb"; then
        echo "   ✅ Tipo: PRUEBA (Test)"
    elif echo "$PUBLIC_KEY" | grep -q "9ed1ca79-fa3c-4328-9b09-eee5dea88a8e"; then
        echo "   ⚠️  Tipo: PRODUCCIÓN"
    else
        echo "   ❓ Tipo: Desconocido"
    fi
else
    echo "   ❌ No encontrada"
fi
echo ""

# Limpiar archivo temporal
rm -f .env.vercel.tmp

echo "✅ Verificación completada"
echo ""
echo "💡 Para actualizar las credenciales, usa:"
echo "   ./scripts/update-mercadopago-credentials.sh (para prueba)"
echo "   ./scripts/update-mercadopago-credentials-prod.sh (para producción)"

