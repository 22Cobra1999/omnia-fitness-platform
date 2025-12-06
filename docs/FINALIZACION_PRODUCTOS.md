# Finalización de Productos - Flujo Completo

## 📋 Resumen

Este documento describe el flujo completo cuando un coach finaliza un taller (workshop) y las diferentes decisiones que se toman en cada paso del proceso.

## 🔄 Flujo Principal

### 1. Coach Finaliza un Taller

**Decisión A: ¿Es la primera vez que finaliza este taller?**
- ✅ **Sí** → Se crea la **versión 1** en `workshop_versions`
- ❌ **No** → Se crea una **nueva versión** (2, 3, 4...) en `workshop_versions`

**Decisión B: ¿El coach ya respondió la encuesta para esta versión?**
- Verificar en `activity_surveys`:
  - `activity_id` = ID del taller
  - `client_id` = ID del coach
  - `workshop_version` = versión actual
- ✅ **Sí** → No crear nueva encuesta (ya existe para esta versión)
- ❌ **No** → Encuesta pendiente para esta versión

---

### 2. Coach Abre el Detalle del Taller Finalizado

**Decisión C: ¿Ya respondió la encuesta para la versión actual?**
- ✅ **Sí** → **NO mostrar encuesta** (ya respondió para esta versión)
- ❌ **No** → **Mostrar encuesta** (cerrable, puede ver el detalle)

**Comportamiento:**
- La encuesta aparece automáticamente al abrir el detalle
- El coach puede cerrarla para ver el detalle del producto
- La encuesta permanece pendiente hasta que se complete

---

### 3. Coach Intenta Editar el Taller

**Decisión D: ¿Ya respondió la encuesta para la versión actual?**
- ✅ **Sí** → **NO mostrar encuesta**, permitir editar directamente
- ❌ **No** → **Mostrar encuesta** (obligatoria, debe completarla para editar)

**Comportamiento:**
- Si la encuesta está pendiente, aparece de forma **bloqueante**
- El coach **NO puede editar** hasta completar la encuesta
- Una vez completada, puede editar normalmente

---

### 4. Después de Completar la Encuesta

**Decisión E: ¿Qué quiere hacer el coach?**

#### Opción 1: "No, cerrar"
- Cierra el modal de encuesta
- Vuelve al detalle del taller
- Taller permanece **finalizado** (versión actual, inactivo)
- Encuesta ya respondida para esta versión → **NO aparece de nuevo**

#### Opción 2: "Agregar nuevas fechas"
- Se abre el modal de edición en el **paso 5** (workshop schedule)
- Aparece el mensaje: **"Reemplaza tus fechas por nuevas"**
- Dos sub-escenarios:

##### Sub-escenario 2A: Coach agrega fechas y guarda
- Se crea una **nueva versión** (ej: versión 4)
- Taller se **reactiva** con nuevas fechas
- Cuando finalice la versión 4, aparecerá la encuesta de nuevo (nueva versión = nueva encuesta)

##### Sub-escenario 2B: Coach se arrepiente y cierra sin guardar
- Cierra el modal de edición **sin guardar cambios**
- Taller permanece en la **versión actual** (ej: versión 3)
- Taller permanece **inactivo** (fechas antiguas, no nuevas)
- Encuesta ya respondida para versión 3 → **NO aparece de nuevo**
- El coach puede ver el detalle o intentar editar sin que aparezca la encuesta

---

## 🔑 Reglas Clave

### Regla 1: Una Encuesta por Versión
- El coach responde **una vez por cada versión** del taller
- Si ya respondió para la versión 3, **NO aparece de nuevo** para la versión 3
- Si finaliza y crea la versión 4, debe responder de nuevo (nueva versión = nueva encuesta)

### Regla 2: Encuesta Completada es Permanente
- Una vez que el coach responde la encuesta para una versión, esa encuesta queda **completada para esa versión**
- **NO importa** si luego agrega nuevas fechas o no
- La encuesta **NO aparece de nuevo** para esa versión

### Regla 3: Nueva Versión = Nueva Encuesta
- Solo cuando se crea una **nueva versión** (agregando fechas y guardando), aparece una nueva encuesta
- Si cierra sin guardar, **NO se crea nueva versión**, por lo tanto **NO hay nueva encuesta**

---

## 📊 Ejemplo Práctico

### Escenario Completo

1. **Taller versión 1 finaliza** → Coach responde encuesta (versión 1) ✅
2. **Coach agrega nuevas fechas** → Taller versión 2 finaliza → Coach responde encuesta (versión 2) ✅
3. **Coach abre detalle versión 2** → NO aparece encuesta (ya respondió para versión 2) ✅
4. **Coach intenta editar versión 2** → NO aparece encuesta (ya respondió para versión 2) ✅
5. **Coach agrega nuevas fechas** → Taller versión 3 finaliza → Coach responde encuesta (versión 3) ✅
6. **Coach elige "Agregar nuevas fechas"** → Se abre paso 5 con mensaje "Reemplaza tus fechas por nuevas"
7. **Coach se arrepiente y cierra sin guardar** → Taller sigue en versión 3, inactivo
8. **Coach abre detalle o intenta editar** → NO aparece encuesta (ya respondió para versión 3) ✅

---

## 🗄️ Estructura de Datos

### Tabla `activities`
- `workshop_versions`: JSONB que almacena las versiones del taller
  ```json
  {
    "versions": [
      {"version": 1, "empezada_el": "01/09/25", "finalizada_el": "24/10/25"},
      {"version": 2, "empezada_el": "01/09/25", "finalizada_el": "02/12/25"},
      {"version": 3, "empezada_el": "01/09/25", "finalizada_el": "03/12/25"}
    ]
  }
  ```
- `is_finished`: BOOLEAN - Indica si el taller está finalizado
- `taller_activo`: BOOLEAN - Indica si el taller tiene fechas activas

### Tabla `activity_surveys`
- `activity_id`: ID del taller
- `client_id`: ID del coach (quien responde la encuesta)
- `workshop_version`: Versión del taller para la cual se completó la encuesta
- `enrollment_id`: NULL para encuestas de coaches (opcional)
- `coach_method_rating`: Calificación del método del coach (1-5)
- `comments`: Comentarios del coach sobre el taller

### Constraint Único
```sql
UNIQUE (activity_id, client_id, workshop_version)
```
Esto permite una encuesta por actividad, cliente y versión.

---

## 🔍 Puntos de Verificación

### Al Abrir Detalle del Taller
1. ✅ Verificar si `is_finished = true`
2. ✅ Obtener la versión actual del taller desde `workshop_versions`
3. ✅ Verificar si existe encuesta para `activity_id`, `client_id`, `workshop_version`
4. ✅ Si NO existe → Mostrar encuesta (cerrable)
5. ✅ Si existe → NO mostrar encuesta

### Al Intentar Editar
1. ✅ Verificar si `is_finished = true`
2. ✅ Obtener la versión actual del taller
3. ✅ Verificar si existe encuesta para la versión actual
4. ✅ Si NO existe → Mostrar encuesta (bloqueante, obligatoria)
5. ✅ Si existe → Permitir editar directamente

### Después de Completar Encuesta
1. ✅ Guardar encuesta con `workshop_version` actual
2. ✅ Mostrar opciones: "No, cerrar" o "Agregar nuevas fechas"
3. ✅ Si "Agregar nuevas fechas" → Abrir paso 5 con mensaje
4. ✅ Si cierra sin guardar → Taller permanece en versión actual, encuesta ya completada

---

## 🚨 Casos Especiales

### Caso 1: Coach Responde Encuesta Múltiples Veces
- **NO debe permitirse** para la misma versión
- El constraint único previene duplicados
- Si intenta responder de nuevo, se actualiza la encuesta existente

### Caso 2: Coach Cierra Sin Agregar Fechas
- Taller permanece finalizado en versión actual
- Encuesta ya completada para esa versión
- NO aparece encuesta de nuevo al abrir detalle o editar

### Caso 3: Coach Agrega Fechas y Finaliza de Nuevo
- Se crea nueva versión automáticamente
- Nueva versión = nueva encuesta pendiente
- Coach debe responder encuesta para la nueva versión

---

## 📝 Notas de Implementación

- La verificación de encuesta completada se hace en el frontend (cache local) y en el backend (consulta a BD)
- El mensaje "Reemplaza tus fechas por nuevas" solo aparece cuando viene desde encuesta completada
- El paso 5 (workshop schedule) se abre directamente cuando se elige "Agregar nuevas fechas"
- Si el coach cierra el modal de edición sin guardar, no se crea nueva versión, por lo tanto no hay nueva encuesta
- **Comentarios del coach**: Los comentarios del coach en `activity_surveys` NO se muestran en la sección de comentarios. Solo se muestran los comentarios de los clientes (donde `client_id` ≠ `coach_id`)
- **Verificación de encuesta**: El endpoint `check-coach-survey` convierte `workshop_version` a INTEGER para asegurar que la comparación con la BD funcione correctamente

