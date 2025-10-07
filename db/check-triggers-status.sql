-- Script para verificar el estado de los triggers
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Verificar triggers existentes
SELECT 
  'TRIGGERS EXISTENTES' as seccion,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%execution%' OR trigger_name LIKE '%progress%'
ORDER BY trigger_name;

-- 2. Verificar funciones existentes
SELECT 
  'FUNCIONES EXISTENTES' as seccion,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%execution%' OR routine_name LIKE '%progress%'
ORDER BY routine_name;

-- 3. Verificar si hay datos en las tablas necesarias
SELECT 
  'DATOS EN TABLAS' as seccion,
  'activities' as tabla,
  COUNT(*) as registros
FROM activities
UNION ALL
SELECT 
  'DATOS EN TABLAS',
  'ejercicios_detalles',
  COUNT(*)
FROM ejercicios_detalles
UNION ALL
SELECT 
  'DATOS EN TABLAS',
  'planificacion_ejercicios',
  COUNT(*)
FROM planificacion_ejercicios
UNION ALL
SELECT 
  'DATOS EN TABLAS',
  'periodos',
  COUNT(*)
FROM periodos
UNION ALL
SELECT 
  'DATOS EN TABLAS',
  'ejecuciones_ejercicio',
  COUNT(*)
FROM ejecuciones_ejercicio;

-- 4. Verificar datos específicos para actividad 78
SELECT 
  'DATOS ACTIVIDAD 78' as seccion,
  'ejercicios_detalles' as tabla,
  COUNT(*) as registros
FROM ejercicios_detalles 
WHERE activity_id = 78
UNION ALL
SELECT 
  'DATOS ACTIVIDAD 78',
  'planificacion_ejercicios',
  COUNT(*)
FROM planificacion_ejercicios 
WHERE actividad_id = 78
UNION ALL
SELECT 
  'DATOS ACTIVIDAD 78',
  'periodos',
  COUNT(*)
FROM periodos 
WHERE actividad_id = 78;
