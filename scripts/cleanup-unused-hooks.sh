#!/bin/bash

# 🧹 Script de limpieza de hooks no utilizados
# Basado en análisis exhaustivo de uso real

echo "🚀 Iniciando limpieza de hooks no utilizados..."
echo "📊 Total a eliminar: ~3 hooks (37.5% de reducción)"
echo ""

deleted=0

# ===================================
# HOOKS NO UTILIZADOS
# ===================================
echo "🎣 Eliminando hooks no utilizados..."

# Hooks específicos de coach no usados por cliente
rm -f hooks/use-coach-availability.ts 2>/dev/null && deleted=$((deleted + 1))
rm -f hooks/use-coach-clients.ts 2>/dev/null && deleted=$((deleted + 1))

# Hook de coach storage solo se usa para verificar nivel, no para clientes
# Mantener porque es usado en auth-context

echo "✅ Hooks eliminados: $deleted"

echo ""
echo "✅ Limpieza de hooks completada!"
echo "📊 Total hooks eliminados: $deleted"
echo ""
echo "🔍 Verificando estructura..."
echo "Hooks TS restantes:"
find hooks -name "*.ts" -o -name "*.tsx" | wc -l

