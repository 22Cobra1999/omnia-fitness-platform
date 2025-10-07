-- Script completo para ejecutar la limpieza de ejercicios_detalles
-- Ejecuta en orden: verificación -> limpieza -> verificación final

-- PASO 1: Verificar estructura actual
\i verificar_estructura_ejercicios_detalles.sql

-- PASO 2: Limpiar tabla de forma segura
\i limpiar_ejercicios_detalles_simple.sql

-- PASO 3: Verificación final
SELECT 
    'VERIFICACIÓN FINAL COMPLETADA' as estado,
    NOW() as fecha_verificacion,
    'Tabla ejercicios_detalles optimizada exitosamente' as resultado;

-- Mostrar resumen de todas las tablas del sistema
SELECT 
    'RESUMEN DEL SISTEMA COMPLETO' as estado,
    (SELECT COUNT(*) FROM periodos) as periodos,
    (SELECT COUNT(*) FROM planificacion_ejercicios) as planificaciones,
    (SELECT COUNT(*) FROM progreso_cliente) as progresos,
    (SELECT COUNT(*) FROM ejercicios_detalles) as ejercicios_detalles_limpios;






















