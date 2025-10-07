-- =====================================================
-- SCRIPT MAESTRO PARA INSTALAR ESQUEMA MODULAR OMNIA
-- =====================================================
-- Este script ejecuta todos los componentes del nuevo esquema modular
-- en el orden correcto para evitar errores de dependencias

-- IMPORTANTE: Hacer backup completo de la base de datos antes de ejecutar

-- =====================================================
-- PASO 1: CREAR ESQUEMA BASE
-- =====================================================
\echo 'Paso 1: Creando esquema base...'
\i create-modular-exercise-schema.sql

-- =====================================================
-- PASO 2: CREAR FUNCIONES AUXILIARES
-- =====================================================
\echo 'Paso 2: Creando funciones auxiliares...'
\i create-modular-functions.sql

-- =====================================================
-- PASO 3: CREAR TRIGGERS DE AUTOMATIZACIÓN
-- =====================================================
\echo 'Paso 3: Creando triggers de automatización...'
\i create-modular-triggers.sql

-- =====================================================
-- PASO 4: MIGRAR DATOS EXISTENTES
-- =====================================================
\echo 'Paso 4: Migrando datos existentes...'
\i migrate-to-modular-schema.sql

-- =====================================================
-- PASO 5: CONFIGURAR RELACIONES Y POLÍTICAS FINALES
-- =====================================================
\echo 'Paso 5: Configurando relaciones y políticas finales...'
\i configure-modular-schema-relationships.sql

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
\echo 'Verificación final del esquema...'
SELECT verificar_esquema_modular();

\echo '========================================='
\echo 'INSTALACIÓN DEL ESQUEMA MODULAR COMPLETADA'
\echo '========================================='
\echo 'El nuevo esquema modular está listo para usar.'
\echo 'Revisa los logs anteriores para verificar que no hubo errores.'
