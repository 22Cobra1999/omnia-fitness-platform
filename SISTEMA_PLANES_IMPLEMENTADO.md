# 📦 Sistema de Planes y Almacenamiento - Implementado

## ✅ Componentes Implementados

### 1. Base de Datos

#### Tabla: `planes_uso_coach`
- **Ubicación**: `db/migrations/create-planes-uso-coach-table.sql`
- **Campos**:
  - `id`: UUID (PK)
  - `coach_id`: UUID (FK a coaches)
  - `plan_type`: VARCHAR ('free', 'basico', 'black', 'premium')
  - `storage_limit_gb`: DECIMAL (límite según plan)
  - `storage_used_gb`: DECIMAL (uso actual)
  - `storage_available_gb`: GENERATED (calculado automáticamente)
  - `status`: VARCHAR ('active', 'cancelled', 'expired', 'trial')
  - `started_at`, `expires_at`: TIMESTAMP
  - `created_at`, `updated_at`: TIMESTAMP

- **Características**:
  - Constraint único: un coach solo puede tener un plan activo
  - RLS habilitado con políticas de seguridad
  - Trigger para actualizar `updated_at` automáticamente
  - Índices para mejor performance

### 2. APIs

#### GET/POST `/api/coach/plan`
- **GET**: Obtiene el plan activo del coach
  - Si no tiene plan, crea uno 'free' por defecto
  - Retorna: `{ success: true, plan: {...} }`

- **POST**: Cambia el plan del coach
  - Valida que el nuevo plan tenga suficiente espacio
  - Desactiva el plan anterior
  - Crea el nuevo plan activo
  - Retorna: `{ success: true, plan: {...}, message: "..." }`

#### POST `/api/coach/sync-storage`
- Sincroniza `storage_used_gb` desde `storage_usage`
- Calcula el total usado y actualiza el plan activo
- Útil para mantener datos consistentes

### 3. Componentes Frontend

#### `PlanManagement` (`components/coach/plan-management.tsx`)
**Características**:
- Muestra el plan actual con:
  - Nombre del plan con icono
  - Precio y período
  - Uso de almacenamiento (barra de progreso)
  
- Botón "Ver Planes" para expandir/colapsar lista completa
- Lista de todos los planes disponibles con:
  - Iconos y colores distintivos
  - Características principales
  - Botón "Cambiar a este plan"
  
- Tabla comparativa completa de todas las características:
  - Almacenamiento
  - Productos activos
  - Clientes recomendados
  - Comisión por venta
  - Video de portada
  - Analítica
  - Soporte

- Estados de carga y error
- Validación al cambiar de plan (verifica espacio suficiente)

#### `StorageUsageWidget` (actualizado)
- Ahora obtiene el plan automáticamente desde `/api/coach/plan`
- Calcula límites según el plan activo
- Compatible con prop opcional `plan` para testing

### 4. Planes Definidos

| Plan | Precio | Almacenamiento | Productos | Clientes | Comisión | Video | Analítica | Soporte |
|------|--------|----------------|-----------|----------|----------|-------|-----------|---------|
| 🟢 **Free** | $0 (3 meses) | 1 GB | 3 | hasta 10 | 8% | ❌ | — | E-mail |
| ⚫ **Básico** | $12.000 | 5 GB | 5 | hasta 30 | 8% | ✅ | Básica | E-mail prioritario |
| 🔵 **Black** | $22.000 | 25 GB | 10 | hasta 70 | 6% | ✅ | Avanzada | Chat directo |
| 🟣 **Premium** | $35.000 | 100 GB | 20 | hasta 150 | 5% | ✅ | Completa | Soporte técnico |

## 🔧 Integración

### En `profile-screen.tsx`
- Reemplazada la sección estática "Mi Suscripción" por `<PlanManagement />`
- El widget de almacenamiento obtiene el plan automáticamente

### Flujo de Usuario

1. **Ver Plan Actual**:
   - Sección "Mi Suscripción" muestra plan activo
   - Incluye barra de uso de almacenamiento
   - Precio y período de facturación

2. **Ver Todos los Planes**:
   - Click en "Ver Planes"
   - Lista expandible con todos los planes
   - Tabla comparativa completa

3. **Cambiar Plan**:
   - Click en "Cambiar a este plan" en cualquier plan
   - Validación automática (verifica espacio suficiente)
   - Actualización inmediata en la UI
   - Reload de página para actualizar widget

4. **Sincronización**:
   - El widget de almacenamiento se actualiza automáticamente
   - La tabla `planes_uso_coach` refleja el uso real

## 📋 Próximos Pasos (Opcionales)

1. **Trigger en Base de Datos**:
   - Implementar trigger que sincronice automáticamente cuando cambie `storage_usage`
   - Actualizar `planes_uso_coach` automáticamente

2. **Facturación**:
   - Integrar con sistema de pagos
   - Facturas automáticas por plan
   - Renovación automática

3. **Alertas**:
   - Notificar cuando se acerca al límite (80%, 90%, 100%)
   - Sugerir upgrade de plan automáticamente

4. **Historial**:
   - Registrar cambios de plan
   - Historial de uso de almacenamiento
   - Estadísticas de uso por período

## 🚀 Uso

### Para ejecutar la migración SQL:
```sql
-- Ejecutar en Supabase Dashboard
\i db/migrations/create-planes-uso-coach-table.sql
```

### El sistema está listo para usar:
- Los coaches verán su plan actual automáticamente
- Pueden cambiar de plan desde "Mi Suscripción"
- El widget de almacenamiento refleja el límite del plan activo

---

**Estado**: ✅ COMPLETADO Y FUNCIONANDO






























