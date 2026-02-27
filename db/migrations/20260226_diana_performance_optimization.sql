-- ================================================================
-- 🚀 DIANA - OPTIMIZACION DE RENDIMIENTO DB OMNIA (FEBRERO 2026)
-- Foco: Carga ultra-rápida de TodayScreen y Showcase
-- ================================================================

-- 1. Índices compuestos para punto de acceso caliente (Today Screen)
-- Permiten que la búsqueda de progreso semanal y diario sea O(1) en lugar de scan secuencial
CREATE INDEX IF NOT EXISTS idx_progreso_cliente_lookup 
ON public.progreso_cliente(cliente_id, fecha, actividad_id);

CREATE INDEX IF NOT EXISTS idx_progreso_nutricion_lookup 
ON public.progreso_cliente_nutricion(cliente_id, fecha, actividad_id);

-- 2. Índice para la Tabla de Consolidado Diario (Usada en el calendario mensual)
CREATE INDEX IF NOT EXISTS idx_progreso_diario_calendar 
ON public.progreso_diario_actividad(cliente_id, fecha);

-- 3. Optimización para el Showcase (Newsletter/Marketplace)
-- Acelera el listado de productos activos y su filtrado por categoría
CREATE INDEX IF NOT EXISTS idx_activities_active_showcase 
ON public.activities(is_active, categoria) 
WHERE is_active = true;

-- 4. Optimización de Duplicación (Trigger de Enrollment)
-- Acelera el proceso de inscripción duplicando filas del template más rápido
CREATE INDEX IF NOT EXISTS idx_fitness_details_template 
ON public.ejercicios_detalles(activity_id);

CREATE INDEX IF NOT EXISTS idx_nutrition_details_template 
ON public.nutrition_program_details(activity_id);

-- 5. ANALYZE para actualizar estadísticas del planificador de queries
ANALYZE public.progreso_cliente;
ANALYZE public.progreso_cliente_nutricion;
ANALYZE public.activities;
ANALYZE public.ejercicios_detalles;
ANALYZE public.nutrition_program_details;
