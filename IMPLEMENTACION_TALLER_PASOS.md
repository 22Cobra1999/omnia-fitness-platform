# 🎯 Pasos para Implementar la Sección de Taller

## ✅ Lo que Ya está Hecho

He actualizado tu código para que pueda almacenar correctamente los datos de Taller:

### 1. **APIs Actualizadas** ✨

#### `/app/api/activities/route.ts` (POST - Crear Taller)
- ✅ Ahora recibe y guarda `workshop_type` y `workshop_schedule_blocks`
- ✅ Guarda `session_type`, `available_slots`, `available_times` directamente en `activities`
- ✅ Incluye `rich_description`, `duration`, `calories`, `program_duration`

#### `/app/api/activities/[id]/route.ts` (PUT - Actualizar Taller)
- ✅ Ahora actualiza todos los campos de Workshop en la tabla `activities`
- ✅ Eliminé duplicación de campos entre `activities` y `activity_availability`

---

## 🚀 Lo que TÚ Necesitas Hacer

### **Paso 1: Ejecutar el Script SQL en Supabase** 

Abre tu **Supabase SQL Editor** y ejecuta el archivo que creé:

📁 **Archivo:** `db/add-workshop-type-field.sql`

```sql
-- Este script agrega 2 campos nuevos a la tabla 'activities':
-- 1. workshop_type (presencial/virtual/híbrido)
-- 2. workshop_schedule_blocks (bloques de horarios JSONB)
```

**Cómo ejecutarlo:**
1. Ve a tu proyecto en Supabase
2. SQL Editor → Nueva query
3. Copia y pega el contenido de `db/add-workshop-type-field.sql`
4. Clic en "Run"

---

### **Paso 2: Verificar que Todo Está Correcto**

Ejecuta esta query en Supabase para confirmar que los campos existen:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN (
  'session_type', 
  'available_slots', 
  'available_times',
  'workshop_type',
  'workshop_schedule_blocks',
  'rich_description',
  'duration',
  'calories',
  'program_duration',
  'availability_type'
)
ORDER BY column_name;
```

**Deberías ver 10 campos** ✅

---

### **Paso 3: Probar la Creación de un Taller**

Ahora puedes probar crear un taller desde tu aplicación. El formulario debe enviar:

```typescript
const tallerData = {
  // Campos generales
  title: "Yoga Matutino",
  description: "Taller de yoga para principiantes",
  rich_description: "<p>Descripción enriquecida...</p>",
  type: "workshop",
  price: 50,
  coach_id: "tu-uuid",
  is_public: true,
  
  // Campos específicos de Taller
  session_type: "group",           // individual | group
  available_slots: 20,              // Número de cupos
  workshop_type: "presencial",      // presencial | virtual | hibrido
  availability_type: "immediate_purchase",
  
  // Horarios disponibles (formato simple)
  available_times: [
    {
      date: "2025-10-15",
      start_time: "10:00",
      end_time: "11:00"
    }
  ],
  
  // Bloques de horarios (desde WorkshopScheduleManager)
  workshop_schedule_blocks: [
    {
      id: "123456",
      name: "Sesión Matutina",
      startTime: "10:00",
      endTime: "11:00",
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      color: "bg-blue-500",
      selectedWeekDays: ["Lun", "Mié", "Vie"],
      selectedDates: [/* fechas generadas */],
      repeatType: "days",
      repeatValues: [],
      selectedWeeks: [],
      selectedMonths: []
    }
  ]
}
```

---

## 📊 Estructura de Datos Final

### **Tabla `activities` - Campos para Taller**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | TEXT | Nombre del taller |
| `description` | TEXT | Descripción corta |
| `rich_description` | TEXT | Descripción HTML enriquecida |
| `type` | TEXT | Debe ser `'workshop'` |
| `price` | NUMERIC | Precio del taller |
| `session_type` | TEXT | `'individual'` o `'group'` |
| `available_slots` | INTEGER | Cupos disponibles |
| `available_times` | JSONB | Array de horarios `{date, start_time, end_time}` |
| `workshop_type` | TEXT | `'presencial'`, `'virtual'`, `'hibrido'` |
| `workshop_schedule_blocks` | JSONB | Bloques del calendario (TimeBlocks) |
| `availability_type` | TEXT | Tipo de disponibilidad |
| `duration` | INTEGER | Duración en minutos |
| `is_public` | BOOLEAN | Si es visible públicamente |
| `coach_id` | UUID | ID del coach |

---

## 🎨 Flujo Completo

### **1. Usuario crea un Taller en el Frontend**
```
Componente: CreateProductModal
  ↓
Selecciona tipo: "workshop"
  ↓
Completa formulario:
  - Información general (título, descripción, precio)
  - Tipo de taller (presencial/virtual/híbrido)
  - Tipo de sesión (individual/grupal)
  - Cupos disponibles
  ↓
Configura horarios con WorkshopScheduleManager
  ↓
Genera bloques de horarios (TimeBlocks)
```

### **2. Frontend envía datos al API**
```javascript
const response = await fetch('/api/activities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tallerData)
})
```

### **3. API guarda en Supabase**
```
POST /api/activities
  ↓
Valida datos
  ↓
Inserta en tabla 'activities' con todos los campos
  ↓
Inserta datos relacionados en tablas auxiliares:
  - activity_media (imagen/video)
  - activity_availability (días/horas disponibles)
  - activity_consultation_info (si incluye consultas)
  ↓
Retorna actividad creada
```

### **4. Cliente compra el Taller**
```
Cliente hace compra
  ↓
Se crea registro en 'activity_enrollments'
  ↓
Se programa sesión en 'activity_schedules'
  ↓
Cliente recibe confirmación con:
  - Fecha y hora de la sesión
  - Link de Zoom (si es virtual)
  - Ubicación (si es presencial)
```

---

## 🔍 Verificación de Componentes

Verifica que tu formulario envíe estos campos:

### **En `product-form-modal.tsx`**
```typescript
// Asegúrate de que formData incluya:
const formData = {
  // ... otros campos
  workshop_type: "presencial",           // ⚠️ Nuevo
  workshop_schedule_blocks: timeBlocks   // ⚠️ Nuevo
}
```

### **En `create-product-modal-refactored.tsx`**
```typescript
// Al enviar al API:
const response = await fetch('/api/activities', {
  method: 'POST',
  body: JSON.stringify({
    // ... campos generales
    workshop_type: specificForm.workshopType,          // ⚠️ Agregar
    workshop_schedule_blocks: scheduleBlocks           // ⚠️ Agregar
  })
})
```

---

## ✅ Checklist Final

Antes de probar en producción:

- [ ] ✅ Ejecutar `db/add-workshop-type-field.sql` en Supabase
- [ ] ✅ Verificar que los 10 campos existen en `activities`
- [ ] ⚠️ Actualizar formulario para enviar `workshop_type`
- [ ] ⚠️ Actualizar formulario para enviar `workshop_schedule_blocks`
- [ ] ⚠️ Probar crear un taller desde el frontend
- [ ] ⚠️ Verificar que se guarda correctamente en Supabase
- [ ] ⚠️ Probar editar un taller existente
- [ ] ⚠️ Verificar que un cliente puede comprar el taller

---

## 🎯 Respuesta a tu Pregunta Original

> **"¿Necesitamos crear una nueva tabla o podemos usar las existentes?"**

**Respuesta:** ✅ **Puedes usar las tablas existentes**

Solo necesitas:
1. ✅ Agregar 2 campos a la tabla `activities` (script SQL ya creado)
2. ✅ Actualizar tus APIs (ya lo hice por ti)
3. ⚠️ Asegurarte de que tu formulario envíe los nuevos campos

**NO necesitas crear nuevas tablas.** Tu arquitectura actual es perfecta para manejar talleres.

---

## 📞 Próximos Pasos Recomendados

1. Ejecuta el script SQL
2. Verifica que tu formulario esté enviando `workshop_type` y `workshop_schedule_blocks`
3. Prueba crear un taller
4. Si tienes algún error, revisa los logs del API en la consola

**¿Listo para probar?** 🚀

Si necesitas ayuda con algún paso específico, avísame! 💪




