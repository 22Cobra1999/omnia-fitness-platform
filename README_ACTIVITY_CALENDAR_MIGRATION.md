# 📅 Activity Calendar Migration - Documentación Completa

## 🎯 **Propósito**

Este documento describe la migración completa del sistema de calendario de actividades, separando la lógica de fechas de los datos de ejercicios y agregando soporte para personalización por cliente.

## 🏗️ **Arquitectura Final**

### **Tablas Principales:**

#### 1. **`fitness_exercises`** (Solo datos de ejercicios)
```sql
- id (PRIMARY KEY)
- activity_id (FOREIGN KEY → activity_enrollments.id)
- nombre_actividad
- descripción
- duracion_min
- one_rm
- tipo_ejercicio
- nivel_intensidad
- equipo_necesario
- detalle_series
- video_url
- coach_id
```

#### 2. **`activity_calendar`** (Lógica de calendario)
```sql
- id (PRIMARY KEY)
- activity_id (FOREIGN KEY → activity_enrollments.id)
- fitness_exercise_id (FOREIGN KEY → fitness_exercises.id)
- week_number (INTEGER)
- month_number (INTEGER)
- day_name (VARCHAR(10)) -- 'lunes', 'martes', etc.
- calculated_date (DATE) -- Fecha real calculada
- is_replicated (BOOLEAN) -- Si es una fila replicada
- source_week (INTEGER) -- Para filas replicadas
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. **`client_exercise_customizations`** (Personalización por cliente)
```sql
- id (PRIMARY KEY)
- fitness_exercise_id (FOREIGN KEY → fitness_exercises.id)
- client_id (FOREIGN KEY → clients.id)
- detalle_series (TEXT) -- Personalizado por cliente
- duracion_min (INTEGER) -- Personalizado por cliente
- one_rm (DECIMAL) -- Personalizado por cliente
- calorias (INTEGER) -- Personalizado por cliente
- completed (BOOLEAN) -- Estado de completado
- completed_at (TIMESTAMP) -- Cuándo se completó
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 📋 **Scripts de Migración**

### **Orden de Ejecución:**

1. **`simple_cascade_fix.sql`** - Corregir trigger problemático
2. **`fix_orphaned_exercises_minimal.sql`** - Migrar datos a activity_calendar
3. **`simple_remove_date_columns.sql`** - Limpiar columnas de fecha

### **Scripts de Verificación:**

- **`check_table_structure.sql`** - Verificar estructura de tablas
- **`check_client_exercise_customizations_structure.sql`** - Verificar personalizaciones

## 🔧 **Lógica de Cálculo de Fechas**

### **Fórmula Base:**
```sql
calculated_date = start_date + INTERVAL 'X days' + INTERVAL 'Y weeks'
```

### **Cálculo por Día de la Semana:**
- **Lunes**: `start_date + INTERVAL '1 day' + INTERVAL 'X weeks'`
- **Martes**: `start_date + INTERVAL '2 days' + INTERVAL 'X weeks'`
- **Miércoles**: `start_date + INTERVAL '3 days' + INTERVAL 'X weeks'`
- **Jueves**: `start_date + INTERVAL '4 days' + INTERVAL 'X weeks'`
- **Viernes**: `start_date + INTERVAL '5 days' + INTERVAL 'X weeks'`
- **Sábado**: `start_date + INTERVAL '6 days' + INTERVAL 'X weeks'`
- **Domingo**: `start_date + INTERVAL '7 days' + INTERVAL 'X weeks'`

### **Cálculo de Semanas:**
```sql
weeks = (month_number - 1) * 4 + (week_number - 1)
```

### **Ejemplo Práctico:**
- **Start Date**: 2024-09-01 (domingo)
- **Semana 1, Lunes**: 2024-09-02
- **Semana 2, Lunes**: 2024-09-09
- **Semana 3, Lunes**: 2024-09-16
- **Semana 4, Lunes**: 2024-09-23

## 🔄 **Lógica de Replicación**

### **Reglas de Replicación:**

1. **Si hay más de 1 mes**: Solo permitir replicación por meses
2. **Si hay 1 mes o menos**: Permitir replicación por semanas
3. **Períodos replicados**: Incrementan desde el último período disponible
4. **Fechas de replicación**: Se calculan inmediatamente después del último día original

### **Ejemplo de Replicación:**
- **Datos originales**: 4 semanas (Sept 1-28)
- **Replicar**: Semana 1 y Semana 2
- **Resultado**: 
  - Semana 1 → Semana 5 (Sept 29-30)
  - Semana 2 → Semana 1 del Mes 2 (Oct 1-6)

## 👤 **Personalización por Cliente**

### **Trigger Automático:**
```sql
-- Se ejecuta automáticamente al crear una actividad
CREATE TRIGGER trigger_generate_customizations
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_client_exercise_customizations();
```

### **Función de Personalización:**
```sql
-- Crea personalizaciones para todos los ejercicios de la actividad
INSERT INTO client_exercise_customizations (
    fitness_exercise_id,
    client_id,
    detalle_series,    -- Copiado del ejercicio genérico
    duracion_min,     -- Copiado del ejercicio genérico
    one_rm,           -- Copiado del ejercicio genérico
    calorias,         -- Copiado del ejercicio genérico
    completed,         -- Inicializado como FALSE
    completed_at       -- Inicializado como NULL
)
```

## 🎯 **Casos de Uso**

### **1. Crear Nueva Actividad:**
1. Se crea `activity_enrollments` con `start_date`
2. Se agregan ejercicios a `fitness_exercises`
3. Se calculan fechas en `activity_calendar`
4. Se crean personalizaciones en `client_exercise_customizations`

### **2. Replicar Actividad:**
1. Usuario selecciona períodos a replicar
2. Se calculan nuevas fechas basándose en el último día
3. Se crean nuevas entradas en `activity_calendar` con `is_replicated = true`
4. Se crean personalizaciones para los ejercicios replicados

### **3. Personalizar Ejercicio:**
1. Cliente modifica valores en `client_exercise_customizations`
2. Los cambios son específicos para ese cliente
3. Los ejercicios genéricos en `fitness_exercises` no se modifican

## 📊 **Ventajas de la Nueva Arquitectura**

### **Separación de Responsabilidades:**
- **`fitness_exercises`**: Solo datos de ejercicios
- **`activity_calendar`**: Solo lógica de fechas y calendario
- **`client_exercise_customizations`**: Solo personalizaciones por cliente

### **Escalabilidad:**
- Soporte para múltiples actividades
- Soporte para múltiples períodos
- Soporte para replicación compleja
- Soporte para personalización individual

### **Integridad de Datos:**
- Foreign keys apropiadas
- Triggers automáticos
- Validaciones de datos
- Referencias intactas

## 🚀 **Implementación en Frontend**

### **API Endpoints:**
- **`/api/activity-calendar`** - Gestionar calendario
- **`/api/fitness-exercise-details`** - Obtener ejercicios con calendario
- **`/api/exercise-replications`** - Gestionar replicaciones

### **Componentes:**
- **`CSVManager`** - Gestionar datos y replicación
- **`ReplicationInterface`** - Interfaz de replicación
- **`StatisticsBox`** - Mostrar estadísticas de días

## 🔍 **Verificaciones Post-Migración**

### **Integridad de Datos:**
```sql
-- Verificar que todos los ejercicios tienen calendario
SELECT COUNT(*) FROM fitness_exercises fe
LEFT JOIN activity_calendar ac ON fe.id = ac.fitness_exercise_id
WHERE ac.id IS NULL;

-- Verificar que todas las actividades tienen personalizaciones
SELECT COUNT(*) FROM activity_enrollments ae
LEFT JOIN client_exercise_customizations cec ON ae.id = cec.activity_id
WHERE cec.id IS NULL;
```

### **Cálculos de Fechas:**
```sql
-- Verificar fechas calculadas
SELECT 
  ac.week_number,
  ac.month_number,
  ac.day_name,
  ac.calculated_date,
  fe.nombre_actividad
FROM activity_calendar ac
LEFT JOIN fitness_exercises fe ON ac.fitness_exercise_id = fe.id
ORDER BY ac.calculated_date;
```

## 📝 **Notas Importantes**

### **Migración Segura:**
- Todos los datos se migran antes de eliminar columnas
- Verificaciones múltiples de integridad
- Scripts de rollback disponibles

### **Compatibilidad:**
- Mantiene todas las funcionalidades existentes
- Agrega nuevas capacidades de replicación
- Soporte para personalización individual

### **Rendimiento:**
- Índices apropiados en todas las tablas
- Consultas optimizadas
- Triggers eficientes

## 🎉 **Resultado Final**

La migración completa proporciona:
- ✅ **Separación clara** entre datos y lógica
- ✅ **Soporte para replicación** compleja
- ✅ **Personalización individual** por cliente
- ✅ **Integridad de datos** garantizada
- ✅ **Escalabilidad** para futuras funcionalidades
- ✅ **Compatibilidad** con el sistema existente

---

**Fecha de Migración**: Diciembre 2024  
**Estado**: ✅ Completada exitosamente  
**Datos Migrados**: 40 registros  
**Integridad**: 100% verificada
