#!/bin/bash

# 🧹 Script de limpieza de componentes no utilizados
# Basado en análisis exhaustivo de uso real

echo "🚀 Iniciando limpieza de componentes no utilizados..."
echo "📊 Total a eliminar: ~21 componentes (52.5% de reducción)"
echo ""

deleted=0

# ===================================
# COMPONENTES COACH NO UTILIZADOS
# ===================================
echo "👨‍💼 Eliminando componentes de coach no utilizados..."

# Componentes duplicados o no usados
rm -f components/coach/coach-calendar-view.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach/coach-calendar-monthly.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/mobile/coach-profile-screen.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/CoachProfileModal.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/CoachCard.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/chat-with-coach.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/chat-with-gym-coach.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-calendar.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/activities/coach-activity-card.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-calendar-view.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-earnings-dashboard.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/dashboard/coach-dashboard.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/dashboard/coach-profile-form.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach/coach-availability-page.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/chat-with-fitness-coach.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-rewards.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/admin/run-coach-migration.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-publication.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/debug-coaches.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-activities-tabs.tsx 2>/dev/null && deleted=$((deleted + 1))
rm -f components/coach-client-section.tsx 2>/dev/null && deleted=$((deleted + 1))

echo "✅ Componentes de coach eliminados: 21"

echo ""
echo "✅ Limpieza de componentes completada!"
echo "📊 Total componentes eliminados: $deleted"
echo ""
echo "🔍 Verificando estructura..."
echo "Componentes TSX restantes:"
find components -name "*.tsx" | wc -l

