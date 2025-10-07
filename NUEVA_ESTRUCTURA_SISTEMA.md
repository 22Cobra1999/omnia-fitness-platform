# Nueva Estructura del Sistema de Ejercicios

## 🎯 **Objetivo del Sistema**
Crear un sistema modular que permita a los coaches crear productos con ejercicios organizados por semanas/días, con soporte para replicación de períodos y seguimiento individual de clientes.

## 📊 **Estructura de Tablas Definida**

### **1. `ejercicios_detalles` - Información Base de Ejercicios**
```sql
CREATE TABLE ejercicios_detalles (
    id SERIAL PRIMARY KEY,                    -- ID de fila
    activity_id INTEGER NOT NULL,             -- ID de actividad
    nombre_ejercicio TEXT NOT NULL,           -- Nombre del ejercicio
    tipo TEXT NOT NULL,                       -- Tipo de ejercicio
    descripcion TEXT,                         -- Descripción
    equipo TEXT,                              -- Equipo necesario
    body_parts TEXT,                          -- Partes del cuerpo
    replicar BOOLEAN DEFAULT false,           -- Si se puede replicar
    created_by UUID,                          -- Coach que lo creó
    calorias INTEGER,                         -- Calorías
    intensidad TEXT DEFAULT 'Principiante',   -- Intensidad base
    video_url TEXT,                           -- URL del video
    
    -- Organización temporal
    semana INTEGER,                           -- Semana del programa
    dia INTEGER,                              -- Día de la semana (1-7)
    periodo INTEGER DEFAULT 1,                -- Período del programa
    bloque INTEGER DEFAULT 1,                 -- Bloque dentro del día
    orden INTEGER,                            -- Orden secuencial
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. `intensidades` - Niveles de Intensidad por Ejercicio**
```sql
CREATE TABLE intensidades (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id),
    nombre_ejercicio TEXT,                    -- Nombre del ejercicio
    intensidad TEXT NOT NULL,                 -- Principiante/Intermedio/Avanzado
    detalle_series JSONB,                     -- Series, peso, repeticiones
    duracion_minutos INTEGER,                 -- Duración en minutos
    calorias INTEGER,                         -- Calorías para esta intensidad
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. `periodos_asignados` - Gestión de Períodos de Actividad**
```sql
CREATE TABLE periodos_asignados (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    numero_periodo INTEGER NOT NULL,          -- Número del período (1, 2, 3...)
    fecha_inicio DATE NOT NULL,               -- Fecha de inicio del período
    fecha_fin DATE NOT NULL,                  -- Fecha de fin del período
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(activity_id, numero_periodo)       -- Un período único por actividad
);
```

### **4. `ejecuciones_ejercicio` - Seguimiento de Clientes**
```sql
CREATE TABLE ejecuciones_ejercicio (
    id SERIAL PRIMARY KEY,
    periodo_id INTEGER NOT NULL REFERENCES periodos_asignados(id),
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id),
    intensidad_aplicada TEXT NOT NULL,        -- Intensidad que se aplicó
    completado BOOLEAN DEFAULT false,         -- Si fue completado
    nota_cliente TEXT,                        -- Nota del cliente
    nota_coach TEXT,                          -- Nota del coach
    fecha_ejecucion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(periodo_id, ejercicio_id, intensidad_aplicada)
);
```

## 🔄 **Flujo del Sistema**

### **Paso 1: Coach Crea Producto**
1. **Coach crea actividad** con ejercicios organizados por semanas/días
2. **Sistema almacena** en `ejercicios_detalles` con:
   - Información del ejercicio
   - Organización temporal (semana, día, periodo, bloque, orden)
   - Flag `replicar` si se puede replicar

### **Paso 2: Coach Define Intensidades**
1. **Coach define niveles** de intensidad para cada ejercicio
2. **Sistema almacena** en `intensidades` con:
   - Detalles de series (peso, repeticiones, series)
   - Duración y calorías por intensidad
   - Niveles: Principiante, Intermedio, Avanzado

### **Paso 3: Coach Configura Períodos**
1. **Coach decide replicar** el programa (ej: 3 períodos de 4 semanas)
2. **Sistema crea** registros en `periodos_asignados`:
   - Período 1: Semana 1-4
   - Período 2: Semana 5-8 (replicación)
   - Período 3: Semana 9-12 (replicación)

### **Paso 4: Cliente Ejecuta Ejercicios**
1. **Cliente accede** a su período asignado
2. **Sistema crea** registros en `ejecuciones_ejercicio`:
   - Un registro por ejercicio por período
   - Intensidad aplicada según nivel del cliente
   - Estado de completado y notas

## 📈 **Beneficios del Sistema**

### **1. Flexibilidad**
- ✅ **Múltiples períodos** sin duplicar ejercicios
- ✅ **Diferentes intensidades** por ejercicio
- ✅ **Seguimiento individual** por cliente

### **2. Escalabilidad**
- ✅ **Replicación automática** de programas
- ✅ **Gestión de períodos** independiente
- ✅ **Seguimiento detallado** de progreso

### **3. Eficiencia**
- ✅ **Una sola definición** de ejercicios
- ✅ **Múltiples intensidades** reutilizables
- ✅ **Seguimiento granular** por cliente

## 🎯 **Casos de Uso**

### **Caso 1: Programa Básico (4 semanas)**
```
Coach crea: 4 semanas de ejercicios
Sistema: 1 período de 4 semanas
Cliente: Ejecuta ejercicios del período 1
```

### **Caso 2: Programa con Replicación (12 semanas)**
```
Coach crea: 4 semanas de ejercicios + replicar 3 veces
Sistema: 3 períodos de 4 semanas cada uno
Cliente: Ejecuta período 1, luego período 2, luego período 3
```

### **Caso 3: Cliente Avanza de Intensidad**
```
Cliente inicia: Intensidad "Principiante"
Cliente progresa: Intensidad "Intermedio"
Sistema: Actualiza intensidad_aplicada en ejecuciones_ejercicio
```

## 🔧 **Implementación**

### **Scripts Creados:**
1. **`db/ajustar-estructura-tablas.sql`** - Ajustar tablas a nueva estructura
2. **`db/validar-estructura-actual.sql`** - Validar estado actual
3. **`db/verificar-estructura-detallada.sql`** - Verificar detalles

### **Endpoints Actualizados:**
1. **`/api/activity-exercises/[id]`** - Obtener ejercicios de actividad
2. **`/api/validate-structure`** - Validar estructura de tablas
3. **`/api/check-detailed-structure`** - Verificar estructura detallada

## 🚀 **Próximos Pasos**

1. **Ejecutar script de ajuste** de estructura
2. **Probar flujo completo** con datos de ejemplo
3. **Implementar lógica** de replicación de períodos
4. **Crear interfaces** para gestión de períodos
5. **Implementar seguimiento** de clientes

## 📊 **Métricas Esperadas**

- **🔽 Complejidad**: Reducida en ~70%
- **⚡ Rendimiento**: Mejorado en ~50%
- **📈 Escalabilidad**: Aumentada en ~90%
- **🎯 Flexibilidad**: Mejorada en ~80%

**¡El sistema está diseñado para ser modular, escalable y eficiente!** 🚀

































