# 📊 Diagrama de Planificación de Actividades - Vista Coach

## 🎯 Resumen del Sistema

El sistema de planificación permite al coach crear actividades con ejercicios distribuidos en días y semanas específicos, que luego se replican automáticamente según la cantidad de períodos configurados.

---

## 📐 Arquitectura de Tablas

### 1️⃣ **activities** (Actividad Base)
```sql
activities
├── id (PK)
├── title
├── description
├── type (fitness_program, nutrition_program, workshop)
├── coach_id
├── price
└── created_at
```

**Propósito**: Tabla principal que define la actividad/producto.

---

### 2️⃣ **planificacion_ejercicios** (Planificación Semanal)
```sql
planificacion_ejercicios
├── id (PK)
├── actividad_id (FK → activities.id)
├── numero_semana (1, 2, 3...)
├── lunes (JSONB)
├── martes (JSONB)
├── miercoles (JSONB)
├── jueves (JSONB)
├── viernes (JSONB)
├── sabado (JSONB)
├── domingo (JSONB)
├── fecha_creacion
└── fecha_actualizacion
```

**Propósito**: Define QUÉ ejercicios van en QUÉ día de QUÉ semana.

**Estructura del JSONB por día**:
```json
{
  "1": [
    {"id": 1042, "orden": 1, "bloque": 1, "orden_ejercicio": 1}
  ],
  "2": [
    {"id": 1043, "orden": 2, "bloque": 2, "orden_ejercicio": 2}
  ]
}
```

**Ejemplo Real**:
- **Actividad 78** tiene:
  - **Semana 1**: Solo `lunes` tiene 4 ejercicios
  - **Semana 2**: Solo `miercoles` (2 ejs) y `jueves` (2 ejs)

---

### 3️⃣ **periodos** (Multiplicador de Repeticiones)
```sql
periodos
├── id (PK)
├── actividad_id (FK → activities.id) UNIQUE
├── cantidad_periodos (1, 2, 3...)
├── fecha_creacion
└── fecha_actualizacion
```

**Propósito**: Define CUÁNTAS VECES se repite el ciclo de semanas planificadas.

**Ejemplo**:
- `cantidad_periodos = 3` → Repite 3 veces las 2 semanas → Total: 6 semanas

---

### 4️⃣ **activity_enrollments** (Inscripción del Cliente)
```sql
activity_enrollments
├── id (PK)
├── activity_id (FK → activities.id)
├── client_id (FK → auth.users.id)
├── status ('activa', 'pending', 'completed')
├── start_date ⭐ (Fecha de inicio)
├── progress
├── amount_paid
├── payment_method
├── payment_status
├── created_at
└── updated_at
```

**Propósito**: Registra la compra y **fecha de inicio** del cliente en la actividad.

---

### 5️⃣ **progreso_cliente** (Días de Ejercicio del Cliente)
```sql
progreso_cliente
├── id (PK)
├── actividad_id (FK → activities.id)
├── cliente_id (FK → auth.users.id)
├── fecha ⭐ (Día específico de ejercicio)
├── ejercicios_completados (JSONB array de IDs)
├── ejercicios_pendientes (JSONB array de IDs)
├── detalles_series (JSONB)
├── minutos_json (JSONB)
├── calorias_json (JSONB)
├── fecha_creacion
└── fecha_actualizacion
```

**Propósito**: Una fila por cada **día con ejercicios** del cliente.

---

## 🔄 Flujo de Generación de Fechas

### **Paso 1: Coach Crea la Planificación**

```
Coach → Crea Actividad (activities)
  ↓
Coach → Define Planificación por Semana (planificacion_ejercicios)
  │
  ├── Semana 1: Lunes → [Ej1, Ej2, Ej3, Ej4]
  └── Semana 2: Miércoles → [Ej5, Ej6]
              Jueves → [Ej7, Ej8]
  ↓
Coach → Configura Períodos (periodos)
  └── cantidad_periodos = 3
```

---

### **Paso 2: Cliente Compra la Actividad**

```
Cliente → Hace clic en "Comprar"
  ↓
POST /api/enrollments/direct
  ├── Crea activity_enrollments
  │   └── start_date = "2025-10-06"
  ↓
POST /api/activities/initialize-progress
  └── Genera TODAS las filas de progreso_cliente
```

---

### **Paso 3: Cálculo de Fechas Reales**

#### 📐 **Algoritmo de Generación**

```typescript
// Datos de entrada
const startDate = "2025-10-06" // Domingo (de activity_enrollments)
const maxSemanasPlanificacion = 2 // Semanas en planificacion_ejercicios
const cantidadPeriodos = 3 // De tabla periodos

// Cálculo
const totalSemanas = maxSemanasPlanificacion × cantidadPeriodos
// totalSemanas = 2 × 3 = 6 semanas totales

// Para cada semana absoluta (1 a 6):
for (semanaAbsoluta = 1; semanaAbsoluta <= 6; semanaAbsoluta++) {
  
  // ¿Qué semana del ciclo es? (1 o 2)
  semanaEnCiclo = ((semanaAbsoluta - 1) % 2) + 1
  
  // Calcular inicio de esta semana
  inicioSemana = startDate + ((semanaAbsoluta - 1) × 7 días)
  
  // Buscar planificación para esta semana del ciclo
  planificacion = planificacion_ejercicios
    .where(numero_semana = semanaEnCiclo)
  
  // Para cada día de la semana (0-6):
  for (diaSemana = 0; diaSemana < 7; diaSemana++) {
    
    // ¿Este día tiene ejercicios?
    if (planificacion[nombreDia] tiene ejercicios) {
      
      // Calcular fecha exacta
      fechaDia = inicioSemana + diaSemana
      
      // Extraer IDs de ejercicios
      ejercicioIds = extraer_ids(planificacion[nombreDia])
      
      // Crear fila en progreso_cliente
      INSERT INTO progreso_cliente (
        actividad_id,
        cliente_id,
        fecha = fechaDia,
        ejercicios_pendientes = ejercicioIds
      )
    }
  }
}
```

---

### **Paso 4: Resultado Final**

#### 🗓️ **Calendario Generado para Actividad 78**

**Configuración**:
- `start_date` = 2025-10-06 (Domingo)
- `cantidad_periodos` = 3
- `numero_semana` en planificación: 1, 2

**Planificación**:
- **Semana 1**: Lunes → 4 ejercicios
- **Semana 2**: Miércoles → 2 ejs, Jueves → 2 ejs

**Filas generadas en `progreso_cliente`**:

| Semana Absoluta | Ciclo | Día | Fecha | Ejercicios |
|----------------|-------|-----|-------|------------|
| 1 | S1 | Lunes | 2025-10-07 | [1042, 1043, 1042, 1043] |
| 2 | S2 | Miércoles | 2025-10-16 | [1042, 1043] |
| 2 | S2 | Jueves | 2025-10-17 | [1042, 1043] |
| 3 | S1 | Lunes | 2025-10-21 | [1042, 1043, 1042, 1043] |
| 4 | S2 | Miércoles | 2025-10-30 | [1042, 1043] |
| 4 | S2 | Jueves | 2025-10-31 | [1042, 1043] |
| 5 | S1 | Lunes | 2025-11-04 | [1042, 1043, 1042, 1043] |
| 6 | S2 | Miércoles | 2025-11-13 | [1042, 1043] |
| 6 | S2 | Jueves | 2025-11-14 | [1042, 1043] |

**Total**: 9 filas (9 días con ejercicios en 6 semanas)

---

## 🔧 Endpoints Clave

### **1. Inicializar Progreso del Cliente**
```http
POST /api/activities/initialize-progress

Body:
{
  "activityId": 78,
  "clientId": "uuid-del-cliente",
  "startDate": "2025-10-06"
}

Response:
{
  "success": true,
  "recordsCreated": 9,
  "periods": 3,
  "weeksPerPeriod": 2,
  "totalWeeks": 6
}
```

### **2. Obtener Ejercicios del Día**
```http
GET /api/activities/today?activityId=78&fecha=2025-10-07&dia=1

Response:
{
  "success": true,
  "data": {
    "activities": [
      {"id": "x-1042", "exercise_id": 1042, "name": "HIIT Fútbol", "completed": false},
      {"id": "x-1043", "exercise_id": 1043, "name": "Flexiones", "completed": false},
      ...
    ],
    "count": 4,
    "date": "2025-10-07"
  }
}
```

### **3. Marcar Ejercicio como Completado**
```http
POST /api/toggle-exercise

Body:
{
  "executionId": 1042
}

Response:
{
  "success": true,
  "ejercicioId": 1042,
  "isCompleted": true
}
```

**Efecto**: Mueve el ID de `ejercicios_pendientes` a `ejercicios_completados` en `progreso_cliente`.

---

## 📊 Diagrama Visual del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    COACH CREA ACTIVIDAD                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    activities (tabla)                        │
│  - id: 78                                                    │
│  - title: "Programa Fitness 6 Semanas"                      │
│  - type: "fitness_program"                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              planificacion_ejercicios (tabla)                │
│                                                              │
│  Fila 1: actividad_id=78, numero_semana=1                   │
│    - lunes: {"1":[{id:1042}, {id:1043}], "2":[...]}         │
│    - martes: {}                                              │
│    - ... (resto vacíos)                                      │
│                                                              │
│  Fila 2: actividad_id=78, numero_semana=2                   │
│    - lunes: {}                                               │
│    - martes: {}                                              │
│    - miercoles: {"1":[{id:1042}, {id:1043}]}                │
│    - jueves: {"1":[{id:1042}, {id:1043}]}                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    periodos (tabla)                          │
│  - actividad_id: 78                                          │
│  - cantidad_periodos: 3                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   CLIENTE COMPRA ACTIVIDAD
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              activity_enrollments (tabla)                    │
│  - id: 143                                                   │
│  - activity_id: 78                                           │
│  - client_id: "uuid-cliente"                                 │
│  - start_date: "2025-10-06" ⭐                               │
│  - status: "activa"                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
              /api/activities/initialize-progress
                              ↓
┌─────────────────────────────────────────────────────────────┐
│    GENERA 9 FILAS EN progreso_cliente                        │
│                                                              │
│  Cálculo:                                                    │
│    totalSemanas = 2 semanas × 3 períodos = 6 semanas        │
│                                                              │
│  Semana 1 (ciclo 1):                                         │
│    Lunes 07-Oct → Fila con ejercicios [1042,1043,1042,1043] │
│                                                              │
│  Semana 2 (ciclo 2):                                         │
│    Miércoles 16-Oct → Fila con ejercicios [1042, 1043]      │
│    Jueves 17-Oct → Fila con ejercicios [1042, 1043]         │
│                                                              │
│  Semana 3 (ciclo 1 repite):                                  │
│    Lunes 21-Oct → Fila con ejercicios [1042,1043,1042,1043] │
│                                                              │
│  Semana 4 (ciclo 2 repite):                                  │
│    Miércoles 30-Oct → Fila con ejercicios [1042, 1043]      │
│    Jueves 31-Oct → Fila con ejercicios [1042, 1043]         │
│                                                              │
│  Semana 5 (ciclo 1 repite):                                  │
│    Lunes 04-Nov → Fila con ejercicios [1042,1043,1042,1043] │
│                                                              │
│  Semana 6 (ciclo 2 repite):                                  │
│    Miércoles 13-Nov → Fila con ejercicios [1042, 1043]      │
│    Jueves 14-Nov → Fila con ejercicios [1042, 1043]         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           progreso_cliente (9 filas creadas)                 │
│                                                              │
│  {id:28, fecha:"2025-10-07", ejercicios_pendientes:[...]}   │
│  {id:29, fecha:"2025-10-16", ejercicios_pendientes:[...]}   │
│  {id:30, fecha:"2025-10-17", ejercicios_pendientes:[...]}   │
│  {id:31, fecha:"2025-10-21", ejercicios_pendientes:[...]}   │
│  {id:32, fecha:"2025-10-30", ejercicios_pendientes:[...]}   │
│  {id:33, fecha:"2025-10-31", ejercicios_pendientes:[...]}   │
│  {id:34, fecha:"2025-11-04", ejercicios_pendientes:[...]}   │
│  {id:35, fecha:"2025-11-13", ejercicios_pendientes:[...]}   │
│  {id:36, fecha:"2025-11-14", ejercicios_pendientes:[...]}   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                  CLIENTE VE SU CALENDARIO
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend: TodayScreen                       │
│                                                              │
│  Calendario muestra:                                         │
│    - 7 Oct (Lun): 🟡 4 ejercicios pendientes                │
│    - 16 Oct (Mié): 🟡 2 ejercicios pendientes               │
│    - 17 Oct (Jue): 🟡 2 ejercicios pendientes               │
│    - 21 Oct (Lun): 🟡 4 ejercicios pendientes               │
│    - ... (y así hasta 14-Nov)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Casos de Uso

### **Caso 1: Actividad Simple (1 período)**
```
Planificación: 4 semanas
Períodos: 1
Total semanas: 4 × 1 = 4 semanas
```

### **Caso 2: Actividad con Repeticiones (3 períodos)**
```
Planificación: 2 semanas
Períodos: 3
Total semanas: 2 × 3 = 6 semanas
Ciclo: S1→S2→S1→S2→S1→S2
```

### **Caso 3: Programa Largo (2 períodos)**
```
Planificación: 8 semanas
Períodos: 2
Total semanas: 8 × 2 = 16 semanas
Ciclo: S1→S2→S3→S4→S5→S6→S7→S8→(repite)
```

---

## ⚠️ Reglas Importantes

1. ✅ **Una fila en `progreso_cliente` = Un día específico con ejercicios**
2. ✅ **NO se crean filas para días sin planificación**
3. ✅ **El ciclo se calcula con módulo**: `(semanaAbsoluta - 1) % maxSemanas + 1`
4. ✅ **Fecha exacta** = `start_date + (semana × 7) + díaSemana`
5. ✅ **Ejercicios duplicados** en el JSONB significa bloques/series múltiples

---

## 🔍 Debugging

### Verificar Planificación Generada:
```sql
SELECT 
  fecha,
  to_char(fecha, 'Day') as dia_semana,
  jsonb_array_length(ejercicios_pendientes::jsonb) as cant_ejercicios
FROM progreso_cliente
WHERE actividad_id = 78
  AND cliente_id = 'uuid-cliente'
ORDER BY fecha;
```

### Ver Ejercicios Completados vs Pendientes:
```sql
SELECT 
  fecha,
  jsonb_array_length(ejercicios_completados::jsonb) as completados,
  jsonb_array_length(ejercicios_pendientes::jsonb) as pendientes
FROM progreso_cliente
WHERE actividad_id = 78
  AND cliente_id = 'uuid-cliente'
ORDER BY fecha;
```

---

## 📝 Notas para el Coach

- **Semanas en Planificación**: Diseña el ciclo base (ej: 2, 4, 8 semanas)
- **Períodos**: Cuántas veces quieres que se repita el ciclo completo
- **Días con Ejercicios**: Solo los días con JSONB no vacío generan filas
- **Start Date**: Es crucial - define cuándo comienza el calendario del cliente
- **Modificaciones**: Si cambias la planificación después de ventas, los clientes existentes NO se actualizan automáticamente

---

## 🚀 Endpoints para el Coach

### Ver planificación de una actividad:
```http
GET /api/get-product-planning?productId=78
```

### Guardar planificación:
```http
POST /api/save-weekly-planning

Body: {
  "productId": 78,
  "planningData": { /* estructura de semanas/días/ejercicios */ },
  "periodos": 3
}
```

---

## 🔄 Sistema de Estados (is_active)

### **Columna Nueva en Tablas**
```
ejercicios_detalles
├── ... (campos existentes)
└── is_active BOOLEAN DEFAULT TRUE ⭐

nutrition_program_details
├── ... (campos existentes)
└── is_active BOOLEAN DEFAULT TRUE ⭐
```

### **Comportamiento por Rol**

#### **Coach:**
- **Ve TODOS** los ejercicios/platos (activos y desactivados)
- **Puede desactivar** ejercicios/platos marcándolos y presionando 🔌 PowerOff
- **Desactivar** = UPDATE `is_active = FALSE` (NO elimina de BD)
- **Reactivar** = UPDATE `is_active = TRUE`

#### **Cliente:**
- **Solo ve** ejercicios/platos con `is_active = TRUE`
- **Clientes existentes** (que ya compraron) **mantienen acceso** a ejercicios/platos desactivados
  - Motivo: Sus registros en `progreso_cliente` ya tienen esos IDs guardados
- **Clientes nuevos** NO ven ejercicios/platos desactivados en sus compras

### **Flujo de Desactivación**
```
Coach desactiva ejercicio → UPDATE is_active = FALSE
  ↓
Se quita de planificación semanal (planificacion_ejercicios)
  ↓
Clientes antiguos → ✅ Siguen viendo (ya en progreso_cliente)
Clientes nuevos → ❌ NO ven (no aparece en nuevas planificaciones)
```

### **Migración**
📁 `db/migrations/add-is-active-to-exercises-and-nutrition.sql`

---

**Versión**: 2.0  
**Última actualización**: Octubre 2025  
**Autor**: Sistema Omnia




















