-- =====================================================
-- SCRIPT MAESTRO CORREGIDO PARA INSTALAR ESQUEMA MODULAR OMNIA
-- =====================================================
-- Este script ejecuta todos los componentes del nuevo esquema modular
-- en el orden correcto para evitar errores de dependencias

-- IMPORTANTE: Hacer backup completo de la base de datos antes de ejecutar

-- =====================================================
-- PASO 0: VERIFICAR PRERREQUISITOS
-- =====================================================
\echo 'Paso 0: Verificando prerrequisitos...'

-- Verificar que las tablas base existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        RAISE EXCEPTION 'Tabla activities no existe. Ejecuta primero los scripts de creación de tablas base.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_enrollments') THEN
        RAISE EXCEPTION 'Tabla activity_enrollments no existe. Ejecuta primero los scripts de creación de tablas base.';
    END IF;
    
    RAISE NOTICE 'Prerrequisitos verificados correctamente';
END $$;

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
-- PASO 4: CORREGIR ERRORES Y MIGRAR DATOS
-- =====================================================
\echo 'Paso 4: Corrigiendo errores y migrando datos...'
\i fix-migration-errors.sql

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
