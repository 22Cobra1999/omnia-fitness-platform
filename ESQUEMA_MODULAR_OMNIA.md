# 🏗️ Esquema Modular OMNIA - Documentación Completa

## 📋 Resumen Ejecutivo

Este documento describe la reorganización completa del modelo de datos de OMNIA hacia un sistema más modular, escalable y automatizado para la gestión de rutinas, replicación de ejercicios y seguimiento personalizado por cliente.

## 🎯 Objetivos del Nuevo Esquema

- **Modularidad**: Separación clara de responsabilidades entre plantillas, organización, períodos y ejecuciones
- **Escalabilidad**: Estructura que permite crecimiento sin duplicación de datos
- **Automatización**: Triggers y funciones que automatizan cálculos y generación de períodos
- **Flexibilidad**: Sistema que se adapta a diferentes tipos de entrenamientos y clientes

## 🗂️ Estructura del Nuevo Esquema

### Tablas Principales

| Tabla | Propósito | Reemplaza |
|-------|-----------|-----------|
| `ejercicios_detalles` | Plantillas de ejercicios base replicables | `fitness_exercises` |
| `organizacion_ejercicios` | Organiza ejercicios por día/semana/bloque | `activity_calendar` |
| `periodos_asignados` | Períodos de entrenamiento por cliente | `activity_calendar` |
| `ejecuciones_ejercicio` | Instancias concretas con resultados | `client_exercise_progress` |
| `intensidades` | Presets personalizables por coach | `exercise_intensity_levels` |

### Tablas Actualizadas

| Tabla | Cambios |
|-------|---------|
| `activity_enrollments` | Agregadas columnas `expiration_date` y validación de `status` |

## 📊 Diagrama de Relaciones

```
activities (base)
    ↓
ejercicios_detalles (plantillas)
    ↓
organizacion_ejercicios (estructura)
    ↓
activity_enrollments (inscripciones)
    ↓
periodos_asignados (períodos por cliente)
    ↓
ejecuciones_ejercicio (ejecuciones reales)
    ↑
intensidades (presets de dificultad)
```

## 🚀 Instalación

### Prerrequisitos

1. **Backup completo** de la base de datos actual
2. Acceso de administrador a PostgreSQL
3. Verificar que las tablas actuales existan

### Pasos de Instalación

```bash
# 1. Conectarse a la base de datos
psql -d omnia_database -U postgres

# 2. Ejecutar el script maestro
\i db/install-modular-schema.sql
```

### Instalación Manual (Paso a Paso)

Si prefieres ejecutar paso a paso:

```sql
-- 1. Crear esquema base
\i db/create-modular-exercise-schema.sql

-- 2. Crear funciones auxiliares
\i db/create-modular-functions.sql

-- 3. Crear triggers de automatización
\i db/create-modular-triggers.sql

-- 4. Migrar datos existentes
\i db/migrate-to-modular-schema.sql

-- 5. Configurar relaciones finales
\i db/configure-modular-schema-relationships.sql
```

## 🔧 Funciones Principales

### `generar_periodos_para_enrollment(enrollment_id)`

**Propósito**: Genera automáticamente períodos cuando un cliente activa una actividad.

**Parámetros**:
- `p_enrollment_id`: ID del enrollment
- `p_duracion_periodo_dias`: Duración de cada período (default: 7)
- `p_cantidad_periodos`: Cantidad de períodos (default: automático)

**Retorna**: JSONB con resultado de la operación

**Ejemplo de uso**:
```sql
SELECT generar_periodos_para_enrollment(123, 7, 4);
```

### `generar_ejecuciones_para_periodo(periodo_id)`

**Propósito**: Genera automáticamente las ejecuciones de ejercicios para un período.

**Parámetros**:
- `p_periodo_id`: ID del período
- `p_intensidad_default`: Intensidad por defecto (default: 'Intermedio')

### `obtener_ejercicios_del_dia(client_id, fecha)`

**Propósito**: Obtiene todos los ejercicios programados para un cliente en una fecha específica.

**Retorna**: Tabla con ejercicios del día

### `calcular_progreso_cliente(client_id, activity_id)`

**Propósito**: Calcula estadísticas de progreso para un cliente.

**Retorna**: JSONB con métricas de progreso

## ⚡ Triggers Automáticos

### 1. Auto-generación de Períodos
- **Trigger**: `trigger_auto_generar_periodos`
- **Evento**: Cuando `activity_enrollments.status` cambia a 'activa'
- **Acción**: Llama automáticamente a `generar_periodos_para_enrollment()`

### 2. Auto-generación de Ejecuciones
- **Trigger**: `trigger_auto_generar_ejecuciones`
- **Evento**: Cuando se inserta un nuevo `periodos_asignados`
- **Acción**: Llama automáticamente a `generar_ejecuciones_para_periodo()`

### 3. Actualización de Fechas
- **Trigger**: `trigger_actualizar_fecha_completado`
- **Evento**: Cuando se marca un ejercicio como completado
- **Acción**: Actualiza automáticamente `completed_at`

### 4. Validaciones de Integridad
- **Trigger**: `trigger_validar_fechas_periodo`
- **Evento**: Antes de insertar/actualizar períodos
- **Acción**: Valida que las fechas no se solapen

## 📈 Vistas Útiles

### `ejercicios_del_dia_completo`
Vista completa con todos los ejercicios del día incluyendo información de período y organización.

### `progreso_cliente_resumen`
Resumen de progreso por cliente con estadísticas agregadas.

### `estadisticas_coach`
Estadísticas generales por coach con métricas de rendimiento.

## 🔒 Seguridad (RLS)

Todas las tablas nuevas tienen Row Level Security (RLS) habilitado con políticas específicas:

- **Coaches**: Pueden gestionar sus propios ejercicios y ver datos de sus clientes
- **Clientes**: Pueden ver y gestionar sus propios datos
- **Público**: Puede ver ejercicios de actividades públicas

## 📊 Migración de Datos

### Datos Migrados

1. **Ejercicios**: Desde `fitness_program_details` → `ejercicios_detalles`
2. **Organización**: Desde `fitness_program_details` → `organizacion_ejercicios`
3. **Intensidades**: Desde `fitness_program_details` → `intensidades`
4. **Períodos**: Generados automáticamente para enrollments activos
5. **Ejecuciones**: Desde `fitness_program_details` con `client_id` → `ejecuciones_ejercicio`

### Verificación Post-Migración

```sql
-- Verificar integridad del esquema
SELECT verificar_esquema_modular();

-- Ver estadísticas de migración
SELECT * FROM estadisticas_coach WHERE coach_id = 'tu-coach-id';
```

## 🎮 Casos de Uso

### 1. Cliente Activa una Actividad

```sql
-- 1. Cliente se inscribe (ya existe)
INSERT INTO activity_enrollments (activity_id, client_id, status) 
VALUES (123, 'client-uuid', 'pendiente');

-- 2. Cliente activa la actividad
UPDATE activity_enrollments 
SET status = 'activa', start_date = CURRENT_DATE 
WHERE id = enrollment_id;

-- 3. Los triggers automáticamente:
--    - Generan períodos
--    - Generan ejecuciones
--    - Calculan fechas de expiración
```

### 2. Cliente Completa un Ejercicio

```sql
-- Marcar ejercicio como completado
SELECT marcar_ejercicio_completado(
    456,                    -- ejecucion_id
    50.5,                   -- peso_usado
    12,                     -- repeticiones
    3,                      -- series
    180,                    -- tiempo_segundos
    'Ejercicio completado'  -- nota_cliente
);
```

### 3. Coach Ve Progreso de Cliente

```sql
-- Ver progreso de un cliente
SELECT * FROM progreso_cliente_resumen 
WHERE client_id = 'client-uuid' AND activity_id = 123;

-- Ver ejercicios del día
SELECT * FROM ejercicios_del_dia_completo 
WHERE client_id = 'client-uuid' AND fecha_ejecucion = CURRENT_DATE;
```

## 🔍 Consultas Útiles

### Obtener Próximo Ejercicio de un Cliente
```sql
SELECT * FROM obtener_proximo_ejercicio_cliente('client-uuid');
```

### Ver Estadísticas de un Coach
```sql
SELECT * FROM estadisticas_coach WHERE coach_id = 'coach-uuid';
```

### Buscar Ejercicios por Tipo
```sql
SELECT * FROM ejercicios_detalles 
WHERE tipo = 'fuerza' AND activity_id = 123;
```

### Ver Ejercicios Completados en un Período
```sql
SELECT COUNT(*) as completados, COUNT(*) FILTER (WHERE completado = false) as pendientes
FROM ejecuciones_ejercicio ee
JOIN periodos_asignados pa ON pa.id = ee.periodo_id
WHERE pa.numero_periodo = 1;
```

## 🚨 Consideraciones Importantes

### Antes de la Migración

1. **Backup completo** de la base de datos
2. **Verificar dependencias** de aplicaciones existentes
3. **Probar en entorno de desarrollo** primero
4. **Coordinar con el equipo** para downtime mínimo

### Después de la Migración

1. **Verificar integridad** de datos migrados
2. **Actualizar aplicaciones** para usar nuevas tablas
3. **Monitorear rendimiento** de consultas
4. **Documentar cambios** para el equipo

### Rollback

Si necesitas hacer rollback:

1. Restaurar backup de la base de datos
2. Las tablas antiguas permanecen intactas
3. No se pierden datos originales

## 📝 Notas de Desarrollo

### Índices Creados

- Índices de búsqueda full-text en nombres y descripciones
- Índices compuestos para consultas frecuentes
- Índices de rendimiento para consultas de calendario
- Índices GIN para búsquedas complejas

### Optimizaciones

- Triggers optimizados para evitar bucles infinitos
- Funciones con manejo de errores robusto
- Validaciones de integridad en múltiples niveles
- Políticas de seguridad granulares

## 🤝 Soporte

Para soporte técnico o preguntas sobre el esquema modular:

1. Revisar logs de instalación
2. Verificar integridad con `verificar_esquema_modular()`
3. Consultar documentación de funciones específicas
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0  
**Fecha**: $(date)  
**Autor**: Equipo de Desarrollo OMNIA
