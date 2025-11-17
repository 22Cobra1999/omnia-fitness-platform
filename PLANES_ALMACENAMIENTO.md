# 📦 Planes y Límites de Almacenamiento

## Planes Disponibles

| Plan | Precio Mensual (ARS) | Almacenamiento | Productos Activos | Clientes Recomendados | Comisión |
|------|---------------------|----------------|-------------------|---------------------|----------|
| 🟢 **Free / Inicial** | $0 (3 meses o hasta 3 ventas) | **1 GB** | 3 | hasta 10 | 8% |
| ⚫ **Básico** | $12.000 | **5 GB** | 5 | hasta 30 | 8% |
| 🔵 **Black** | $22.000 | **25 GB** | 10 | hasta 70 | 6% |
| 🟣 **Premium** | $35.000 | **100 GB** | 20 | hasta 150 | 5% |

## Implementación en el Código

### Tipos de Plan
```typescript
export type PlanType = 'free' | 'basico' | 'black' | 'premium'
```

### Límites de Almacenamiento
```typescript
export const PLAN_STORAGE_LIMITS: Record<PlanType, number> = {
  free: 1,      // Free/Inicial: 1 GB
  basico: 5,    // Básico: 5 GB
  black: 25,    // Black: 25 GB
  premium: 100  // Premium: 100 GB
}
```

### Uso en el Widget
```tsx
<StorageUsageWidget plan="basico" /> // Usa 5 GB
<StorageUsageWidget /> // Por defecto usa 'free' (1 GB)
```

## Próximos Pasos

1. **Crear API para obtener plan del coach**:
   - Endpoint: `/api/coach/plan`
   - Retorna el plan actual del coach desde la base de datos

2. **Integrar con tabla `coach_plans` o `coaches`**:
   - Agregar columna `plan_type` a la tabla `coaches`
   - O consultar la tabla `coach_plans` para obtener el plan activo

3. **Actualizar widget para obtener plan automáticamente**:
   - Usar hook `useCoachPlan()` para obtener el plan
   - Pasar el plan al widget automáticamente

## Barra de Almacenamiento

La barra muestra 3 secciones:
- **Videos**: Naranja (#FF7939) con icono Video
- **Fotos**: Negro con icono Image
- **Disponible**: Blanco con icono FileIcon

Cada sección muestra su tamaño cuando el porcentaje es > 10%, y siempre muestra su icono.



























