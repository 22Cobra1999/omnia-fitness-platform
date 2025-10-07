# Implementación del Rating del Coach

## Problema Resuelto
✅ **API actualizada** para usar `coach_stats_view` y obtener el rating real del coach.

## Cambios Implementados

### 1. API Actualizada
✅ **Modificado**: `app/api/coach/stats-simple/route.ts`
- Ahora consulta `coach_stats_view` para obtener rating real
- Manejo robusto de errores si no hay datos
- Logs detallados para debugging

### 2. Script SQL de Verificación
✅ **Creado**: `db/setup-coach-stats-view.sql`
- Verifica que la vista `coach_stats_view` existe
- Crea la vista si no existe
- Verifica datos del coach específico
- Incluye datos de ejemplo (comentados)

## Cómo Funciona

### Estructura de coach_stats_view
```sql
SELECT 
    a.coach_id,
    COALESCE(AVG(acs.coach_method_rating), 0.00) as avg_rating,
    COALESCE(COUNT(acs.id), 0) as total_reviews
FROM activities a
LEFT JOIN activity_surveys acs ON acs.activity_id = a.id
WHERE a.coach_id IS NOT NULL
GROUP BY a.coach_id;
```

### API Actualizada
```typescript
const { data: coachStats, error: coachStatsError } = await supabase
  .from('coach_stats_view')
  .select('avg_rating, total_reviews')
  .eq('coach_id', user.id)
  .single()

if (coachStats) {
  avgRating = coachStats.avg_rating || 0
  totalReviews = coachStats.total_reviews || 0
}
```

## Pasos para Aplicar

### 1. Ejecutar Script SQL
Ejecuta el script `db/setup-coach-stats-view.sql` en Supabase para:
- Verificar que la vista existe
- Crear la vista si es necesario
- Verificar datos del coach

### 2. Verificar Resultado
Los logs de la consola deberían mostrar:
```
📊 Rating del coach obtenido: { avgRating: X.X, totalReviews: X }
```

### 3. Si No Hay Datos
Si el rating sigue en 0, significa que no hay `activity_surveys` con ratings. Para probar:

1. **Descomenta las líneas de inserción** en el script SQL
2. **Ejecuta la inserción** de datos de ejemplo
3. **Recarga la página** para ver el rating

## Resultado Esperado

Después de aplicar los cambios:
- **Rating**: Mostrará el promedio real de `coach_method_rating`
- **Reviews**: Mostrará el número real de surveys
- **Logs**: Mostrarán los datos obtenidos de la vista

## Verificación

Los logs de la consola deberían mostrar:
```
🔍 Estadísticas recibidas: {
  totalProducts: 2,
  totalRevenue: 767,
  avgRating: 4.5,  // ← Ahora debería mostrar un valor real
  totalReviews: 2,  // ← Número de reviews reales
  totalEnrollments: 1,
  totalSales: 1
}
```

## Nota Importante

El rating solo se mostrará si existen `activity_surveys` con `coach_method_rating`. Si no hay surveys, el rating será 0 hasta que los usuarios califiquen al coach.
