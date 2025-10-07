# Migración: client_exercise_progress → ejecuciones_ejercicio

## Resumen de la Migración

Esta migración reemplaza las tablas obsoletas `client_exercise_progress` y `exercise_intensity_levels` con las nuevas tablas del esquema modular:

- **`client_exercise_progress`** → **`ejecuciones_ejercicio`** (con intensidad aplicada)
- **`exercise_intensity_levels`** → **`intensidades`** (con mejoras de nombre y orden)

## Estructura de las Nuevas Tablas

### ejecuciones_ejercicio
```sql
CREATE TABLE ejecuciones_ejercicio (
    id SERIAL PRIMARY KEY,
    periodo_id INTEGER NOT NULL REFERENCES periodos_asignados(id),
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id),
    intensidad_aplicada TEXT NOT NULL,  -- Nueva funcionalidad
    duracion INTEGER,
    calorias_estimadas INTEGER,
    fecha_ejecucion DATE NOT NULL,
    completado BOOLEAN DEFAULT FALSE,
    peso_usado DECIMAL(5,2),
    repeticiones_realizadas INTEGER,
    series_completadas INTEGER,
    tiempo_real_segundos INTEGER,
    nota_cliente TEXT,
    nota_coach TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### intensidades
```sql
CREATE TABLE intensidades (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id),
    nombre TEXT NOT NULL,  -- "Principiante", "Intermedio", "Avanzado"
    orden INTEGER NOT NULL,  -- Nivel de dificultad (1, 2, 3...)
    reps INTEGER,
    series INTEGER,
    peso DECIMAL(5,2),
    duracion_minutos INTEGER,
    descanso_segundos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(ejercicio_id, nombre)
);
```

## Scripts de Migración

### 1. Migración de Intensidades
```bash
psql -d your_database -f db/migrate-exercise-intensity-levels-to-intensidades.sql
```

### 2. Migración de Progreso
```bash
psql -d your_database -f db/migrate-client-exercise-progress-to-ejecuciones.sql
```

### 3. Migración Completa
```bash
psql -d your_database -f db/complete-migration-client-exercise-progress.sql
```

### 4. Migración y Limpieza Final
```bash
psql -d your_database -f db/final-migration-and-cleanup.sql
```

## Nuevas APIs

### API de Ejecuciones de Ejercicio
**Endpoint:** `/api/ejecuciones-ejercicio`

#### GET - Obtener ejecuciones
```javascript
// Obtener todas las ejecuciones del usuario
GET /api/ejecuciones-ejercicio

// Filtrar por ejercicio
GET /api/ejecuciones-ejercicio?ejercicio_id=123

// Filtrar por período
GET /api/ejecuciones-ejercicio?periodo_id=456

// Filtrar por estado de completado
GET /api/ejecuciones-ejercicio?completado=true

// Filtrar por fecha
GET /api/ejecuciones-ejercicio?fecha=2024-01-15
```

#### POST - Crear ejecución
```javascript
POST /api/ejecuciones-ejercicio
{
  "periodo_id": 123,
  "ejercicio_id": 456,
  "intensidad_aplicada": "Intermedio",
  "duracion": 30,
  "calorias_estimadas": 200,
  "fecha_ejecucion": "2024-01-15",
  "peso_usado": 50.5,
  "repeticiones_realizadas": 12,
  "series_completadas": 3,
  "tiempo_real_segundos": 1800,
  "nota_cliente": "Ejercicio completado con buena forma"
}
```

#### PUT - Actualizar ejecución
```javascript
PUT /api/ejecuciones-ejercicio
{
  "id": 789,
  "completado": true,
  "peso_usado": 55.0,
  "repeticiones_realizadas": 15,
  "series_completadas": 4,
  "tiempo_real_segundos": 2000,
  "nota_cliente": "Mejoré mi rendimiento"
}
```

#### DELETE - Eliminar ejecución
```javascript
DELETE /api/ejecuciones-ejercicio?id=789
```

### API de Intensidades
**Endpoint:** `/api/intensidades`

#### GET - Obtener intensidades
```javascript
// Obtener todas las intensidades
GET /api/intensidades

// Filtrar por ejercicio
GET /api/intensidades?ejercicio_id=123

// Filtrar por actividad
GET /api/intensidades?activity_id=456
```

#### POST - Crear intensidad
```javascript
POST /api/intensidades
{
  "ejercicio_id": 123,
  "nombre": "Principiante",
  "orden": 1,
  "reps": 8,
  "series": 3,
  "peso": 0,
  "duracion_minutos": null,
  "descanso_segundos": 90
}
```

#### PUT - Actualizar intensidad
```javascript
PUT /api/intensidades
{
  "id": 456,
  "nombre": "Intermedio",
  "orden": 2,
  "reps": 12,
  "series": 3,
  "peso": 0,
  "descanso_segundos": 60
}
```

#### DELETE - Eliminar intensidad
```javascript
DELETE /api/intensidades?id=456
```

## Mejoras Implementadas

### 1. Intensidad Aplicada
- Cada ejecución de ejercicio ahora incluye la intensidad aplicada
- Permite seguimiento más detallado del progreso
- Facilita la personalización de entrenamientos

### 2. Nombres de Intensidad Mejorados
- **Antes:** "beginner", "intermediate", "advanced"
- **Después:** "Principiante", "Intermedio", "Avanzado"
- Nombres más claros y en español

### 3. Orden de Intensidad
- Campo `orden` para establecer niveles de dificultad
- Facilita la progresión de entrenamientos
- Permite ordenamiento lógico de intensidades

### 4. Metadatos Mejorados
- Campos `created_by` para rastrear quién creó las intensidades
- Timestamps mejorados para auditoría
- Notas separadas para cliente y coach

## Verificación Post-Migración

### 1. Verificar Datos Migrados
```sql
-- Verificar ejecuciones migradas
SELECT COUNT(*) as total_ejecuciones FROM ejecuciones_ejercicio;
SELECT COUNT(*) as ejecuciones_con_intensidad 
FROM ejecuciones_ejercicio 
WHERE intensidad_aplicada IS NOT NULL;

-- Verificar intensidades migradas
SELECT COUNT(*) as total_intensidades FROM intensidades;
SELECT COUNT(DISTINCT ejercicio_id) as ejercicios_con_intensidades 
FROM intensidades;
```

### 2. Verificar Limpieza
```sql
-- Verificar que las tablas obsoletas fueron eliminadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'client_exercise_progress',
    'exercise_intensity_levels'
);
```

### 3. Probar APIs
```bash
# Probar API de ejecuciones
curl -X GET "http://localhost:3000/api/ejecuciones-ejercicio" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Probar API de intensidades
curl -X GET "http://localhost:3000/api/intensidades" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Próximos Pasos

1. **Actualizar Frontend**: Modificar componentes para usar las nuevas APIs
2. **Crear Intensidades**: Configurar intensidades personalizadas para ejercicios
3. **Implementar UI**: Crear interfaces para gestión de ejecuciones e intensidades
4. **Testing**: Probar todas las funcionalidades del nuevo sistema
5. **Documentación**: Actualizar documentación de usuario

## Rollback (Si es Necesario)

Si necesitas revertir la migración:

1. **Restaurar desde backup** de la base de datos
2. **O recrear las tablas obsoletas** desde los scripts originales
3. **Restaurar los datos** desde las nuevas tablas (requiere script de rollback)

## Soporte

Para problemas o preguntas sobre la migración:
1. Revisar los logs de migración
2. Verificar la integridad de los datos
3. Consultar la documentación del esquema modular
4. Contactar al equipo de desarrollo

































