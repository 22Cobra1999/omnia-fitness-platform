-- Migration: Cleanup and unify progress table schema
-- 1. Remove old _json columns
-- 2. Consolidate into clean explicit columns

ALTER TABLE public.progreso_cliente 
DROP COLUMN IF EXISTS minutos_json,
DROP COLUMN IF EXISTS calorias_json,
DROP COLUMN IF EXISTS peso_json,
DROP COLUMN IF EXISTS series_json,
DROP COLUMN IF EXISTS reps_json,
DROP COLUMN IF EXISTS descanso_json;

-- Ensure constraints and types are correct for remaining columns if they weren't matched before
-- (This is just safety in case you want to rerun it)

COMMENT ON COLUMN public.progreso_cliente.informacion IS 'Metadata: ID compuesto (ejercicioId_bloque_orden) -> info básica';
COMMENT ON COLUMN public.progreso_cliente.peso IS 'Mapa: ID compuesto -> peso adaptado';
COMMENT ON COLUMN public.progreso_cliente.reps IS 'Mapa: ID compuesto -> repeticiones';
COMMENT ON COLUMN public.progreso_cliente.series IS 'Mapa: ID compuesto -> series';
COMMENT ON COLUMN public.progreso_cliente.minutos IS 'Mapa: ID compuesto -> duración';
COMMENT ON COLUMN public.progreso_cliente.descanso IS 'Mapa: ID compuesto -> descanso entre series';
COMMENT ON COLUMN public.progreso_cliente.calorias IS 'Mapa: ID compuesto -> calorías';
COMMENT ON COLUMN public.progreso_cliente.descanso_bloques IS 'Mapa: bloque -> descanso post-bloque';
