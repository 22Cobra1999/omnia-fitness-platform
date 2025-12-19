# Flujo de Consulta de Encuesta del Coach

## 📋 Resumen del Proceso

### 1. **Frontend: `products-management-screen.tsx`**
   - Cuando el coach hace clic en un taller finalizado, se llama a `handlePreviewProduct`
   - Se verifica si el taller está finalizado (`is_finished === true`)
   - Se hace una llamada al endpoint: `/api/activities/${product.id}/check-coach-survey`
   - Se espera la respuesta con `hasSurvey: boolean`

### 2. **Backend: `app/api/activities/[id]/check-coach-survey/route.ts`**
   - **Paso 1**: Verifica que la actividad existe y es un taller
   - **Paso 2**: Verifica que el usuario es el coach de la actividad
   - **Paso 3**: Obtiene la versión actual del taller desde `workshop_versions.versions[].version`
   - **Paso 4**: Busca encuestas en `activity_surveys` con:
     - `activity_id` = ID del taller
     - `client_id` = ID del coach (el coach es el "client" en su propia encuesta)
     - `coach_method_rating IS NOT NULL` (debe tener rating)
   - **Paso 5**: Filtra las encuestas por `workshop_version` = versión actual
   - **Paso 6**: Retorna `hasSurvey: true` si encuentra una encuesta que coincida

### 3. **Frontend: Decisión**
   - Si `hasSurvey === true`: NO muestra la encuesta, solo abre el detalle
   - Si `hasSurvey === false`: Muestra la encuesta (cerrable cuando se abre el detalle, bloqueante cuando intenta editar)

## 🔍 Puntos de Verificación

### En la Base de Datos:
```sql
-- Verificar que la encuesta existe
SELECT * FROM activity_surveys 
WHERE activity_id = 48 
  AND client_id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f'
  AND workshop_version = 1
  AND coach_method_rating IS NOT NULL;
```

### En el Endpoint:
1. ✅ `activityId` debe ser correcto (48)
2. ✅ `user.id` debe ser el ID del coach
3. ✅ `currentVersion` debe ser 1 (última versión del taller)
4. ✅ La query debe retornar la encuesta
5. ✅ El filtro por versión debe coincidir

## 🐛 Problemas Comunes

### Problema 1: RLS bloqueando la query
**Síntoma**: La query no retorna resultados aunque la encuesta existe
**Solución**: Usar `service role client` (ya implementado)

### Problema 2: Tipo de dato incorrecto
**Síntoma**: `workshop_version` no coincide aunque los valores son iguales
**Solución**: Convertir ambos valores a números enteros antes de comparar (ya implementado)

### Problema 3: La encuesta no tiene `coach_method_rating`
**Síntoma**: La encuesta existe pero no se encuentra porque no tiene rating
**Solución**: Verificar que `coach_method_rating` no sea NULL

## 📊 Logs de Debugging

El endpoint ahora registra:
- ✅ Todas las encuestas encontradas (sin filtro de rating)
- ✅ Encuestas con rating
- ✅ Comparación de versiones
- ✅ Resultado final

## 🔧 Próximos Pasos para Debugging

1. Revisar los logs del servidor cuando se abre el taller
2. Verificar que `usingServiceRole: true` en los logs
3. Verificar que `surveysCount > 0` en los logs
4. Verificar que `workshop_version` coincide con `currentVersionInt`


















