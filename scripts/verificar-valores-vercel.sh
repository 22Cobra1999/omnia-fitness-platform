#!/bin/bash

# Script para verificar los valores reales de las credenciales de Mercado Pago en Vercel

echo "🔍 Verificando valores de credenciales de Mercado Pago en Vercel..."
echo ""

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado"
    exit 1
fi

# Descargar variables de entorno
echo "📥 Descargando variables de entorno..."
vercel env pull .env.vercel-check.tmp --environment=production --yes > /dev/null 2>&1

if [ ! -f .env.vercel-check.tmp ]; then
    echo "❌ No se pudo descargar las variables"
    exit 1
fi

echo "✅ Variables descargadas"
echo ""

# Verificar MERCADOPAGO_ACCESS_TOKEN
echo "🔑 MERCADOPAGO_ACCESS_TOKEN:"
TOKEN=$(grep "^MERCADOPAGO_ACCESS_TOKEN=" .env.vercel-check.tmp | cut -d'=' -f2- | tr -d '"')
if [ ! -z "$TOKEN" ]; then
    echo "   Valor: ${TOKEN:0:30}...${TOKEN: -20}"
    echo ""
    
    # Verificar tipo
    if echo "$TOKEN" | grep -q "8497664518687621"; then
        echo "   ✅ Tipo: PRUEBA (Test)"
        echo "   ✅ Correcto para compras de prueba"
    elif echo "$TOKEN" | grep -q "1806894141402209"; then
        echo "   ⚠️  Tipo: PRODUCCIÓN"
        echo "   ⚠️  Procesa pagos REALES"
    else
        echo "   ❓ Tipo: Desconocido"
    fi
else
    echo "   ❌ No encontrada"
fi
echo ""

# Verificar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
echo "🔑 NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY:"
PUBLIC_KEY=$(grep "^NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=" .env.vercel-check.tmp | cut -d'=' -f2- | tr -d '"')
if [ ! -z "$PUBLIC_KEY" ]; then
    echo "   Valor: $PUBLIC_KEY"
    echo ""
    
    # Verificar tipo
    if echo "$PUBLIC_KEY" | grep -q "f5589935-8dea-4963-af32-b0f57a9ad7fb"; then
        echo "   ✅ Tipo: PRUEBA (Test)"
        echo "   ✅ Correcto para compras de prueba"
    elif echo "$PUBLIC_KEY" | grep -q "9ed1ca79-fa3c-4328-9b09-eee5dea88a8e"; then
        echo "   ⚠️  Tipo: PRODUCCIÓN"
        echo "   ⚠️  Procesa pagos REALES"
    else
        echo "   ❓ Tipo: Desconocido"
    fi
else
    echo "   ❌ No encontrada"
fi
echo ""

# Verificar otras variables importantes
echo "📋 Otras variables de Mercado Pago:"
grep -E "^MERCADOPAGO_|^NEXT_PUBLIC_MERCADOPAGO_|^NEXT_PUBLIC_APP_URL" .env.vercel-check.tmp | grep -v "ACCESS_TOKEN\|PUBLIC_KEY" | while IFS='=' read -r key value; do
    echo "   ✅ $key: Configurada"
done
echo ""

# Limpiar
rm -f .env.vercel-check.tmp

echo "✅ Verificación completada"
echo ""
echo "💡 Para actualizar las credenciales:"
echo "   ./scripts/update-mercadopago-credentials.sh (para prueba)"
echo "   ./scripts/update-mercadopago-credentials-prod.sh (para producción)"

