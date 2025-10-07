# Flujo del Nuevo Sistema de Ejercicios

## 🏗️ **Arquitectura del Sistema Modular**

### **Tablas Principales:**
1. **`activities`** - Actividades/Programas de entrenamiento
2. **`activity_enrollments`** - Inscripciones de clientes a actividades
3. **`ejercicios_detalles`** - Definición de ejercicios individuales
4. **`organizacion_ejercicios`** - Cómo se organizan los ejercicios en cada actividad
5. **`periodos_asignados`** - Períodos de entrenamiento asignados a clientes
6. **`ejecuciones_ejercicio`** - Ejecuciones reales de ejercicios por clientes
7. **`intensidades`** - Niveles de dificultad para cada ejercicio

## 🔄 **Flujo Completo del Sistema**

### **Paso 1: Crear Actividad/Programa**
```sql
-- Un coach crea una actividad (ej: "Programa de Fuerza")
INSERT INTO activities (nombre, descripcion, coach_id) 
VALUES ('Programa de Fuerza', 'Programa de 8 semanas', 'coach-uuid');
```

### **Paso 2: Definir Ejercicios**
```sql
-- Se crean ejercicios individuales
INSERT INTO ejercicios_detalles (nombre_ejercicio, descripcion, tipo) 
VALUES ('Press de Banca', 'Ejercicio para pecho', 'fuerza');
```

### **Paso 3: Organizar Ejercicios en la Actividad**
```sql
-- Se organizan los ejercicios en la actividad por períodos
INSERT INTO organizacion_ejercicios (activity_id, ejercicio_id, bloque, dia, semana) 
VALUES (1, 167, '1', 1, 1); -- Ejercicio 167 en bloque 1, día 1, semana 1
```

### **Paso 4: Cliente se Inscribe**
```sql
-- Un cliente se inscribe a la actividad
INSERT INTO activity_enrollments (activity_id, client_id, fecha_inicio) 
VALUES (1, 'client-uuid', '2024-01-15');
```

### **Paso 5: Generar Períodos para el Cliente**
```sql
-- Se generan períodos de entrenamiento para el cliente
INSERT INTO periodos_asignados (enrollment_id, numero_periodo, fecha_inicio, fecha_fin) 
VALUES (1, 1, '2024-01-15', '2024-01-21');
```

### **Paso 6: Cliente Ejecuta Ejercicios**
```sql
-- El cliente ejecuta un ejercicio con intensidad específica
INSERT INTO ejecuciones_ejercicio (
    periodo_id, ejercicio_id, intensidad_aplicada, 
    completado, peso_usado, repeticiones_realizadas, series_completadas
) VALUES (1, 167, 'Intermedio', true, 50.0, 12, 3);
```

## 📊 **Flujo de Datos en Detalle**

### **1. Estructura de Actividades**
```
activities (Programa de Fuerza)
├── organizacion_ejercicios (Ejercicios organizados por período)
│   ├── ejercicio_id: 167 (Burpees)
│   ├── bloque: "1" (Primer bloque)
│   ├── dia: 1 (Día 1 de la semana)
│   └── semana: 1 (Semana 1)
└── activity_enrollments (Clientes inscritos)
    └── periodos_asignados (Períodos generados para cada cliente)
```

### **2. Flujo de Ejecución de Ejercicios**
```
Cliente inicia sesión
    ↓
Selecciona período activo
    ↓
Ve ejercicios del día (desde organizacion_ejercicios)
    ↓
Selecciona ejercicio y intensidad
    ↓
Ejecuta ejercicio (crea ejecuciones_ejercicio)
    ↓
Registra progreso (peso, reps, series, tiempo)
    ↓
Marca como completado
```

## 🎯 **Casos de Uso Prácticos**

### **Caso 1: Cliente Nuevo**
1. **Coach crea programa** → `activities`
2. **Coach organiza ejercicios** → `organizacion_ejercicios`
3. **Cliente se inscribe** → `activity_enrollments`
4. **Sistema genera períodos** → `periodos_asignados`
5. **Cliente ejecuta ejercicios** → `ejecuciones_ejercicio`

### **Caso 2: Seguimiento de Progreso**
```sql
-- Ver progreso de un cliente en un ejercicio específico
SELECT 
    ee.fecha_ejecucion,
    ee.intensidad_aplicada,
    ee.peso_usado,
    ee.repeticiones_realizadas,
    ee.series_completadas,
    ee.completado
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON pa.id = ee.periodo_id
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
WHERE ae.client_id = 'client-uuid'
AND ee.ejercicio_id = 167
ORDER BY ee.fecha_ejecucion;
```

### **Caso 3: Estadísticas de Coach**
```sql
-- Ver estadísticas de todos los clientes
SELECT 
    ed.nombre_ejercicio,
    COUNT(ee.id) as total_ejecuciones,
    COUNT(CASE WHEN ee.completado THEN 1 END) as completadas,
    AVG(ee.peso_usado) as peso_promedio,
    AVG(ee.repeticiones_realizadas) as reps_promedio
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
GROUP BY ed.nombre_ejercicio;
```

## 🔧 **APIs del Sistema**

### **API de Ejecuciones**
```javascript
// Crear nueva ejecución
POST /api/ejecuciones-ejercicio
{
  "periodo_id": 1,
  "ejercicio_id": 167,
  "intensidad_aplicada": "Intermedio",
  "peso_usado": 50.0,
  "repeticiones_realizadas": 12,
  "series_completadas": 3,
  "completado": true
}

// Obtener ejecuciones del cliente
GET /api/ejecuciones-ejercicio?periodo_id=1&completado=true
```

### **API de Intensidades**
```javascript
// Obtener intensidades de un ejercicio
GET /api/intensidades?ejercicio_id=167

// Actualizar intensidad
PUT /api/intensidades
{
  "id": 1,
  "reps": 15,
  "series": 4,
  "peso": 0
}
```

## 📈 **Ventajas del Nuevo Sistema**

### **1. Flexibilidad**
- **Ejercicios reutilizables**: Un ejercicio puede usarse en múltiples actividades
- **Intensidades personalizables**: Cada ejercicio puede tener múltiples niveles
- **Organización flexible**: Ejercicios organizados por bloques, días y semanas

### **2. Escalabilidad**
- **Múltiples clientes**: Cada cliente tiene sus propios períodos
- **Múltiples actividades**: Un cliente puede estar en varias actividades
- **Historial completo**: Todas las ejecuciones se guardan

### **3. Seguimiento Detallado**
- **Progreso por ejercicio**: Ver evolución de peso, reps, series
- **Progreso por período**: Ver completitud de períodos
- **Progreso por actividad**: Ver evolución general

## 🎯 **Flujo de Trabajo Típico**

### **Para el Coach:**
1. **Crear actividad** con ejercicios organizados
2. **Configurar intensidades** para cada ejercicio
3. **Monitorear progreso** de clientes
4. **Ajustar programas** según resultados

### **Para el Cliente:**
1. **Ver ejercicios del día** en su período activo
2. **Seleccionar intensidad** apropiada
3. **Ejecutar ejercicio** y registrar datos
4. **Ver progreso** histórico

### **Para el Sistema:**
1. **Generar períodos** automáticamente
2. **Calcular estadísticas** de progreso
3. **Mantener integridad** de datos
4. **Optimizar rendimiento** de consultas

## 🚀 **Próximos Pasos**

1. **Implementar UI** para gestión de ejercicios
2. **Crear reportes** de progreso
3. **Añadir notificaciones** de recordatorios
4. **Integrar métricas** avanzadas
5. **Optimizar rendimiento** del sistema

¡El nuevo sistema es mucho más robusto y escalable que el anterior!

































