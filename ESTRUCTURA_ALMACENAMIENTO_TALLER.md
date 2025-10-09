# 🏗️ Estructura de Almacenamiento para la Sección de Taller

## 📋 Resumen Ejecutivo

**¿Necesitas crear nuevas tablas?** ❌ **NO**

**¿Qué necesitas hacer?** ✅ Solo agregar **2 campos** a la tabla `activities` existente.

---

## 🔍 Análisis de la Situación

### Campos que usa tu sección de Taller:

1. **`session_type`** → Ya existe ✅
2. **`available_slots`** → Ya existe ✅  
3. **`available_times`** → Ya existe ✅
4. **`workshop_type`** → **Necesita agregarse** ⚠️
5. **`workshop_schedule_blocks`** → **Necesita agregarse** ⚠️

---

## 📊 Estructura de Datos Completa

### Tabla Principal: `activities`

```typescript
interface WorkshopActivity {
  // Campos generales (ya existen)
  id: number
  title: string
  description: string
  rich_description: string | null
  type: 'workshop'  // Tipo de producto
  price: number
  image_url: string | null
  is_public: boolean
  availability_type: string
  coach_id: uuid
  
  // Campos específicos de Taller (mayoría ya existen)
  session_type: 'individual' | 'group'          // ✅ Ya existe
  available_slots: number                        // ✅ Ya existe
  available_times: Array<{                       // ✅ Ya existe
    date: string
    start_time: string
    end_time: string
  }>
  
  // Campos nuevos que necesitas agregar
  workshop_type: 'presencial' | 'virtual' | 'hibrido'  // ⚠️ Agregar
  workshop_schedule_blocks: TimeBlock[]                 // ⚠️ Agregar
}

// Estructura de TimeBlock (se almacena en workshop_schedule_blocks)
interface TimeBlock {
  id: string
  name: string
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  color: string
  selectedDates: Date[]
  repeatType: 'days' | 'weeks' | 'months'
  repeatValues: number[] | string[]
  selectedWeekDays: string[]
  selectedWeeks: number[]
  selectedMonths: string[]
}
```

---

## 🔧 Pasos para Implementar

### 1️⃣ Ejecutar el script SQL

He creado el archivo: **`db/add-workshop-type-field.sql`**

**Ejecuta este script en tu Supabase SQL Editor:**

```sql
-- Este script agrega los 2 campos faltantes:
-- 1. workshop_type (presencial/virtual/híbrido)
-- 2. workshop_schedule_blocks (bloques de horarios JSONB)
```

### 2️⃣ Verificar los campos existentes

Ejecuta esta query para confirmar que ya tienes los campos base:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN (
  'session_type', 
  'available_slots', 
  'available_times',
  'workshop_type',
  'workshop_schedule_blocks'
)
ORDER BY column_name;
```

Deberías ver **5 campos** después de ejecutar el script.

---

## 📦 Tablas Auxiliares (Ya Existentes)

### `activity_schedules`
**Propósito:** Sesiones programadas con clientes específicos

```sql
CREATE TABLE activity_schedules (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES activity_enrollments(id),
  client_id UUID REFERENCES auth.users(id),
  coach_id UUID REFERENCES auth.users(id),
  activity_id INTEGER REFERENCES activities(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT NOT NULL,  -- 'workshop', 'videocall', etc.
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  zoom_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cuándo se usa:** Cuando un cliente compra un taller y se le asigna una sesión específica.

---

### `activity_recurring_availability`
**Propósito:** Disponibilidad recurrente del coach para el taller

```sql
CREATE TABLE activity_recurring_availability (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id),
  coach_id UUID REFERENCES auth.users(id),
  day_of_week INTEGER NOT NULL,  -- 0=Domingo, 1=Lunes, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type TEXT NOT NULL,    -- 'workshop'
  max_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);
```

**Cuándo se usa:** Para definir horarios recurrentes (ej: "Todos los lunes 10-11am").

---

## 🎯 Flujo de Datos Completo

### Al crear un Taller:

```typescript
// 1. Guardar en tabla 'activities'
const tallerData = {
  type: 'workshop',
  title: 'Yoga Matutino',
  session_type: 'group',
  available_slots: 20,
  workshop_type: 'presencial',  // ⚠️ Nuevo campo
  workshop_schedule_blocks: [    // ⚠️ Nuevo campo
    {
      id: '123',
      name: 'Sesión 1',
      startTime: '10:00',
      endTime: '11:00',
      selectedWeekDays: ['Lun', 'Mié', 'Vie'],
      // ... resto de propiedades
    }
  ],
  available_times: [
    { date: '2025-10-15', start_time: '10:00', end_time: '11:00' }
  ]
}
```

### Al inscribir un cliente:

```typescript
// 2. Crear registro en 'activity_schedules'
const sesionProgramada = {
  activity_id: tallerData.id,
  client_id: 'uuid-del-cliente',
  coach_id: 'uuid-del-coach',
  scheduled_date: '2025-10-15',
  scheduled_time: '10:00:00',
  session_type: 'workshop',
  status: 'scheduled'
}
```

---

## ✅ Checklist Final

- [ ] Ejecutar `db/add-workshop-type-field.sql` en Supabase
- [ ] Verificar que los 5 campos existen en `activities`
- [ ] Actualizar el tipo TypeScript en tu código (si es necesario)
- [ ] Probar crear un taller con los nuevos campos
- [ ] Verificar que `workshop_schedule_blocks` se guarda correctamente

---

## 🚀 Conclusión

**No necesitas crear nuevas tablas.** La arquitectura actual de Supabase ya está preparada para manejar talleres. Solo necesitas:

1. ✅ Ejecutar el script SQL para agregar los 2 campos faltantes
2. ✅ Usar las tablas existentes (`activities`, `activity_schedules`, `activity_recurring_availability`)

Tu componente `WorkshopScheduleManager` ya genera la estructura correcta de datos que se almacenará en el campo `workshop_schedule_blocks` como JSONB.

---

## 📞 Próximos Pasos Recomendados

1. Ejecutar el script SQL
2. Actualizar tu API de creación de productos para incluir los nuevos campos
3. Verificar que el formulario envíe `workshop_type` y `workshop_schedule_blocks`
4. Probar la creación y edición de un taller

¿Necesitas ayuda con alguno de estos pasos? 🚀




