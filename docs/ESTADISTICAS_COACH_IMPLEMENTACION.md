# 📊 Plan de Implementación: Estadísticas del Coach

## Estado Actual de las Estadísticas

### ✅ **1. Tasa de Respuesta (%)** - **LISTO CON DATOS REALES**

**Fuente de datos:**
- Tabla: `conversations` y `messages`
- Cálculo: Mensajes del cliente vs respuestas del coach

**Cómo funciona:**
- Busca todas las conversaciones del coach
- Cuenta mensajes enviados por clientes
- Cuenta respuestas del coach
- Calcula: `(respuestas / mensajes) * 100`

**Estado:** ✅ **IMPLEMENTADO** - Funciona con datos reales

---

### ✅ **2. Tiempo Promedio de Respuesta** - **LISTO CON DATOS REALES**

**Fuente de datos:**
- Tabla: `messages`
- Cálculo: Diferencia entre mensaje del cliente y respuesta del coach

**Cómo funciona:**
- Para cada mensaje del cliente, busca la siguiente respuesta del coach
- Calcula la diferencia de tiempo
- Promedia todas las respuestas

**Estado:** ✅ **IMPLEMENTADO** - Funciona con datos reales

---

### ⚠️ **3. Cancelaciones del Coach** - **PARCIALMENTE IMPLEMENTADO**

**Fuentes de datos actuales:**
- ✅ `calendar_events` (status = 'cancelled')
- ✅ `activity_schedules` (status = 'cancelled')

**Qué incluye:**
- Cancelaciones de eventos del calendario
- Cancelaciones de sesiones programadas (talleres, clases virtuales)

**Qué falta:**
- ❌ Diferenciar cancelaciones del coach vs del cliente
- ❌ Agregar campo `cancelled_by` en `calendar_events` y `activity_schedules`
- ❌ Filtrar solo cancelaciones hechas por el coach

**Implementación necesaria:**
```sql
-- Agregar campo para identificar quién canceló
ALTER TABLE calendar_events 
ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);

ALTER TABLE activity_schedules 
ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);
```

**Estado:** ⚠️ **PARCIAL** - Cuenta todas las cancelaciones, no solo las del coach

---

### ⚠️ **4. Reprogramaciones Tardías** - **PARCIALMENTE IMPLEMENTADO**

**Fuentes de datos actuales:**
- ✅ `calendar_events` (status = 'rescheduled')
- ✅ `activity_schedules` (status = 'rescheduled')

**Qué incluye:**
- Reprogramaciones dentro de 12-24h antes del evento

**Qué falta:**
- ❌ Campo `rescheduled_at` para saber CUÁNDO se reprogramó
- ❌ Campo `rescheduled_by` para saber QUIÉN reprogramó
- ❌ Comparar `rescheduled_at` con `start_time` para detectar tardías

**Implementación necesaria:**
```sql
-- Agregar campos para tracking de reprogramaciones
ALTER TABLE calendar_events 
ADD COLUMN rescheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rescheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN original_start_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE activity_schedules 
ADD COLUMN rescheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rescheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN original_scheduled_date DATE,
ADD COLUMN original_scheduled_time TIME;
```

**Estado:** ⚠️ **PARCIAL** - Detecta reprogramaciones pero no puede verificar si fueron tardías

---

### ⚠️ **5. Asistencia / Puntualidad del Coach** - **NECESITA MEJORAS**

**Fuentes de datos actuales:**
- ✅ `calendar_events` (status = 'completed' vs 'scheduled')
- ✅ `activity_schedules` (status = 'completed' vs 'scheduled')

**Qué incluye:**
- Eventos completados vs programados

**Qué falta:**
- ❌ **Datos de Google Meet** para asistencia real
- ❌ Tracking de hora de llegada (puntualidad)
- ❌ Diferenciar asistencia del coach vs del cliente

**Tablas disponibles para Google Meet:**
- ✅ `google_meet_links` - Tiene campos:
  - `coach_joined_at` - Cuándo se unió el coach
  - `client_joined_at` - Cuándo se unió el cliente
  - `meeting_started_at` - Cuándo empezó la reunión
  - `meeting_ended_at` - Cuándo terminó
  - `coach_attendance_status` - Estado de asistencia del coach
  - `client_attendance_status` - Estado de asistencia del cliente
  - `actual_duration_minutes` - Duración real

- ✅ `meeting_attendance_logs` - Logs detallados:
  - `joined_at` - Hora de entrada
  - `left_at` - Hora de salida
  - `total_time_minutes` - Tiempo total
  - `participant_type` - 'coach' o 'client'

**Implementación necesaria:**
1. Conectar `calendar_events` con `google_meet_links` (ya existe `calendar_event_id`)
2. Usar `coach_joined_at` vs `start_time` para calcular puntualidad
3. Usar `coach_attendance_status` para determinar asistencia
4. Para talleres, usar `ejecuciones_taller` con campo `asistio` en `temas_cubiertos`

**Estado:** ⚠️ **PARCIAL** - Usa status 'completed' pero no datos reales de Google Meet

---

### ⚠️ **6. Incidentes Reportados por Clientes** - **BÁSICO**

**Fuente de datos actual:**
- ✅ `messages` - Búsqueda por palabras clave

**Qué incluye:**
- Detección básica por palabras: 'queja', 'problema', 'disputa', 'reclamo', etc.

**Qué falta:**
- ❌ Sistema formal de reportes/quejas
- ❌ Tabla dedicada para incidentes
- ❌ Clasificación de incidentes (leve, moderado, grave)
- ❌ Estado de resolución

**Implementación recomendada:**
```sql
-- Crear tabla de incidentes
CREATE TABLE coach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  incident_type TEXT CHECK (incident_type IN ('complaint', 'dispute', 'technical_issue', 'other')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Estado:** ⚠️ **BÁSICO** - Detección por palabras clave, no sistema formal

---

## 📋 Resumen por Fuente de Datos

### **Talleres y Clases Virtuales**

**Tablas:**
- `activity_schedules` - Sesiones programadas
- `ejecuciones_taller` - Ejecución de talleres con asistencia
- `calendar_events` - Eventos del calendario

**Datos disponibles:**
- ✅ Status (scheduled, completed, cancelled, rescheduled)
- ✅ Fechas y horarios
- ✅ Tipo de sesión (videocall, workshop, program_session)

**Datos faltantes:**
- ❌ Quién canceló/reprogramó
- ❌ Cuándo se canceló/reprogramó
- ❌ Asistencia real del coach (necesita Google Meet)

---

### **Google Meet - Asistencia y Duración**

**Tablas disponibles:**
- ✅ `google_meet_links` - Links y tracking básico
- ✅ `meeting_attendance_logs` - Logs detallados

**Datos disponibles:**
- ✅ `coach_joined_at` - Hora de entrada del coach
- ✅ `client_joined_at` - Hora de entrada del cliente
- ✅ `meeting_started_at` - Inicio de la reunión
- ✅ `meeting_ended_at` - Fin de la reunión
- ✅ `actual_duration_minutes` - Duración real
- ✅ `coach_attendance_status` - Estado (pending, present, absent, late)
- ✅ `meeting_attendance_logs` - Logs con `joined_at`, `left_at`, `total_time_minutes`

**Qué falta:**
- ❌ **Sincronización automática** con Google Meet API
- ❌ **Webhook** para actualizar datos cuando alguien se une/sale
- ❌ **Integración** entre `calendar_events` y `google_meet_links`

**Implementación necesaria:**
1. Webhook de Google Meet para actualizar `meeting_attendance_logs`
2. Job que sincronice datos de Google Meet API
3. Actualizar `coach_attendance_status` basado en `coach_joined_at` vs `start_time`

---

## 🎯 Plan de Implementación por Prioridad

### **FASE 1: Mejorar Cancelaciones y Reprogramaciones** (Alta prioridad)

**Tareas:**
1. Agregar campos `cancelled_by` y `rescheduled_by` a las tablas
2. Agregar campos `cancelled_at` y `rescheduled_at`
3. Modificar endpoints de cancelación/reprogramación para guardar estos datos
4. Actualizar query de estadísticas para filtrar solo cancelaciones del coach

**Archivos a modificar:**
- `app/api/coach/stats/route.ts` - Actualizar queries
- Endpoints de cancelación/reprogramación (buscar en `app/api/calendar/` o `app/api/activities/`)

---

### **FASE 2: Integrar Google Meet para Asistencia** (Alta prioridad)

**Tareas:**
1. Crear endpoint para recibir webhooks de Google Meet
2. Crear job que sincronice datos de Google Meet API
3. Actualizar `coach_attendance_status` basado en datos reales
4. Calcular puntualidad: `coach_joined_at` vs `start_time`
5. Actualizar query de estadísticas para usar datos de Google Meet

**Archivos a crear/modificar:**
- `app/api/google/meet/webhook/route.ts` - Webhook handler
- `app/api/google/meet/sync/route.ts` - Sincronización manual
- `app/api/coach/stats/route.ts` - Usar datos de `google_meet_links`

---

### **FASE 3: Sistema de Incidentes** (Media prioridad)

**Tareas:**
1. Crear tabla `coach_incidents`
2. Crear endpoint para reportar incidentes
3. Mejorar detección automática en mensajes
4. Actualizar query de estadísticas

---

### **FASE 4: Mejorar Detección de Reprogramaciones Tardías** (Media prioridad)

**Tareas:**
1. Agregar campos `rescheduled_at` y `original_start_time`
2. Modificar lógica de reprogramación para guardar estos datos
3. Actualizar query para comparar `rescheduled_at` con `start_time`

---

## 📝 Queries SQL Necesarias

### 1. Agregar campos de tracking a calendar_events

```sql
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rescheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_start_time TIMESTAMP WITH TIME ZONE;
```

### 2. Agregar campos de tracking a activity_schedules

```sql
ALTER TABLE activity_schedules 
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rescheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_scheduled_date DATE,
ADD COLUMN IF NOT EXISTS original_scheduled_time TIME;
```

### 3. Query mejorada para asistencia con Google Meet

```sql
-- Asistencia del coach usando Google Meet
SELECT 
  ce.id,
  ce.start_time,
  ce.status,
  gml.coach_joined_at,
  gml.coach_attendance_status,
  gml.actual_duration_minutes,
  CASE 
    WHEN gml.coach_joined_at IS NULL THEN 'absent'
    WHEN gml.coach_joined_at <= ce.start_time + INTERVAL '5 minutes' THEN 'on_time'
    WHEN gml.coach_joined_at <= ce.start_time + INTERVAL '15 minutes' THEN 'late'
    ELSE 'very_late'
  END as punctuality_status
FROM calendar_events ce
LEFT JOIN google_meet_links gml ON gml.calendar_event_id = ce.id
WHERE ce.coach_id = $1
  AND ce.start_time >= NOW() - INTERVAL '30 days'
  AND ce.event_type IN ('consultation', 'workout', 'workshop');
```

---

## 🔗 Conexiones entre Tablas

```
calendar_events
  ├── google_meet_links (calendar_event_id)
  │     └── meeting_attendance_logs (meet_link_id)
  │
  └── activity_schedules (relación indirecta vía activity_id)

activity_schedules
  └── ejecuciones_taller (relación indirecta vía activity_id)
        └── temas_cubiertos JSONB (contiene asistencia)
```

---

## ✅ Checklist de Implementación

### Cancelaciones
- [ ] Agregar `cancelled_by` y `cancelled_at` a `calendar_events`
- [ ] Agregar `cancelled_by` y `cancelled_at` a `activity_schedules`
- [ ] Modificar endpoints de cancelación para guardar estos datos
- [ ] Actualizar query de estadísticas para filtrar por `cancelled_by = coach_id`

### Reprogramaciones Tardías
- [ ] Agregar `rescheduled_by`, `rescheduled_at`, `original_start_time` a `calendar_events`
- [ ] Agregar campos equivalentes a `activity_schedules`
- [ ] Modificar endpoints de reprogramación para guardar estos datos
- [ ] Actualizar query para detectar reprogramaciones dentro de 12-24h

### Asistencia con Google Meet
- [ ] Crear webhook handler para Google Meet
- [ ] Crear job de sincronización con Google Meet API
- [ ] Actualizar `coach_attendance_status` automáticamente
- [ ] Calcular puntualidad basado en `coach_joined_at` vs `start_time`
- [ ] Actualizar query de estadísticas para usar datos de Google Meet

### Incidentes
- [ ] Crear tabla `coach_incidents`
- [ ] Crear endpoint para reportar incidentes
- [ ] Mejorar detección automática en mensajes
- [ ] Actualizar query de estadísticas

---

## 📊 Métricas Actuales vs Ideales

| Métrica | Estado Actual | Fuente Actual | Fuente Ideal |
|---------|---------------|---------------|--------------|
| Tasa de respuesta | ✅ Listo | `messages` | `messages` |
| Tiempo de respuesta | ✅ Listo | `messages` | `messages` |
| Cancelaciones | ⚠️ Parcial | `calendar_events`, `activity_schedules` | + `cancelled_by` |
| Reprogramaciones tardías | ⚠️ Parcial | `calendar_events`, `activity_schedules` | + `rescheduled_at` |
| Asistencia | ⚠️ Parcial | `status = 'completed'` | `google_meet_links` |
| Incidentes | ⚠️ Básico | Detección por palabras | Tabla `coach_incidents` |

