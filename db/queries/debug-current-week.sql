-- Query 2: Ver qué fechas está buscando el frontend
SELECT 
  'SEMANA ACTUAL' as info,
  CURRENT_DATE as hoy,
  CURRENT_DATE - 7 as hace_7_dias,
  CURRENT_DATE - 30 as hace_30_dias,
  'Fechas que busca el frontend' as descripcion;
