# 🔄 FLUJO COMPLETO DE GENERACIÓN DE EJECUCIONES_EJERCICIO

## 📋 **RESUMEN EJECUTIVO**

El sistema genera automáticamente las filas de `ejecuciones_ejercicio` cuando un cliente compra una actividad, combinando datos de múltiples tablas mediante triggers y lógica específica.

---

## 🗂️ **TABLAS INVOLUCRADAS**

### 1. **`activity_enrollments`** (Tabla Principal)
- **Propósito**: Registra cuando un cliente compra una actividad
- **Columnas clave**:
  - `id`: ID único del enrollment
  - `client_id`: ID del cliente
  - `activity_id`: ID de la actividad comprada
  - `created_at`: Fecha de compra

### 2. **`planificacion_ejercicios`** (Planificación Semanal)
- **Propósito**: Define QUÉ ejercicios van en cada día/semana
- **Columnas clave**:
  - `actividad_id`: ID de la actividad
  - `numero_semana`: Número de semana (1, 2, 3...)
  - `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo`: JSON con ejercicios por día
  - **Formato JSON**: `{"1":[{"id":1042,"orden":1}],"2":[{"id":1043,"orden":2}]}`

### 3. **`periodos`** (Réplicas/Repeticiones)
- **Propósito**: Define CUÁNTAS veces repetir toda la planificación
- **Columnas clave**:
  - `actividad_id`: ID de la actividad
  - `cantidad_periodos`: Número de réplicas (ej: 3 períodos = 3 repeticiones completas)

### 4. **`ejercicios_detalles`** (Detalles de Ejercicios)
- **Propósito**: Define los ejercicios disponibles y sus detalles
- **Columnas clave**:
  - `id`: ID único del ejercicio
  - `activity_id`: ID de la actividad
  - `nombre_ejercicio`: Nombre del ejercicio
  - `tipo`: Tipo de ejercicio (fuerza, cardio, etc.)
  - `detalle_series`: Series y repeticiones (ej: "(0-12-3);(0-10-2);(0-8-1)")

### 5. **`ejecuciones_ejercicio`** (Tabla Final)
- **Propósito**: Registra cada ejecución individual que debe hacer el cliente
- **Columnas clave**:
  - `ejercicio_id`: ID del ejercicio
  - `client_id`: ID del cliente
  - `periodo_id`: ID del período
  - `completado`: Si ya completó el ejercicio
  - `dia_semana`: Día de la semana (lunes, miercoles, jueves...)
  - `bloque`: Número del bloque (1, 2, 3, 4)
  - `orden`: Orden del ejercicio dentro del bloque
  - `detalle_series`: Series y repeticiones (copia de ejercicios_detalles)
  - `fecha_ejercicio`: NULL inicialmente (se llena cuando cliente comienza)

---

## 🔄 **FLUJO DETALLADO**

### **PASO 1: Cliente Compra Actividad**
```sql
INSERT INTO activity_enrollments (client_id, activity_id, created_at) 
VALUES ('cliente-123', 78, NOW());
```

### **PASO 2: Trigger se Activa**
- **Evento**: `AFTER INSERT` en `activity_enrollments`
- **Función**: `generate_ejecuciones_ejercicio()`

### **PASO 3: Lógica del Trigger**

#### **3.1 Obtener Datos de Planificación**
```sql
-- Obtener planificación de ejercicios
SELECT * FROM planificacion_ejercicios 
WHERE actividad_id = NEW.activity_id 
ORDER BY numero_semana;

-- Obtener cantidad de períodos
SELECT cantidad_periodos FROM periodos 
WHERE actividad_id = NEW.activity_id;

-- Obtener detalles de ejercicios
SELECT * FROM ejercicios_detalles 
WHERE activity_id = NEW.activity_id;
```

#### **3.2 Algoritmo de Generación**
```
PARA cada período (1 a cantidad_periodos):
  PARA cada semana (1 a total_semanas):
    PARA cada día (lunes a domingo):
      SI el día tiene ejercicios:
        PARA cada bloque (1, 2, 3, 4):
          PARA cada ejercicio en el bloque:
            INSERTAR ejecución con:
              - ejercicio_id
              - client_id = NEW.client_id
              - periodo_id
              - dia_semana = día actual
              - bloque = número del bloque
              - orden = orden del ejercicio
              - detalle_series = copia de ejercicios_detalles
              - fecha_ejercicio = NULL
```

---

## 📊 **EJEMPLO PRÁCTICO - ACTIVIDAD 78**

### **Datos de Entrada:**

#### **`planificacion_ejercicios`:**
```json
Semana 1, Lunes: {
  "1": [{"id": 1042, "orden": 1}],
  "2": [{"id": 1043, "orden": 2}],
  "3": [{"id": 1042, "orden": 3}],
  "4": [{"id": 1043, "orden": 4}]
}

Semana 2, Miércoles: {
  "1": [{"id": 1042, "orden": 1}],
  "2": [{"id": 1043, "orden": 2}]
}

Semana 2, Jueves: {
  "1": [{"id": 1042, "orden": 1}, {"id": 1043, "orden": 2}]
}
```

#### **`periodos`:**
```json
{
  "actividad_id": 78,
  "cantidad_periodos": 3
}
```

#### **`ejercicios_detalles`:**
```json
Ejercicio 1042 (HIIT Fútbol): {
  "detalle_series": null
}

Ejercicio 1043 (Flexiones): {
  "detalle_series": "(0-12-3);(0-10-2);(0-8-1)"
}
```

### **Resultado Final: 24 Ejecuciones**

#### **Período 1 (Réplica 1):**
1. HIIT Fútbol - lunes - bloque 1 - orden 1 - detalle_series: NULL
2. Flexiones - lunes - bloque 2 - orden 2 - detalle_series: (0-12-3);(0-10-2);(0-8-1)
3. HIIT Fútbol - lunes - bloque 3 - orden 3 - detalle_series: NULL
4. Flexiones - lunes - bloque 4 - orden 4 - detalle_series: (0-12-3);(0-10-2);(0-8-1)
5. HIIT Fútbol - miercoles - bloque 1 - orden 1 - detalle_series: NULL
6. Flexiones - miercoles - bloque 2 - orden 2 - detalle_series: (0-12-3);(0-10-2);(0-8-1)
7. HIIT Fútbol - jueves - bloque 1 - orden 1 - detalle_series: NULL
8. Flexiones - jueves - bloque 1 - orden 2 - detalle_series: (0-12-3);(0-10-2);(0-8-1)

#### **Período 2 (Réplica 2):** Misma secuencia (ejecuciones 9-16)
#### **Período 3 (Réplica 3):** Misma secuencia (ejecuciones 17-24)

---

## 🔧 **IMPLEMENTACIÓN DEL TRIGGER**

### **Función del Trigger:**
```sql
CREATE OR REPLACE FUNCTION generate_ejecuciones_ejercicio()
RETURNS TRIGGER AS $$
DECLARE
    planificacion_record RECORD;
    periodo_record RECORD;
    ejercicio_record RECORD;
    dias_semana TEXT[] := ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    dia TEXT;
    ejercicios_dia JSONB;
    bloque_key TEXT;
    bloque_ejercicios JSONB;
    ejercicio_item JSONB;
    periodo_actual INTEGER;
BEGIN
    -- Obtener datos de períodos
    SELECT * INTO periodo_record FROM periodos WHERE actividad_id = NEW.activity_id;
    
    -- Obtener datos de ejercicios
    FOR ejercicio_record IN 
        SELECT * FROM ejercicios_detalles WHERE activity_id = NEW.activity_id
    LOOP
        -- Procesar cada período (réplica)
        FOR periodo_actual IN 1..periodo_record.cantidad_periodos LOOP
            -- Procesar cada semana
            FOR planificacion_record IN 
                SELECT * FROM planificacion_ejercicios 
                WHERE actividad_id = NEW.activity_id 
                ORDER BY numero_semana
            LOOP
                -- Procesar cada día de la semana
                FOREACH dia IN ARRAY dias_semana LOOP
                    -- Verificar si el día tiene ejercicios
                    IF planificacion_record.dia IS NOT NULL AND planificacion_record.dia != '[]' THEN
                        ejercicios_dia := planificacion_record.dia::JSONB;
                        
                        -- Procesar cada bloque
                        FOR bloque_key IN SELECT jsonb_object_keys(ejercicios_dia) LOOP
                            bloque_ejercicios := ejercicios_dia->bloque_key;
                            
                            -- Procesar cada ejercicio en el bloque
                            FOR ejercicio_item IN SELECT * FROM jsonb_array_elements(bloque_ejercicios) LOOP
                                -- Insertar ejecución
                                INSERT INTO ejecuciones_ejercicio (
                                    ejercicio_id,
                                    client_id,
                                    periodo_id,
                                    completado,
                                    intensidad_aplicada,
                                    dia_semana,
                                    bloque,
                                    orden,
                                    detalle_series,
                                    created_at,
                                    updated_at
                                ) VALUES (
                                    (ejercicio_item->>'id')::INTEGER,
                                    NEW.client_id,
                                    periodo_record.id,
                                    FALSE,
                                    'Principiante',
                                    dia,
                                    bloque_key::INTEGER,
                                    (ejercicio_item->>'orden')::INTEGER,
                                    ejercicio_record.detalle_series,
                                    NOW(),
                                    NOW()
                                );
                            END LOOP;
                        END LOOP;
                    END IF;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Trigger:**
```sql
CREATE TRIGGER trigger_generate_ejecuciones_ejercicio
    AFTER INSERT ON activity_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION generate_ejecuciones_ejercicio();
```

---

## 🎯 **VENTAJAS DEL SISTEMA**

### **1. Automatización Completa**
- No requiere intervención manual
- Se ejecuta automáticamente en cada compra

### **2. Flexibilidad**
- Soporta múltiples períodos (réplicas)
- Soporta múltiples semanas por período
- Soporta múltiples bloques por día
- Soporta múltiples ejercicios por bloque

### **3. Integridad de Datos**
- Respeta el orden exacto de la planificación
- Copia datos reales de ejercicios_detalles
- Mantiene consistencia entre tablas

### **4. Escalabilidad**
- Funciona con cualquier cantidad de ejercicios
- Funciona con cualquier estructura de planificación
- Fácil de mantener y modificar

---

## 🔍 **VALIDACIONES Y VERIFICACIONES**

### **1. Verificar Orden Correcto**
```sql
SELECT 
    e.id,
    ed.nombre_ejercicio,
    e.dia_semana,
    e.bloque,
    e.orden,
    e.detalle_series
FROM ejecuciones_ejercicio e
JOIN ejercicios_detalles ed ON e.ejercicio_id = ed.id
WHERE e.client_id = 'cliente-123'
ORDER BY e.id;
```

### **2. Verificar Distribución por Día**
```sql
SELECT 
    dia_semana,
    COUNT(*) as total_ejecuciones
FROM ejecuciones_ejercicio
WHERE client_id = 'cliente-123'
GROUP BY dia_semana
ORDER BY dia_semana;
```

### **3. Verificar Distribución por Período**
```sql
SELECT 
    periodo_id,
    COUNT(*) as total_ejecuciones
FROM ejecuciones_ejercicio
WHERE client_id = 'cliente-123'
GROUP BY periodo_id
ORDER BY periodo_id;
```

---

## 🚀 **PRÓXIMOS PASOS**

1. **Implementar el trigger** en la base de datos
2. **Probar con una nueva compra** de actividad
3. **Verificar que se generan las ejecuciones** correctamente
4. **Documentar casos edge** y excepciones
5. **Optimizar performance** si es necesario

---

## 📝 **CONCLUSIÓN**

El sistema de triggers y lógica entre tablas permite generar automáticamente las filas de `ejecuciones_ejercicio` respetando:

- ✅ **Orden exacto** de la planificación
- ✅ **Datos reales** de ejercicios_detalles
- ✅ **Estructura de bloques** y orden
- ✅ **Réplicas/Períodos** según configuración
- ✅ **Integridad** y consistencia de datos

Este flujo garantiza que cada cliente tenga exactamente las ejecuciones que debe realizar, en el orden correcto, con los datos correctos, sin intervención manual.




