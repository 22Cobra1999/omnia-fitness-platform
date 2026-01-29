-- ==========================================
-- CONSULTA DE PROGRESO DE ACTIVIDADES POR CLIENTE
-- ==========================================
-- Esta query calcula el progreso detallado para Programas/Talleres y Documentos.
-- Nota: Reemplazar client_id según sea necesario.

WITH today_ref AS (
  SELECT (CURRENT_DATE AT TIME ZONE 'UTC')::date as today
),
doc_stats AS (
  SELECT 
    enrollment_id,
    COUNT(*) FILTER (WHERE completed) as items_ok,
    COUNT(*) FILTER (WHERE NOT completed) as items_pending
  FROM public.client_document_progress
  GROUP BY enrollment_id
),
daily_stats AS (
  SELECT
    enrollment_id,
    -- DÍAS (SÓLO PROGRAMAS/TALLERES)
    COUNT(*) FILTER (WHERE fecha < (SELECT today FROM today_ref) AND items_completados >= items_objetivo AND items_objetivo > 0) as dias_completados,
    COUNT(*) FILTER (WHERE fecha < (SELECT today FROM today_ref) AND items_completados > 0 AND items_completados < items_objetivo) as dias_en_curso,
    COUNT(*) FILTER (WHERE fecha < (SELECT today FROM today_ref) AND items_completados = 0 AND items_objetivo > 0) as dias_ausentes,
    -- ITEMS PASADOS
    SUM(items_completados) FILTER (WHERE fecha < (SELECT today FROM today_ref)) as items_pasados_completados,
    SUM(items_objetivo - items_completados) FILTER (WHERE fecha < (SELECT today FROM today_ref)) as items_pasados_deuda,
    -- ITEMS PROXIMOS (HOY + FUTURO)
    SUM(items_objetivo - items_completados) FILTER (WHERE fecha >= (SELECT today FROM today_ref)) as items_proximos_restantes,
    -- TOTALES PARA PROGRESO
    SUM(items_completados) as total_items_completados,
    SUM(items_objetivo) as total_items_objetivo
  FROM public.progreso_diario_actividad
  GROUP BY enrollment_id
)
SELECT 
  a.title AS actividad_nombre,
  ae.id AS enrollment_id,
  a.type AS actividad_tipo,
  CASE WHEN a.type = 'document' THEN NULL ELSE COALESCE(ds.dias_completados, 0) END AS dias_completados_total,
  CASE WHEN a.type = 'document' THEN NULL ELSE COALESCE(ds.dias_en_curso, 0) END AS dias_en_curso,
  CASE WHEN a.type = 'document' THEN NULL ELSE COALESCE(ds.dias_ausentes, 0) END AS dias_ausentes,
  
  -- ITEMS PASADOS COMPLETADOS (TERMINADOS)
  CASE 
    WHEN a.type = 'document' THEN COALESCE(doc.items_ok, 0)
    ELSE COALESCE(ds.items_pasados_completados, 0)
  END AS items_pasados_completados,

  -- ITEMS PASADOS RESTANTES (NO LOGRADOS / DEUDA)
  CASE 
    WHEN a.type = 'document' THEN 
      CASE 
        WHEN (ae.program_end_date::date < (SELECT today FROM today_ref)) THEN COALESCE(doc.items_pending, 0) 
        ELSE 0 
      END
    ELSE COALESCE(ds.items_pasados_deuda, 0)
  END AS items_pasados_restantes,
  
  -- ITEMS PROXIMOS RESTANTES (RESTANTES)
  CASE 
    WHEN a.type = 'document' THEN 
      CASE 
        WHEN (ae.program_end_date::date >= (SELECT today FROM today_ref) OR ae.program_end_date IS NULL) THEN COALESCE(doc.items_pending, 0) 
        ELSE 0 
      END
    ELSE COALESCE(ds.items_proximos_restantes, 0)
  END AS items_proximos_restantes,
  
  -- PROGRESO TOTAL CALCULADO
  ROUND(
    CASE 
      WHEN a.type = 'document' THEN 
        CASE WHEN (COALESCE(doc.items_ok, 0) + COALESCE(doc.items_pending, 0)) > 0 
             THEN (doc.items_ok::numeric / (doc.items_ok + doc.items_pending)) * 100
             ELSE 0 END
      ELSE 
        CASE WHEN COALESCE(ds.total_items_objetivo, 0) > 0 
             THEN (ds.total_items_completados::numeric / ds.total_items_objetivo) * 100
             ELSE 0 END
    END, 2
  ) AS progreso_total_porcentaje
FROM public.activity_enrollments ae
JOIN public.activities a ON ae.activity_id = a.id
LEFT JOIN doc_stats doc ON ae.id = doc.enrollment_id
LEFT JOIN daily_stats ds ON ae.id = ds.enrollment_id
WHERE ae.client_id = 'REPLACE_WITH_CLIENT_ID'
ORDER BY ae.created_at DESC;
