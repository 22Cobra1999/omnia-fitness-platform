# SOLUCIÓN: Cartas de Productos - Sesiones y Ejercicios Únicos

## Problema Identificado
Las cartas de productos no mostraban correctamente la cantidad de sesiones y ejercicios únicos calculados en el paso 5. En su lugar, mostraban valores hardcodeados o incorrectos.

## Causa Raíz
1. **Hook `useProductStats` obsoleto**: Estaba usando valores hardcodeados en lugar de obtener datos reales de la API.
2. **Función `convertProductToActivity`**: Establecía valores hardcodeados que sobrescribían los datos reales.

## Solución Implementada

### 1. Actualización del Hook `useProductStats` ✅
**Archivo**: `hooks/use-product-stats.ts`

**Cambios realizados**:
- ✅ Integración con la API `/api/get-product-planning` que ya calcula correctamente las estadísticas
- ✅ Obtención de datos reales: `sesiones`, `ejerciciosUnicos`, `semanas`, `periodos`
- ✅ Logging detallado para debugging
- ✅ Manejo de errores robusto
- ✅ Nuevo campo `uniqueExercises` para compatibilidad

**Antes**:
```typescript
// Valores hardcodeados
if (activityId === 78) {
  setStats({
    totalSessions: 8,
    totalExercises: 24,
    // ...
  })
}
```

**Después**:
```typescript
// Datos reales de la API
const response = await fetch(`/api/get-product-planning?actividad_id=${activityId}`)
const data = await response.json()
setStats({
  totalSessions: data.planning.sesiones || 0,
  uniqueExercises: data.planning.ejerciciosUnicos || 0,
  // ...
})
```

### 2. Corrección de `convertProductToActivity` ✅
**Archivo**: `components/mobile/products-management-screen.tsx`

**Cambios realizados**:
- ✅ Eliminación de valores hardcodeados para `exercisesCount` y `totalSessions`
- ✅ Los datos ahora se obtienen dinámicamente via `useProductStats` en `ActivityCard`

**Antes**:
```typescript
exercisesCount: product.type === 'program' ? 40 : undefined,
totalSessions: product.type === 'program' ? 28 : product.sessions_per_client,
```

**Después**:
```typescript
exercisesCount: undefined, // ✅ Se obtendrá dinámicamente via useProductStats
totalSessions: undefined, // ✅ Se obtendrá dinámicamente via useProductStats
```

### 3. Verificación de `ActivityCard` ✅
**Archivo**: `components/ActivityCard.tsx`

**Estado**: Ya estaba correcto
- ✅ Usa `stats.uniqueExercises` para mostrar ejercicios únicos
- ✅ Usa `stats.totalSessions` para mostrar sesiones
- ✅ Integración correcta con `useProductStats`

## Resultado Esperado

### Vista del Coach (Gestión de Productos)
Las cartas de productos ahora mostrarán:
- **Sesiones**: Valor real calculado por la API (ej: 3 sesiones)
- **Ejercicios**: Valor real de ejercicios únicos (ej: 2 ejercicios)

### Vista del Cliente (Modal de Producto)
El modal del producto también mostrará los mismos valores correctos.

### Datos de Ejemplo
Basado en los logs del paso 5:
```
📅 Planificación procesada: { 
  semanas: 2, 
  sesiones: 3, 
  ejerciciosUnicos: 2, 
  periodos: 3 
}
```

## Archivos Modificados
1. `hooks/use-product-stats.ts` - Integración con API real
2. `components/mobile/products-management-screen.tsx` - Eliminación de valores hardcodeados

## Archivos Verificados (Sin cambios necesarios)
1. `components/ActivityCard.tsx` - Ya usaba `stats.uniqueExercises` correctamente
2. `components/client-product-modal.tsx` - Recibe datos del producto convertido

## Testing
Para verificar que funciona:
1. **Recarga la aplicación** en el navegador
2. **Ve a la sección de Productos** del coach
3. **Verifica las cartas** - deberían mostrar valores reales (3 sesiones, 2 ejercicios)
4. **Abre el modal de un producto** - debería mostrar los mismos valores
5. **Revisa la consola** - debería ver logs de `useProductStats` obteniendo datos de la API

## Logs Esperados
```
📊 useProductStats: Obteniendo estadísticas para actividad: 78
📊 useProductStats: Datos obtenidos de la API: { success: true, planning: {...} }
✅ useProductStats: Estadísticas actualizadas: { sesiones: 3, ejerciciosUnicos: 2, ... }
```

---
**Fecha**: 7 de Octubre, 2025  
**Estado**: ✅ COMPLETADO  
**Impacto**: Las cartas de productos ahora muestran datos reales calculados en el paso 5




