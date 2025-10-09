#!/bin/bash

# 🧹 Script de limpieza de APIs no utilizadas
# Basado en análisis exhaustivo de uso real

echo "🚀 Iniciando limpieza de APIs no utilizadas..."
echo "📊 Total a eliminar: 63 APIs (80.8% de reducción)"
echo ""

# Contador
deleted=0

# ===================================
# APIs DE AUTENTICACIÓN NO USADAS (9)
# ===================================
echo "🔐 Eliminando APIs de autenticación no usadas..."
rm -rf app/api/auth/logout
rm -rf app/api/auth/login
rm -rf app/api/auth/verify-code
rm -rf app/api/auth/reset-password
rm -rf app/api/auth/me
rm -rf app/api/auth/register
rm -rf app/api/auth/setup
rm -rf app/api/auth/clear-cookies
rm -rf app/api/auth/session
deleted=$((deleted + 9))

# ===================================
# APIs DE ACTIVIDADES NO ACCEDIDAS (8)
# ===================================
echo "🎯 Eliminando APIs de actividades no usadas..."
rm -rf app/api/activities/\[id\]/route.ts
rm -rf app/api/activities/route.ts
rm -rf app/api/activities/\[id\]/rating
rm -rf app/api/activities/\[id\]/survey
rm -rf app/api/activities/sql-update
rm -rf app/api/activities/minimal-update
rm -rf app/api/activities/emergency-update
rm -rf app/api/activities/direct-update
deleted=$((deleted + 8))

# ===================================
# APIs DE PERFIL NO UTILIZADAS (7)
# ===================================
echo "👤 Eliminando APIs de perfil no usadas..."
rm -rf app/api/profile/update
rm -rf app/api/profile/user-profile
rm -rf app/api/profile/client
rm -rf app/api/profile/progress-records
rm -rf app/api/profile/exercises
rm -rf app/api/profile/\[id\]
rm -rf app/api/profile/route.ts
deleted=$((deleted + 7))

# ===================================
# APIs DE ENROLLMENTS NO USADAS (3)
# ===================================
echo "📋 Eliminando APIs de enrollments no usadas..."
rm -rf app/api/enrollments/direct
rm -rf app/api/enrollments/route.ts
rm -rf app/api/enrollments/\[id\]
deleted=$((deleted + 3))

# ===================================
# APIs DE COACHES NO ACCEDIDAS (10)
# ===================================
echo "👨‍💼 Eliminando APIs de coaches no usadas..."
rm -rf app/api/coaches/route.ts
rm -rf app/api/coaches/\[id\]/clients
rm -rf app/api/coach/stats
rm -rf app/api/coach/connect-instagram
rm -rf app/api/coach/upload-certification
rm -rf app/api/coach/instagram-callback
rm -rf app/api/coach/verify-whatsapp
rm -rf app/api/coach/availability
rm -rf app/api/coach/connect-linkedin
rm -rf app/api/search-coaches-optimized
deleted=$((deleted + 10))

# ===================================
# APIs DE CLIENTES NO USADAS (4)
# ===================================
echo "👥 Eliminando APIs de clientes no usadas..."
rm -rf app/api/clients
rm -rf app/api/coach/clients/\[id\]/todo
rm -rf app/api/coach/clients/\[id\]/route.ts
rm -rf app/api/coach-activities
deleted=$((deleted + 4))

# ===================================
# APIs DE PRODUCTOS NO ACCEDIDAS (2)
# ===================================
echo "📦 Eliminando APIs de productos no usadas..."
rm -rf app/api/product-statistics
rm -rf app/api/products/\[id\]
deleted=$((deleted + 2))

# ===================================
# APIs DE EJERCICIOS NO USADAS (2)
# ===================================
echo "💪 Eliminando APIs de ejercicios no usadas..."
rm -rf app/api/exercises
rm -rf app/api/taller-detalles
deleted=$((deleted + 2))

# ===================================
# APIs DE MENSAJES NO UTILIZADAS (1)
# ===================================
echo "💬 Eliminando APIs de mensajes no usadas..."
rm -rf app/api/messages/\[conversationId\]
rm -rf app/api/messages/create-conversations-for-enrollments
deleted=$((deleted + 2))

# ===================================
# APIs DE PROGRESO NO USADAS (2)
# ===================================
echo "📈 Eliminando APIs de progreso no usadas..."
rm -rf app/api/client-progress
rm -rf app/api/client-daily-activities
deleted=$((deleted + 2))

# ===================================
# APIs DE CALENDARIO NO ACCEDIDAS (1)
# ===================================
echo "📅 Eliminando APIs de calendario no usadas..."
rm -rf app/api/calendar-events
deleted=$((deleted + 1))

# ===================================
# APIs DE MEDIA NO USADAS (2)
# ===================================
echo "🖼️ Eliminando APIs de media no usadas..."
rm -rf app/api/activity-media
rm -rf app/api/upload-avatar
deleted=$((deleted + 2))

# ===================================
# APIs DE DELETE NO UTILIZADAS (1)
# ===================================
echo "🗑️ Eliminando APIs de delete no usadas..."
rm -rf app/api/delete-activity-final
deleted=$((deleted + 1))

# ===================================
# DIRECTORIOS DE AUTH VACÍOS
# ===================================
# Verificar si auth está vacío y eliminarlo
if [ -d "app/api/auth" ] && [ -z "$(ls -A app/api/auth)" ]; then
    rm -rf app/api/auth
    echo "🧹 Directorio auth vacío eliminado"
fi

echo ""
echo "✅ Limpieza completada!"
echo "📊 Total APIs eliminadas: $deleted"
echo ""
echo "🔍 Verificando estructura..."
echo "APIs restantes en app/api/:"
find app/api -name "route.ts" | wc -l

