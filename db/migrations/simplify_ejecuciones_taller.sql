-- Script para simplificar la tabla ejecuciones_taller
-- Eliminar columnas innecesarias y ajustar la estructura

-- 1. Eliminar columnas que no se usan
ALTER TABLE ejecuciones_taller 
DROP COLUMN IF EXISTS progreso_porcentaje,
DROP COLUMN IF EXISTS fecha_inicio,
DROP COLUMN IF EXISTS fecha_finalizacion;

-- 2. Verificar la estructura final
\d ejecuciones_taller;

-- 3. Comentarios sobre la nueva estructura
COMMENT ON TABLE ejecuciones_taller IS 'Tabla simplificada para seguimiento de talleres por cliente';
COMMENT ON COLUMN ejecuciones_taller.temas_cubiertos IS 'JSON con temas reservados/confirmados: [{"asistio": boolean, "tema_id": number, "tema_nombre": string, "fecha_seleccionada": string, "confirmo_asistencia": boolean, "horario_seleccionado": object}]';
COMMENT ON COLUMN ejecuciones_taller.temas_pendientes IS 'JSON con temas aún no reservados por el cliente';

