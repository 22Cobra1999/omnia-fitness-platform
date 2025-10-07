# Instrucciones para Corregir Estadísticas del Coach

## Problema Identificado
Las estadísticas en la pantalla de "Mis Productos" no mostraban valores reales:
- **Ingresos**: Mostraba $0 en lugar de calcular las ventas reales
- **Rating**: Mostraba 0.0 en lugar del rating promedio real
- **Productos**: Mostraba correctamente el número de productos

## Solución Implementada

### 1. Nueva API de Estadísticas
✅ **Creada**: `app/api/coach/stats/route.ts`
- Calcula ingresos reales desde `activity_enrollments` × `activities.price`
- Calcula rating promedio desde `activities.program_rating`
- Obtiene estadísticas reales de ventas y reviews

### 2. Componente Actualizado
✅ **Actualizado**: `components/mobile/products-management-screen.tsx`
- Agregado estado para estadísticas reales
- Nueva función `fetchStats()` para cargar datos
- Variables actualizadas para usar datos reales de la API

### 3. Script SQL para Base de Datos
✅ **Creado**: `db/setup-coach-stats.sql`
- Asegura que las columnas de rating existan
- Actualiza estadísticas para actividades existentes
- Verifica datos del coach específico

## Pasos para Aplicar la Solución

### Paso 1: Ejecutar Script SQL
Ejecuta el siguiente script en el SQL Editor de Supabase:

```sql
-- 1. Asegurar que las columnas de rating existan en activities
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS program_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_program_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_dislikes INTEGER DEFAULT 0;

-- 2. Crear función para actualizar estadísticas de actividades
CREATE OR REPLACE FUNCTION update_activity_program_stats(activity_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE activities
  SET
    program_rating = COALESCE((
      SELECT AVG((metadata->>'difficulty_rating')::numeric)
      FROM activity_surveys
      WHERE activity_id = activity_id_param
    ), 0.00),
    total_program_reviews = COALESCE((
      SELECT COUNT(*)
      FROM activity_enrollments
      WHERE activity_id = activity_id_param
    ), 0)
  WHERE id = activity_id_param;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar estadísticas para todas las actividades existentes
DO $$
DECLARE
    activity_record RECORD;
BEGIN
    FOR activity_record IN SELECT id FROM activities LOOP
        PERFORM update_activity_program_stats(activity_record.id);
    END LOOP;
END $$;
```

### Paso 2: Verificar Datos
Ejecuta esta consulta para verificar las estadísticas del coach:

```sql
-- Verificar estadísticas del coach
SELECT 
    COUNT(a.id) as total_products,
    SUM(a.price * COALESCE(enrollment_counts.enrollment_count, 0)) as total_revenue,
    AVG(a.program_rating) as avg_rating,
    SUM(a.total_program_reviews) as total_reviews,
    SUM(COALESCE(enrollment_counts.enrollment_count, 0)) as total_enrollments
FROM activities a
LEFT JOIN (
    SELECT 
        activity_id, 
        COUNT(*) as enrollment_count
    FROM activity_enrollments 
    WHERE status = 'active'
    GROUP BY activity_id
) enrollment_counts ON enrollment_counts.activity_id = a.id
WHERE a.coach_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
```

### Paso 3: Recargar la Aplicación
1. Reinicia el servidor de desarrollo
2. Recarga la página de "Mis Productos"
3. Verifica que las estadísticas muestren valores reales

## Resultado Esperado

Después de aplicar los cambios, las estadísticas deberían mostrar:

- **Ingresos**: Suma real de `activities.price` × `activity_enrollments` activos
- **Productos**: Número real de actividades creadas por el coach
- **Rating**: Promedio real de ratings de todas las actividades del coach

## Cálculo de Ingresos

Los ingresos se calculan como:
```sql
SUM(activities.price * COUNT(activity_enrollments))
WHERE activity_enrollments.status = 'active'
AND activities.coach_id = coach_id
```

## Cálculo de Rating

El rating se calcula como:
```sql
AVG(activities.program_rating)
WHERE activities.coach_id = coach_id
AND activities.program_rating > 0
```

## Verificación

Los logs de la consola deberían mostrar:
```
🔍 Estadísticas recibidas: {
  totalProducts: X,
  totalRevenue: Y,
  avgRating: Z,
  totalReviews: W,
  totalEnrollments: V,
  totalSales: V
}
```
