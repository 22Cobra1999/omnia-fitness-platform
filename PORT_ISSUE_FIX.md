# Solución para Problema de Puerto

## Problema Identificado
El servidor de desarrollo está corriendo en el puerto **3001** en lugar del **3000**, causando que las APIs no funcionen porque el frontend intenta hacer requests a `localhost:3000`.

## Solución Implementada

### 1. Configuración de API Dinámica
✅ **Creado**: `lib/api-config.ts`
- Detecta automáticamente el puerto actual del servidor
- Usa `window.location.origin` para obtener la URL correcta
- Centraliza todas las URLs de API

### 2. Componente Actualizado
✅ **Actualizado**: `components/mobile/products-management-screen.tsx`
- Usa `API_ENDPOINTS` en lugar de URLs hardcodeadas
- Se adapta automáticamente al puerto correcto
- Más robusto y mantenible

## Cómo Funciona

```typescript
// lib/api-config.ts
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin  // Usa el puerto actual
  }
  return 'http://localhost:3000'   // Fallback
}

export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/api/products`,
  COACH_CONSULTATIONS: `${API_BASE_URL}/api/coach/consultations`,
  COACH_STATS: `${API_BASE_URL}/api/coach/stats-simple`,
}
```

## Beneficios

1. **Adaptación Automática**: Funciona en cualquier puerto (3000, 3001, etc.)
2. **Centralizado**: Todas las URLs de API en un solo lugar
3. **Mantenible**: Fácil de actualizar si cambian las rutas
4. **Robusto**: No se rompe si cambia el puerto del servidor

## Resultado

La aplicación ahora debería funcionar correctamente independientemente del puerto en el que esté corriendo el servidor de desarrollo.

## Verificación

Los logs de la consola deberían mostrar:
```
🔍 Productos recibidos de la API: [...]
🔍 Consultas recibidas: {...}
🔍 Estadísticas recibidas: {...}
```

Sin errores de conexión o 404.
