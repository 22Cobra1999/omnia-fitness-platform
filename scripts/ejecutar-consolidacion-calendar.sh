#!/bin/bash

# Script para ejecutar la consolidación de calendar_events
# Este script muestra las instrucciones para ejecutar en Supabase

echo "=========================================="
echo "CONSOLIDACIÓN DE CALENDAR EVENTS"
echo "=========================================="
echo ""
echo "Este script consolida las 3 tablas en una sola:"
echo "  - calendar_events (tabla principal)"
echo "  - activity_schedules (se migra a calendar_events)"
echo "  - google_meet_links (se migra a calendar_events)"
echo ""
echo "INSTRUCCIONES:"
echo "1. Abre Supabase SQL Editor"
echo "2. Copia el contenido de: db/migrations/consolidate-calendar-events.sql"
echo "3. Pégalo en el editor"
echo "4. Ejecuta el script"
echo "5. Revisa los mensajes de NOTICE para verificar la migración"
echo ""
echo "El script:"
echo "  ✅ Agrega campos esenciales a calendar_events"
echo "  ✅ Migra datos de google_meet_links"
echo "  ✅ Migra datos de activity_schedules"
echo "  ✅ Crea índices para performance"
echo "  ✅ Crea triggers para cálculos automáticos"
echo ""
echo "Archivo SQL: db/migrations/consolidate-calendar-events.sql"
echo "=========================================="

