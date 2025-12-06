# Consulta de Encuesta del Coach - Flujo Completo

## 📊 Tabla Consultada

### `activity_surveys`

Esta es la tabla principal donde se almacenan todas las encuestas (tanto de clientes como de coaches).

## 🔍 Query Exacta que se Ejecuta

### Query TypeScript (Supabase):
```typescript
const { data: surveys, error: surveyError } = await queryClient
  .from('activity_surveys')
  .select('id, coach_method_rating, comments, workshop_version')
  .eq('activity_id', activityId)           // Filtro 1: ID del taller (ej: 48)
  .eq('client_id', user.id)               // Filtro 2: ID del coach (ej: b16c4f8c-f47b-4df0-ad2b-13dcbd76263f)
  .not('coach_method_rating', 'is', null) // Filtro 3: Debe tener rating (encuesta completa)
```

### Query SQL Equivalente:
```sql
SELECT 
  id, 
  coach_method_rating, 
  comments, 
  workshop_version
FROM activity_surveys
WHERE activity_id = 48
  AND client_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND coach_method_rating IS NOT NULL;
```

### Después se filtra por versión en JavaScript:
```typescript
// De todas las encuestas encontradas, buscar la que coincida con la versión actual
const survey = surveys?.find((s) => {
  const surveyVersion = Number(s.workshop_version) // ej: 1
  return surveyVersion === currentVersionInt // ej: 1 === 1 ✅
}) || null
```

## 📋 Columnas Relevantes

### Columnas que se consultan:
- `id`: ID único de la encuesta
- `coach_method_rating`: Calificación del método del coach (1-5) - **Esta es la clave para saber si está completa**
- `comments`: Comentarios del coach (opcional)
- `workshop_version`: Versión del taller para la cual se completó la encuesta

### Columnas que se usan para filtrar:
- `activity_id`: ID del taller
- `client_id`: ID del coach (en su propia encuesta, el coach es el "client")
- `coach_method_rating`: Debe ser NOT NULL para considerar la encuesta como completa

## 🔄 Proceso Completo

### Paso 1: Obtener la Versión Actual del Taller
```typescript
// Se consulta la tabla `activities`
const { data: activity } = await supabase
  .from('activities')
  .select('workshop_versions')
  .eq('id', activityId)
  .single()

// Se extrae la última versión
const versions = activity.workshop_versions?.versions || []
const currentVersion = versions[versions.length - 1].version // ej: 1
```

### Paso 2: Buscar Encuestas del Coach
```typescript
// Se consulta `activity_surveys` con los filtros:
// - activity_id = 48
// - client_id = ID del coach
// - coach_method_rating IS NOT NULL (encuesta completa)
const { data: surveys } = await queryClient
  .from('activity_surveys')
  .select('id, coach_method_rating, comments, workshop_version')
  .eq('activity_id', 48)
  .eq('client_id', 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f')
  .not('coach_method_rating', 'is', null)
```

### Paso 3: Filtrar por Versión
```typescript
// Se filtra en JavaScript para encontrar la encuesta de la versión actual
const survey = surveys?.find((s) => {
  const surveyVersion = Number(s.workshop_version) // ej: 1
  return surveyVersion === currentVersionInt // ej: 1 === 1 ✅
}) || null
```

### Paso 4: Determinar si Tiene Encuesta
```typescript
const hasSurvey = !!survey &&                    // Existe la encuesta
                  hasRating &&                    // Tiene rating
                  versionsMatch &&                // Versión coincide
                  !surveyError                    // No hay errores
```

## 📝 Ejemplo Real

### Datos en la Base de Datos:

**Tabla `activities`:**
```sql
id: 48
workshop_versions: {
  "versions": [
    {"version": 1, "empezada_el": "01/09/25", "finalizada_el": "24/10/25"}
  ]
}
```

**Tabla `activity_surveys`:**
```sql
id: 8
activity_id: 48
client_id: 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'  -- ID del coach
coach_method_rating: 4                              -- ✅ Tiene rating (encuesta completa)
workshop_version: 1                                 -- ✅ Versión coincide
comments: 'm'
enrollment_id: null                                 -- NULL para encuestas de coaches
```

### Resultado de la Query:
```javascript
{
  success: true,
  hasSurvey: true,        // ✅ Encuesta encontrada y completa
  survey: {
    id: 8,
    coach_method_rating: 4,
    workshop_version: 1,
    comments: 'm'
  },
  currentVersion: 1
}
```

## 🔑 Puntos Clave

1. **Tabla consultada**: `activity_surveys`
2. **Filtros principales**:
   - `activity_id` = ID del taller
   - `client_id` = ID del coach
   - `coach_method_rating IS NOT NULL` (encuesta completa)
3. **Filtro adicional**: `workshop_version` debe coincidir con la versión actual del taller
4. **Cliente usado**: Service Role Client (bypassa RLS)
5. **Criterio de "completada"**: 
   - Debe existir un registro
   - Debe tener `coach_method_rating` (no NULL)
   - Debe coincidir con la versión actual del taller

## 🎯 Flujo Visual

```
1. Coach hace clic en taller finalizado
   ↓
2. Frontend llama: GET /api/activities/48/check-coach-survey
   ↓
3. Backend consulta `activities` → Obtiene versión actual (1)
   ↓
4. Backend consulta `activity_surveys` con filtros:
   - activity_id = 48
   - client_id = coach_id
   - coach_method_rating IS NOT NULL
   ↓
5. Backend filtra por workshop_version = 1
   ↓
6. Si encuentra encuesta → hasSurvey: true
   Si NO encuentra → hasSurvey: false
   ↓
7. Frontend decide:
   - hasSurvey: true → NO muestra encuesta
   - hasSurvey: false → Muestra encuesta (cerrable o bloqueante)
```

## 📌 Notas Importantes

- **El coach es el `client_id`**: En su propia encuesta, el coach actúa como "client"
- **`workshop_version` es clave**: Permite que el coach responda la encuesta cada vez que finaliza una nueva versión del taller
- **Service Role Client**: Se usa para evitar problemas de RLS (Row Level Security)
- **`coach_method_rating` es obligatorio**: Si es NULL, la encuesta no se considera completa

