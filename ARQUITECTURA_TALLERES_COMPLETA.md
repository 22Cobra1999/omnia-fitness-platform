# 🏗️ Arquitectura Completa para Sistema de Talleres

## 📌 Tu Pregunta

> "¿Usamos las tablas existentes (ejecuciones_ejercicio, planificacion_ejercicios) o creamos una nueva para talleres?"

## ✅ Respuesta: **NO crear tabla nueva, MEJORAR la existente**

---

## 🎯 Arquitectura Recomendada

### **Tabla 1: `activities` (Información del Taller)**

Almacena los datos generales del taller:

```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  title TEXT,                          -- Nombre del taller
  description TEXT,
  type TEXT,                            -- 'workshop'
  coach_id UUID,
  price NUMERIC,
  
  -- CUPOS TOTALES (TU PUNTO #1)
  available_slots INTEGER,              -- ✅ 20 cupos totales
  
  -- Campos específicos para talleres
  session_type TEXT,                    -- 'individual' | 'group'
  workshop_type TEXT,                   -- 'presencial' | 'virtual' | 'hibrido'
  workshop_schedule_blocks JSONB,       -- Bloques de horarios configurados
  available_times JSONB                 -- [{date, start_time, end_time}]
);
```

**Ejemplo:**
```sql
INSERT INTO activities (title, type, available_slots, workshop_type)
VALUES ('Yoga Matutino', 'workshop', 20, 'presencial');
-- Este taller tiene 20 cupos totales
```

---

### **Tabla 2: `activity_schedules` (Reservas Individuales - TU PUNTO #2)**

**Esta es la tabla que necesitas usar** (ya existe, solo hay que mejorarla):

```sql
CREATE TABLE activity_schedules (
  id SERIAL PRIMARY KEY,
  
  -- Relaciones (TU PUNTO: fecha, activity_id, client_id, coach_id)
  activity_id INTEGER,                  -- ✅ ID del taller
  client_id UUID,                       -- ✅ ID del cliente
  coach_id UUID,                        -- ✅ ID del coach
  scheduled_date DATE,                  -- ✅ Fecha de la sesión
  scheduled_time TIME,
  
  -- Estado (TU PUNTO: reservado, disponible, ausente, completado)
  status TEXT,                          -- ✅ 'scheduled', 'completed', 'absent', 'cancelled'
  
  -- Campos adicionales útiles
  session_number INTEGER,               -- Número de sesión (1, 2, 3...)
  location TEXT,                        -- Ubicación (si es presencial)
  attendance_confirmed BOOLEAN,         -- Si el cliente confirmó asistencia
  zoom_link TEXT,                       -- Link de Zoom (si es virtual)
  rating INTEGER,                       -- Calificación del cliente (1-5)
  feedback TEXT,                        -- Comentarios de la sesión
  notes TEXT                            -- Notas del coach
);
```

**Ejemplo de uso:**
```sql
-- Cliente Juan reserva una sesión del taller "Yoga Matutino"
INSERT INTO activity_schedules (
  activity_id,
  client_id,
  coach_id,
  scheduled_date,
  scheduled_time,
  status,
  session_number
) VALUES (
  1,                                    -- ID del taller
  'uuid-juan',                          -- ID de Juan
  'uuid-coach',                         -- ID del coach
  '2025-10-15',                         -- Fecha
  '10:00:00',                           -- Hora
  'scheduled',                          -- Estado inicial
  1                                     -- Primera sesión
);

-- Juan asiste a la sesión
UPDATE activity_schedules 
SET status = 'completed'
WHERE id = 1;

-- Juan no asiste a la sesión
UPDATE activity_schedules 
SET status = 'absent'
WHERE id = 1;
```

---

## 🔄 Flujo Completo del Sistema

### **Escenario: Taller "Yoga Matutino" con 20 cupos**

#### **1. Coach crea el taller**
```sql
-- Se guarda en 'activities'
INSERT INTO activities (
  title, 
  type, 
  available_slots,      -- 20 cupos totales
  workshop_type,
  session_type
) VALUES (
  'Yoga Matutino',
  'workshop',
  20,                   -- Máximo 20 personas
  'presencial',
  'group'
);
```

#### **2. Cliente compra/se inscribe al taller**
```sql
-- Se guarda en 'activity_enrollments' (inscripción general)
INSERT INTO activity_enrollments (
  activity_id,
  client_id,
  status
) VALUES (
  1,                    -- ID del taller
  'uuid-cliente',
  'active'
);
```

#### **3. Cliente reserva una sesión específica**
```sql
-- ANTES: Verificar que hay cupo
SELECT get_workshop_available_slots(
  1,                    -- activity_id
  '2025-10-15',        -- fecha
  '10:00:00'           -- hora
);
-- Retorna: 5 (quedan 5 cupos de 20)

-- SI HAY CUPO: Crear la reserva
INSERT INTO activity_schedules (
  activity_id,
  client_id,
  coach_id,
  scheduled_date,
  scheduled_time,
  status
) VALUES (
  1,
  'uuid-cliente',
  'uuid-coach',
  '2025-10-15',
  '10:00:00',
  'scheduled'
);
```

#### **4. Trackear asistencia**
```sql
-- Cliente asiste
UPDATE activity_schedules 
SET status = 'completed', 
    attendance_confirmed = TRUE
WHERE id = 123;

-- Cliente no asiste
UPDATE activity_schedules 
SET status = 'absent'
WHERE id = 123;

-- Cliente cancela
UPDATE activity_schedules 
SET status = 'cancelled'
WHERE id = 123;
```

#### **5. Ver reporte de asistencia**
```sql
-- Usar la vista creada
SELECT * FROM workshop_attendance_report
WHERE activity_id = 1;

-- Resultado:
-- workshop_name      | scheduled_date | total_slots | scheduled_count | completed_count | absent_count | available_slots_remaining
-- Yoga Matutino      | 2025-10-15     | 20          | 18              | 15              | 3            | 2
```

---

## ⚖️ ¿Por qué NO usar `ejecuciones_ejercicio`?

### **Tabla `ejecuciones_ejercicio` es para PROGRAMAS:**

```sql
CREATE TABLE ejecuciones_ejercicio (
  periodo_id INTEGER,           -- ❌ No aplica a talleres
  ejercicio_id INTEGER,         -- ❌ No hay "ejercicios" en talleres
  intensidad_aplicada TEXT,     -- ❌ No hay intensidades en talleres
  completado BOOLEAN,           -- ✅ Podría ser útil, pero...
  nota_cliente TEXT
);
```

**Problemas:**
- ❌ Tiene columnas que NO usarías (periodo_id, ejercicio_id, intensidad)
- ❌ Es conceptualmente incorrecta (es para ejercicios, no para sesiones)
- ❌ Mezclaría datos de programas con datos de talleres
- ❌ Dificultaría las queries (tendrías que filtrar por tipo)

### **Tabla `activity_schedules` es para TALLERES:**

```sql
CREATE TABLE activity_schedules (
  activity_id INTEGER,          -- ✅ ID del taller
  client_id UUID,               -- ✅ ID del cliente
  scheduled_date DATE,          -- ✅ Fecha de la sesión
  scheduled_time TIME,          -- ✅ Hora de la sesión
  status TEXT,                  -- ✅ Estado de asistencia
  session_number INTEGER        -- ✅ Número de sesión
);
```

**Ventajas:**
- ✅ Diseñada específicamente para sesiones programadas
- ✅ Todas las columnas son relevantes
- ✅ Separa conceptualmente programas de talleres
- ✅ Fácil de consultar y mantener

---

## 📊 Comparación Directa

| Característica | `ejecuciones_ejercicio` | `activity_schedules` |
|----------------|------------------------|----------------------|
| **Propósito** | Ejecutar ejercicios de programas | Sesiones programadas de talleres |
| **Columnas útiles** | 40% | 100% |
| **Complejidad** | Alta (muchas relaciones) | Baja (simple y directa) |
| **Mezcla de conceptos** | ❌ Sí | ✅ No |
| **Facilidad de consultas** | ❌ Difícil | ✅ Fácil |
| **Recomendado para talleres** | ❌ NO | ✅ SÍ |

---

## 🚀 Pasos de Implementación

### **1. Ejecutar script de mejoras**

```bash
# Ejecuta estos 2 scripts en Supabase SQL Editor:
1. db/add-workshop-type-field.sql
2. db/mejoras-activity-schedules-talleres.sql
```

### **2. Estructura final de datos**

**Tabla `activities`:**
- `available_slots` = Cupos totales (ej: 20)
- `workshop_type` = Tipo de taller
- `workshop_schedule_blocks` = Configuración de horarios

**Tabla `activity_schedules`:**
- Cada fila = 1 cliente en 1 sesión específica
- Status: `scheduled`, `completed`, `absent`, `cancelled`

### **3. Ejemplo completo de uso**

```typescript
// Frontend - Crear taller
const crearTaller = async () => {
  const response = await fetch('/api/activities', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Yoga Matutino',
      type: 'workshop',
      available_slots: 20,        // Cupos totales
      workshop_type: 'presencial',
      session_type: 'group'
    })
  });
};

// Frontend - Reservar sesión
const reservarSesion = async (activityId, fecha, hora) => {
  // 1. Verificar cupo
  const { data: cuposDisponibles } = await supabase
    .rpc('get_workshop_available_slots', {
      p_activity_id: activityId,
      p_scheduled_date: fecha,
      p_scheduled_time: hora
    });
  
  if (cuposDisponibles <= 0) {
    alert('No hay cupos disponibles');
    return;
  }
  
  // 2. Crear reserva
  const { data, error } = await supabase
    .from('activity_schedules')
    .insert({
      activity_id: activityId,
      client_id: clientId,
      coach_id: coachId,
      scheduled_date: fecha,
      scheduled_time: hora,
      status: 'scheduled'
    });
};

// Frontend - Marcar asistencia
const marcarAsistencia = async (scheduleId, estado) => {
  const { data, error } = await supabase
    .from('activity_schedules')
    .update({ status: estado })  // 'completed' | 'absent'
    .eq('id', scheduleId);
};
```

---

## ✅ Conclusión y Recomendación Final

### **NO crear tabla nueva**
### **NO usar `ejecuciones_ejercicio`**
### **SÍ usar `activity_schedules` con mejoras**

**Razones:**
1. ✅ Ya existe y está diseñada para esto
2. ✅ Tiene exactamente los campos que necesitas
3. ✅ Solo necesita pequeñas mejoras (agregar 'absent' al status)
4. ✅ Mantiene separación de conceptos (programas ≠ talleres)
5. ✅ Más fácil de mantener y consultar
6. ✅ Escalable para futuras funcionalidades

**Scripts a ejecutar:**
1. `db/add-workshop-type-field.sql` - Agrega campos de taller a `activities`
2. `db/mejoras-activity-schedules-talleres.sql` - Mejora `activity_schedules` para talleres

---

## 📞 Siguiente Paso

Ejecuta los 2 scripts SQL y prueba crear un taller. La estructura está lista para:
- ✅ Almacenar cupos totales en `activities`
- ✅ Trackear reservas individuales en `activity_schedules`
- ✅ Estados: reservado, completado, ausente, cancelado
- ✅ Reportes de asistencia
- ✅ Funciones para verificar cupos disponibles

**¿Listo para implementar?** 🚀




