# 🎨 Guía Completa: Sistema de Temas para Talleres

## 📌 ¿Qué problema resuelve?

Ahora puedes crear talleres con **múltiples temas**, donde cada tema puede tener:
- **Horario Original** (ej: Lunes, Miércoles, Viernes 10:00-11:00)
- **Horario BIS** (2do horario) (ej: Martes, Jueves 18:00-19:00)
- **Color identificador** para visualizar en el calendario
- **Control de cupos independiente** por tema y horario

---

## 🏗️ Estructura de Datos

### **Tabla: `workshop_topics`**

Almacena los temas/módulos del taller:

```typescript
interface WorkshopTopic {
  id: number
  activity_id: number              // ID del taller
  
  // Información del tema
  topic_number: number              // 1, 2, 3...
  topic_title: string               // "Introducción al Yoga"
  topic_description: string         // Descripción del tema
  color: string                     // "bg-blue-500" para el calendario
  
  // Horario ORIGINAL
  original_days: string[]           // ["Lun", "Mié", "Vie"]
  original_start_time: string       // "10:00:00"
  original_end_time: string         // "11:00:00"
  original_dates: Date[]            // Fechas generadas
  
  // Horario BIS (segundo horario)
  bis_enabled: boolean              // true si tiene 2do horario
  bis_days: string[]                // ["Mar", "Jue"]
  bis_start_time: string            // "18:00:00"
  bis_end_time: string              // "19:00:00"
  bis_dates: Date[]                 // Fechas generadas
  
  // Período
  start_date: string                // "2025-10-01"
  end_date: string                  // "2025-10-31"
}
```

### **Tabla: `activity_schedules` (actualizada)**

Ahora incluye referencia al tema y variante:

```typescript
interface ActivitySchedule {
  id: number
  activity_id: number
  client_id: string
  coach_id: string
  
  // NUEVO: Referencia al tema
  topic_id: number                  // ID del tema
  
  // NUEVO: Indica si es horario original o bis
  schedule_variant: 'original' | 'bis'
  
  // Datos de la sesión
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'completed' | 'absent' | 'cancelled'
}
```

---

## 🎯 Flujo Completo de Uso

### **Paso 1: Crear el Taller Base**

```sql
-- Crear el taller en 'activities'
INSERT INTO activities (
  title,
  type,
  available_slots,
  workshop_type,
  session_type,
  coach_id
) VALUES (
  'Curso de Yoga Integral',
  'workshop',
  20,                           -- 20 cupos por sesión
  'presencial',
  'group',
  'uuid-coach'
) RETURNING id;                 -- Supongamos que retorna ID = 1
```

---

### **Paso 2: Crear Tema #1 con Horario Original y BIS**

```sql
-- Tema 1: "Introducción al Yoga"
-- Horario Original: Lunes, Miércoles, Viernes 10:00-11:00
-- Horario BIS: Martes, Jueves 18:00-19:00

INSERT INTO workshop_topics (
  activity_id,
  topic_number,
  topic_title,
  topic_description,
  color,
  schedule_type,
  
  -- Horario ORIGINAL
  original_days,
  original_start_time,
  original_end_time,
  
  -- Horario BIS
  bis_enabled,
  bis_days,
  bis_start_time,
  bis_end_time,
  
  start_date,
  end_date
) VALUES (
  1,                                    -- ID del taller
  1,                                    -- Tema #1
  'Introducción al Yoga',
  'Fundamentos básicos de yoga',
  'bg-blue-500',                        -- Color azul para este tema
  'dual',                               -- Tiene original + bis
  
  -- ORIGINAL: Lun, Mié, Vie 10:00-11:00
  '["Lun", "Mié", "Vie"]'::JSONB,
  '10:00:00',
  '11:00:00',
  
  -- BIS: Mar, Jue 18:00-19:00
  TRUE,                                 -- Bis habilitado
  '["Mar", "Jue"]'::JSONB,
  '18:00:00',
  '19:00:00',
  
  '2025-10-01',
  '2025-10-31'
) RETURNING id;                         -- Supongamos que retorna ID = 100
```

**Resultado en el calendario:**
- ✅ Lunes 10:00 → Marcado en azul (original)
- ✅ Martes 18:00 → Marcado en azul con símbolo "BIS"
- ✅ Miércoles 10:00 → Marcado en azul (original)
- ✅ Jueves 18:00 → Marcado en azul con símbolo "BIS"
- ✅ Viernes 10:00 → Marcado en azul (original)

---

### **Paso 3: Crear Tema #2 (solo horario original)**

```sql
-- Tema 2: "Posturas Avanzadas"
-- Solo horario original: Lunes, Miércoles 14:00-15:00

INSERT INTO workshop_topics (
  activity_id,
  topic_number,
  topic_title,
  color,
  schedule_type,
  
  original_days,
  original_start_time,
  original_end_time,
  
  bis_enabled,
  
  start_date,
  end_date
) VALUES (
  1,
  2,
  'Posturas Avanzadas',
  'bg-green-500',                       -- Color verde para este tema
  'single',                             -- Solo horario original
  
  '["Lun", "Mié"]'::JSONB,
  '14:00:00',
  '15:00:00',
  
  FALSE,                                -- No tiene bis
  
  '2025-11-01',
  '2025-11-30'
);
```

**Resultado en el calendario:**
- ✅ Lunes 14:00 → Marcado en verde
- ✅ Miércoles 14:00 → Marcado en verde

---

### **Paso 4: Cliente reserva una sesión**

```sql
-- Cliente Juan reserva el Tema #1 en horario BIS
-- Fecha: Martes 15 de Octubre, 18:00

-- ANTES: Verificar que hay cupo
SELECT get_topic_available_slots(
  100,                -- topic_id (Tema #1)
  '2025-10-15',      -- fecha (martes)
  '18:00:00',        -- hora
  'bis'              -- variante (horario bis)
);
-- Retorna: 18 (quedan 18 cupos de 20)

-- SI HAY CUPO: Crear la reserva
INSERT INTO activity_schedules (
  activity_id,
  topic_id,
  client_id,
  coach_id,
  scheduled_date,
  scheduled_time,
  schedule_variant,
  status,
  session_number
) VALUES (
  1,                  -- ID del taller
  100,                -- ID del tema
  'uuid-juan',
  'uuid-coach',
  '2025-10-15',
  '18:00:00',
  'bis',              -- ✅ Indica que es horario BIS
  'scheduled',
  1
);
```

---

### **Paso 5: Ver resumen de cupos por tema**

```sql
-- Ver cupos disponibles del Tema #1 para el 15 de Octubre
SELECT * FROM get_topic_slots_summary(100, '2025-10-15');
```

**Resultado:**
```
variante  | hora_inicio | hora_fin | total_cupos | cupos_ocupados | cupos_disponibles | porcentaje_ocupacion
----------|-------------|----------|-------------|----------------|-------------------|---------------------
original  | 10:00:00    | 11:00:00 | 20          | 0              | 20                | 0.00
bis       | 18:00:00    | 19:00:00 | 20          | 1              | 19                | 5.00
```

---

## 🎨 Visualización en el Calendario

### **Ejemplo de cómo se vería en el frontend:**

```
Octubre 2025

Lun    Mar    Mié    Jue    Vie
  1      2      3      4      5
🔵     🔵BIS  🔵     🔵BIS  🔵
10:00  18:00  10:00  18:00  10:00
Intro  Intro  Intro  Intro  Intro

  8      9     10     11     12
🔵     🔵BIS  🔵     🔵BIS  🔵
10:00  18:00  10:00  18:00  10:00
Intro  Intro  Intro  Intro  Intro
```

**Leyenda:**
- 🔵 = Tema "Introducción" (color azul)
- BIS = Horario bis (segundo horario)
- 10:00 = Horario original

---

## 🚀 Funciones Útiles

### **1. Verificar cupos disponibles**

```sql
-- Para horario ORIGINAL
SELECT get_topic_available_slots(
  100,              -- topic_id
  '2025-10-15',    -- fecha
  '10:00:00',      -- hora
  'original'       -- variante
);

-- Para horario BIS
SELECT get_topic_available_slots(
  100,              -- topic_id
  '2025-10-15',    -- fecha
  '18:00:00',      -- hora
  'bis'            -- variante
);
```

### **2. Verificar si hay disponibilidad**

```sql
-- Verificar si hay cupo
SELECT check_workshop_availability(
  p_topic_id := 100,
  p_scheduled_date := '2025-10-15',
  p_scheduled_time := '18:00:00',
  p_schedule_variant := 'bis'
);
-- Retorna: TRUE o FALSE
```

### **3. Ver todas las sesiones de un tema**

```sql
-- Generar todas las sesiones (original + bis) para un tema
SELECT * FROM generate_sessions_from_topic(100, 'uuid-coach')
ORDER BY fecha_generada, hora_inicio;
```

**Resultado:**
```
fecha_generada | hora_inicio | hora_fin | variante  | dias_semana
---------------|-------------|----------|-----------|-------------
2025-10-01     | 10:00:00    | 11:00:00 | original  | Mié
2025-10-02     | 18:00:00    | 19:00:00 | bis       | Jue
2025-10-03     | 10:00:00    | 11:00:00 | original  | Vie
2025-10-06     | 10:00:00    | 11:00:00 | original  | Lun
2025-10-07     | 18:00:00    | 19:00:00 | bis       | Mar
...
```

### **4. Reporte de asistencia**

```sql
-- Ver reporte de asistencia consolidado
SELECT * FROM workshop_topics_schedule_view
WHERE activity_id = 1;
```

---

## 💻 Código Frontend (TypeScript)

### **Crear tema con horarios original y bis**

```typescript
const crearTema = async () => {
  const { data, error } = await supabase
    .from('workshop_topics')
    .insert({
      activity_id: 1,
      topic_number: 1,
      topic_title: 'Introducción al Yoga',
      topic_description: 'Fundamentos básicos',
      color: 'bg-blue-500',
      schedule_type: 'dual',
      
      // Horario original
      original_days: ['Lun', 'Mié', 'Vie'],
      original_start_time: '10:00:00',
      original_end_time: '11:00:00',
      
      // Horario bis
      bis_enabled: true,
      bis_days: ['Mar', 'Jue'],
      bis_start_time: '18:00:00',
      bis_end_time: '19:00:00',
      
      start_date: '2025-10-01',
      end_date: '2025-10-31'
    })
    .select()
    .single();
    
  return data;
};
```

### **Reservar sesión con indicador de variante**

```typescript
const reservarSesion = async (
  topicId: number,
  fecha: string,
  hora: string,
  variante: 'original' | 'bis'
) => {
  // 1. Verificar cupo
  const { data: cuposDisponibles } = await supabase
    .rpc('get_topic_available_slots', {
      p_topic_id: topicId,
      p_scheduled_date: fecha,
      p_scheduled_time: hora,
      p_schedule_variant: variante
    });
  
  if (cuposDisponibles <= 0) {
    alert(`No hay cupos en horario ${variante}`);
    return;
  }
  
  // 2. Crear reserva
  const { data, error } = await supabase
    .from('activity_schedules')
    .insert({
      activity_id: 1,
      topic_id: topicId,
      client_id: clientId,
      coach_id: coachId,
      scheduled_date: fecha,
      scheduled_time: hora,
      schedule_variant: variante,  // ✅ Indica original o bis
      status: 'scheduled'
    });
    
  return data;
};
```

### **Mostrar en el calendario con badge BIS**

```tsx
const CalendarDay = ({ tema, sesion }) => {
  return (
    <div 
      className={`p-2 rounded ${tema.color}`}
    >
      <p className="font-bold">{tema.topic_title}</p>
      <p>{sesion.hora_inicio}</p>
      
      {/* Badge BIS */}
      {sesion.schedule_variant === 'bis' && (
        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
          BIS
        </span>
      )}
    </div>
  );
};
```

---

## 📋 Scripts SQL a Ejecutar

### **Orden de ejecución:**

```bash
# 1. Crear campos básicos de taller en activities
db/add-workshop-type-field.sql

# 2. Mejorar activity_schedules con nuevos estados
db/mejoras-activity-schedules-talleres.sql

# 3. Crear tabla de temas y funciones
db/crear-tabla-workshop-topics.sql
```

---

## ✅ Resumen de Campos Clave

| Tabla | Campo | Valores | Significado |
|-------|-------|---------|-------------|
| `workshop_topics` | `schedule_type` | `'single'` o `'dual'` | Si tiene solo original o también bis |
| `workshop_topics` | `bis_enabled` | `true` / `false` | Si el horario bis está activo |
| `workshop_topics` | `original_days` | `["Lun", "Mié"]` | Días del horario original |
| `workshop_topics` | `bis_days` | `["Mar", "Jue"]` | Días del horario bis |
| `activity_schedules` | `topic_id` | `100` | ID del tema |
| `activity_schedules` | `schedule_variant` | `'original'` o `'bis'` | ✅ **Indicador original/bis** |

---

## 🎯 Ventajas del Sistema

✅ **Múltiples temas** en un solo taller
✅ **Dos horarios** por tema (original + bis)
✅ **Colores diferentes** para cada tema
✅ **Control de cupos independiente** por horario
✅ **Indicador visual** (original vs bis)
✅ **Flexibilidad total** para configurar días y horarios

---

## 🚀 ¿Listo para implementar?

1. Ejecuta los 3 scripts SQL en orden
2. Crea tu primer tema con horarios original y bis
3. Prueba las funciones de verificación de cupos
4. Implementa la UI con los badges "BIS"

**¡Tu sistema de talleres está completo!** 🎉




