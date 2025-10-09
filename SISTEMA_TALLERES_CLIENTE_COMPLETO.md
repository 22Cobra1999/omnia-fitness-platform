# 🎓 **Sistema de Talleres para Clientes - Documentación Completa**

## 📋 **Resumen del Sistema**

Sistema completo que permite a los clientes:
- Ver los talleres que compraron
- Expandir cada tema para ver descripción y horarios
- Seleccionar horarios específicos con control de cupos
- Ver su progreso en el taller
- Confirmar asistencia a sesiones específicas

---

## 🗄️ **1. Base de Datos: `ejecuciones_taller`**

### **Estructura de la Tabla:**

```sql
CREATE TABLE ejecuciones_taller (
    id SERIAL PRIMARY KEY,
    cliente_id UUID NOT NULL,
    actividad_id INTEGER NOT NULL,
    estado VARCHAR(50) DEFAULT 'en_progreso',
    progreso_porcentaje INTEGER DEFAULT 0,
    
    -- JSON de temas cubiertos
    temas_cubiertos JSONB DEFAULT '[]'::jsonb,
    
    -- JSON de temas pendientes  
    temas_pendientes JSONB DEFAULT '[]'::jsonb,
    
    fecha_inscripcion TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Estructura JSON de Temas:**

#### **Temas Cubiertos:**
```json
[
  {
    "tema_id": 2,
    "tema_nombre": "Flexibilidad y Movilidad",
    "fecha_seleccionada": "2025-10-15",
    "horario_seleccionado": {
      "hora_inicio": "10:00",
      "hora_fin": "12:00",
      "tipo": "original"
    },
    "confirmo_asistencia": true,
    "asistio": true,
    "fecha_asistencia": "2025-10-15T10:05:00Z",
    "duracion_minutos": 115,
    "completado_en": "2025-10-15T12:00:00Z"
  }
]
```

#### **Temas Pendientes:**
```json
[
  {
    "tema_id": 3,
    "tema_nombre": "Meditación y Relajación",
    "fecha_seleccionada": "2025-10-17",
    "horario_seleccionado": {
      "hora_inicio": "18:00",
      "hora_fin": "20:00",
      "tipo": "original"
    },
    "confirmo_asistencia": true,
    "asistio": false
  }
]
```

### **Funciones Auxiliares:**

#### **Calcular Progreso:**
```sql
SELECT calcular_progreso_taller(ejecucion_id);
-- Retorna porcentaje de temas completados (0-100)
```

#### **Inicializar Ejecución:**
```sql
SELECT inicializar_ejecucion_taller(cliente_id, actividad_id);
-- Crea ejecución con todos los temas como pendientes
```

---

## 🎨 **2. Componente Cliente: `WorkshopClientView`**

### **Props:**
```typescript
interface WorkshopClientViewProps {
  activityId: number
  activityTitle: string
  activityDescription?: string
}
```

### **Funcionalidades:**

#### **1. Carga Automática de Datos:**
```typescript
// Al cargar:
1. Obtiene temas desde taller_detalles
2. Busca o crea ejecución del cliente
3. Carga cupos ocupados por tema/fecha/horario
```

#### **2. Vista de Progreso:**
```typescript
<div className="progress-bar">
  {temasCubiertos.length} / {totalTemas} temas
  Barra visual: XX%
</div>
```

#### **3. Lista Expandible de Temas:**
```typescript
// Cada tema muestra:
- Header: Nombre + estado (pendiente/confirmado/cubierto)
- Al expandir:
  - Descripción del tema
  - Horarios originales con cupos
  - Horarios alternativos con cupos
```

#### **4. Selección de Horarios:**
```typescript
handleSelectHorario(temaId, fecha, horario, tipo)
// 1. Verifica cupo disponible
// 2. Actualiza temas_pendientes en BD
// 3. Marca confirmo_asistencia = true
// 4. Actualiza contador de cupos
```

### **Estados Visuales:**

| Estado | Color | Icono |
|--------|-------|-------|
| Pendiente | Gris | - |
| Confirmado | Naranja | Badge "Confirmado" |
| Cubierto | Verde | CheckCircle ✓ |

### **Sistema de Cupos:**

```typescript
// Cálculo de cupos ocupados:
const cupoKey = `${tema_id}-${fecha}-${hora_inicio}`
const ocupados = cuposOcupados[cupoKey] || 0
const disponibles = horario.cupo - ocupados

// Estados:
- disponibles > 3: Verde (normal)
- disponibles 1-3: Naranja (pocos lugares)
- disponibles = 0: Rojo (lleno, no clickeable)
```

---

## 🔄 **3. Flujo de Usuario Completo**

### **Paso 1: Cliente Compra Taller**
```typescript
// Al confirmar compra (enrollment):
1. Se crea enrollment en activity_enrollments
2. Se dispara función inicializar_ejecucion_taller()
3. Se crea registro en ejecuciones_taller con:
   - estado: 'en_progreso'
   - temas_cubiertos: []
   - temas_pendientes: [todos los temas]
```

### **Paso 2: Cliente Ve el Taller**
```typescript
// Al abrir la actividad:
1. WorkshopClientView carga:
   - Temas desde taller_detalles
   - Ejecución del cliente
   - Cupos ocupados

2. Muestra:
   - Progreso general
   - Lista de temas expandibles
```

### **Paso 3: Cliente Selecciona Horario**
```typescript
// Al hacer clic en un horario:
1. Verifica cupo disponible
2. Si hay espacio:
   - Actualiza tema en temas_pendientes
   - Marca confirmo_asistencia = true
   - Guarda fecha y horario seleccionados
3. Actualiza contador de cupos localmente
4. Muestra confirmación visual
```

### **Paso 4: Coach Marca Asistencia (Futuro)**
```typescript
// Después de la sesión:
1. Coach marca quién asistió
2. Sistema mueve tema de pendientes a cubiertos
3. Actualiza progreso_porcentaje
4. Si todos los temas cubiertos:
   - estado = 'completado'
   - fecha_finalizacion = NOW()
```

---

## 📊 **4. Consultas Útiles**

### **Ver Ejecuciones de un Cliente:**
```sql
SELECT 
    e.*,
    a.title as actividad_nombre,
    p.full_name as cliente_nombre
FROM ejecuciones_taller e
JOIN activities a ON e.actividad_id = a.id
JOIN profiles p ON e.cliente_id = p.id
WHERE e.cliente_id = 'CLIENTE_UUID';
```

### **Ver Cupos por Horario:**
```sql
-- Cupos ocupados en un horario específico
SELECT 
    COUNT(*) as inscritos
FROM ejecuciones_taller,
    jsonb_array_elements(temas_pendientes || temas_cubiertos) as tema
WHERE 
    actividad_id = 48
    AND tema->>'confirmo_asistencia' = 'true'
    AND tema->>'fecha_seleccionada' = '2025-10-15'
    AND tema->'horario_seleccionado'->>'hora_inicio' = '10:00';
```

### **Progreso de Clientes en un Taller:**
```sql
SELECT 
    p.full_name,
    e.progreso_porcentaje,
    jsonb_array_length(e.temas_cubiertos) as temas_completados,
    jsonb_array_length(e.temas_pendientes) as temas_pendientes
FROM ejecuciones_taller e
JOIN profiles p ON e.cliente_id = p.id
WHERE e.actividad_id = 48
ORDER BY e.progreso_porcentaje DESC;
```

---

## 🎯 **5. Características Implementadas**

### ✅ **Vista del Cliente:**
- [x] Carga automática de temas y ejecución
- [x] Barra de progreso visual
- [x] Lista expandible de temas
- [x] Descripción de cada tema
- [x] Horarios originales y alternativos
- [x] Sistema de cupos en tiempo real
- [x] Selección de horarios
- [x] Confirmación visual
- [x] Estados: pendiente/confirmado/cubierto

### ✅ **Base de Datos:**
- [x] Tabla ejecuciones_taller
- [x] Estructura JSON para temas
- [x] Funciones auxiliares
- [x] RLS policies
- [x] Triggers para updated_at
- [x] Índices optimizados

### ✅ **Sistema de Cupos:**
- [x] Cálculo de cupos ocupados
- [x] Prevención de sobrecupo
- [x] Indicadores visuales (verde/naranja/rojo)
- [x] Bloqueo de horarios llenos

---

## 🔮 **6. Próximos Pasos (Futuro)**

### **API para Coach:**
```typescript
// POST /api/talleres/marcar-asistencia
{
  ejecucion_id: number,
  tema_id: number,
  asistio: boolean,
  duracion_minutos?: number
}
```

### **Integración con Videoconferencias:**
```typescript
// Cuando se confirma horario:
1. Crear evento en Google Calendar
2. Generar link de Google Meet
3. Enviar email con link
4. Recordatorios automáticos
```

### **Dashboard Coach:**
```typescript
// Ver lista de asistencia por sesión:
- Quiénes confirmaron
- Quiénes asistieron
- Duración de asistencia
- Estadísticas generales
```

---

## 📝 **7. Ejemplo de Uso**

### **Crear Ejecución Manual:**
```sql
-- 1. Inicializar ejecución
SELECT inicializar_ejecucion_taller(
    '00dedc23-0b17-4e50-b84e-b2e8100dc93c'::uuid,
    48
);

-- 2. Simular confirmación de horario
UPDATE ejecuciones_taller
SET temas_pendientes = jsonb_set(
    temas_pendientes,
    '{0}',
    jsonb_set(
        temas_pendientes->0,
        '{confirmo_asistencia}',
        'true'
    )
)
WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
AND actividad_id = 48;

-- 3. Mover tema a cubiertos
UPDATE ejecuciones_taller
SET 
    temas_cubiertos = temas_cubiertos || jsonb_build_array(
        jsonb_set(
            temas_pendientes->0,
            '{asistio}',
            'true'
        )
    ),
    temas_pendientes = temas_pendientes - 0
WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c'
AND actividad_id = 48;

-- 4. Actualizar progreso
SELECT calcular_progreso_taller(
    (SELECT id FROM ejecuciones_taller 
     WHERE cliente_id = '00dedc23-0b17-4e50-b84e-b2e8100dc93c' 
     AND actividad_id = 48)
);
```

---

## 🚀 **Estado del Sistema:**

- **✅ Base de datos**: Completa y lista para usar
- **✅ Vista cliente**: Completamente funcional
- **✅ Sistema de cupos**: Implementado y funcionando
- **✅ Confirmación de asistencia**: Operativo
- **⏳ Marcado de asistencia real**: Pendiente (requiere API coach)
- **⏳ Integración videoconferencia**: Pendiente

---

**¡Sistema de talleres para clientes completamente implementado y funcional!** 🎉

El cliente ahora puede:
1. ✅ Ver todos los temas de su taller
2. ✅ Expandir cada tema para ver detalles
3. ✅ Ver horarios disponibles con cupos en tiempo real
4. ✅ Seleccionar y confirmar horarios específicos
5. ✅ Ver su progreso en el taller
6. ✅ Distinguir entre temas pendientes, confirmados y completados



