-- ================================================================
-- 🏛️ DIANA - SEGURIDAD RLS (BLINDAJE DE TABLAS CRÍTICAS)
-- Aplicación de RLS a las tablas detectadas como inseguras
-- ================================================================

-- 1. PROGRESO CLIENTE (Gimnasio y Nutrición)
ALTER TABLE public.progreso_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Los clientes solo ven su propio progreso" ON public.progreso_cliente;
CREATE POLICY "Los clientes solo ven su propio progreso" ON public.progreso_cliente
    FOR ALL USING (auth.uid()::text = cliente_id::text);

ALTER TABLE public.progreso_cliente_nutricion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Los clientes solo ven su nutricion" ON public.progreso_cliente_nutricion;
CREATE POLICY "Los clientes solo ven su nutricion" ON public.progreso_cliente_nutricion
    FOR ALL USING (auth.uid()::text = cliente_id::text);

-- 2. PLANIFICACIÓN Y DETALLES
ALTER TABLE public.planificacion_ejercicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica de planificacion" ON public.planificacion_ejercicios;
CREATE POLICY "Lectura publica de planificacion" ON public.planificacion_ejercicios
    FOR SELECT USING (true);

-- 3. PROGRESO DIARIO (RESUMEN)
ALTER TABLE public.progreso_diario_actividad ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve su resumen diario" ON public.progreso_diario_actividad;
CREATE POLICY "Solo el dueño ve su resumen diario" ON public.progreso_diario_actividad
    FOR ALL USING (auth.uid()::text = cliente_id::text);

-- 4. OTRAS TABLAS DETECTADAS
ALTER TABLE public.taller_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica de detalles de taller" ON public.taller_detalles;
CREATE POLICY "Lectura publica de detalles de taller" ON public.taller_detalles FOR SELECT USING (true);

ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica de recetas" ON public.recetas;
CREATE POLICY "Lectura publica de recetas" ON public.recetas FOR SELECT USING (true);

-- Limpieza de función de diagnóstico
DROP FUNCTION IF EXISTS public.get_insecure_tables();
