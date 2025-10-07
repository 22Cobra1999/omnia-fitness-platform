# Endpoints para las Nuevas Tablas del Sistema

## 🎯 **Resumen**
Se han creado endpoints completos para reemplazar la funcionalidad de las tablas viejas con las nuevas tablas optimizadas:
- `planificacion_ejercicios` - Programación de ejercicios por semana/día
- `progreso_cliente` - Seguimiento individual de clientes
- `periodos` - Gestión de períodos de entrenamiento

## 📋 **Endpoints Creados**

### **1. Planificación de Ejercicios**
**Endpoint:** `/api/planificacion-ejercicios`

#### **GET** - Obtener planificación
```bash
curl -X GET "http://localhost:3000/api/planificacion-ejercicios?actividad_id=101&numero_semana=1"
```

#### **POST** - Crear/actualizar planificación
```bash
curl -X POST http://localhost:3000/api/planificacion-ejercicios \
  -H "Content-Type: application/json" \
  -d '{
    "actividad_id": 101,
    "numero_semana": 1,
    "lunes": {"ejercicios": [5,6]},
    "martes": {"ejercicios": [7]},
    "miercoles": {"ejercicios": [8]},
    "jueves": {"ejercicios": [9]},
    "viernes": {"ejercicios": [10,11]},
    "sabado": {"ejercicios": [12]},
    "domingo": {}
  }'
```

#### **DELETE** - Eliminar planificación
```bash
curl -X DELETE "http://localhost:3000/api/planificacion-ejercicios?id=1"
```

### **2. Progreso de Cliente**
**Endpoint:** `/api/progreso-cliente`

#### **GET** - Obtener progreso
```bash
curl -X GET "http://localhost:3000/api/progreso-cliente?actividad_id=101&cliente_id=202"
```

#### **POST** - Crear/actualizar progreso
```bash
curl -X POST http://localhost:3000/api/progreso-cliente \
  -H "Content-Type: application/json" \
  -d '{
    "actividad_id": 101,
    "cliente_id": 202,
    "fecha": "2025-09-25",
    "ejercicios_completados": [5,6],
    "ejercicios_pendientes": [7,8],
    "detalles_series": {
      "5": [{"peso": 80, "series": 4, "reps": 8, "minutes": 12, "calories": 90}],
      "6": [{"peso": 30, "series": 3, "reps": 15, "minutes": 15, "calories": 100}]
    },
    "minutos_json": {"5": 30, "6": 15},
    "calorias_json": {"5": 220, "6": 100}
  }'
```

### **3. Períodos**
**Endpoint:** `/api/periodos`

#### **GET** - Obtener períodos
```bash
curl -X GET "http://localhost:3000/api/periodos?actividad_id=101"
```

#### **POST** - Crear/actualizar períodos
```bash
curl -X POST http://localhost:3000/api/periodos \
  -H "Content-Type: application/json" \
  -d '{
    "actividad_id": 101,
    "cantidad_periodos": 3
  }'
```

### **4. Programación Completa de Productos**
**Endpoint:** `/api/save-product-programming`

#### **POST** - Guardar programación completa
```bash
curl -X POST http://localhost:3000/api/save-product-programming \
  -H "Content-Type: application/json" \
  -d '{
    "actividad_id": 101,
    "semanas_programacion": [
      {
        "lunes": {"ejercicios": [5,6]},
        "martes": {"ejercicios": [7]},
        "miercoles": {"ejercicios": [8]},
        "jueves": {"ejercicios": [9]},
        "viernes": {"ejercicios": [10,11]},
        "sabado": {"ejercicios": [12]},
        "domingo": {}
      }
    ],
    "cantidad_periodos": 2
  }'
```

#### **GET** - Obtener programación completa
```bash
curl -X GET "http://localhost:3000/api/save-product-programming?actividad_id=101"
```

### **5. Migración de Datos**
**Endpoint:** `/api/migrate-exercise-data`

#### **POST** - Migrar datos existentes
```bash
curl -X POST http://localhost:3000/api/migrate-exercise-data \
  -H "Content-Type: application/json" \
  -d '{
    "actividad_id": 101,
    "force_migration": true
  }'
```

### **6. Estadísticas de Productos**
**Endpoint:** `/api/product-statistics`

#### **GET** - Obtener estadísticas
```bash
curl -X GET "http://localhost:3000/api/product-statistics?actividad_id=101"
```

### **7. Creación Mejorada de Productos**
**Endpoint:** `/api/create-product-enhanced`

#### **POST** - Crear producto con programación
```bash
curl -X POST http://localhost:3000/api/create-product-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Programa de Fuerza",
    "description": "Programa de 8 semanas",
    "price": 99.99,
    "type": "program",
    "semanas_programacion": [
      {
        "lunes": {"ejercicios": [1,2]},
        "martes": {"ejercicios": [3]},
        "miercoles": {"ejercicios": [4]},
        "jueves": {"ejercicios": [5]},
        "viernes": {"ejercicios": [6,7]},
        "sabado": {"ejercicios": [8]},
        "domingo": {}
      }
    ],
    "cantidad_periodos": 2
  }'
```

## 🔄 **Flujo de Uso Recomendado**

### **1. Crear Producto con Programación**
```bash
# 1. Crear producto con programación completa
curl -X POST http://localhost:3000/api/create-product-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Programa",
    "description": "Programa personalizado",
    "price": 50.00,
    "type": "program",
    "semanas_programacion": [...],
    "cantidad_periodos": 2
  }'
```

### **2. Obtener Estadísticas**
```bash
# 2. Ver estadísticas del producto
curl -X GET "http://localhost:3000/api/product-statistics?actividad_id=101"
```

### **3. Registrar Progreso de Cliente**
```bash
# 3. Registrar progreso de un cliente
curl -X POST http://localhost:3000/api/progreso-cliente \
  -H "Content-Type: application/json" \
  -d '{
    "actividad_id": 101,
    "cliente_id": 202,
    "fecha": "2025-09-25",
    "ejercicios_completados": [1,2],
    "ejercicios_pendientes": [3,4]
  }'
```

## 📊 **Estructura de Datos**

### **Planificación de Ejercicios**
```json
{
  "actividad_id": 101,
  "numero_semana": 1,
  "lunes": {"ejercicios": [5,6]},
  "martes": {"ejercicios": [7]},
  "miercoles": {"ejercicios": [8]},
  "jueves": {"ejercicios": [9]},
  "viernes": {"ejercicios": [10,11]},
  "sabado": {"ejercicios": [12]},
  "domingo": {}
}
```

### **Progreso de Cliente**
```json
{
  "actividad_id": 101,
  "cliente_id": 202,
  "fecha": "2025-09-25",
  "ejercicios_completados": [5,6],
  "ejercicios_pendientes": [7,8],
  "detalles_series": {
    "5": [{"peso": 80, "series": 4, "reps": 8, "minutes": 12, "calories": 90}]
  },
  "minutos_json": {"5": 30},
  "calorias_json": {"5": 220}
}
```

## ✅ **Ventajas del Nuevo Sistema**

1. **📊 Mejor Organización**: Datos estructurados por semana/día
2. **🔄 Replicación Fácil**: Sistema de períodos para duplicar programas
3. **📈 Seguimiento Individual**: Progreso detallado por cliente
4. **⚡ Rendimiento**: Consultas optimizadas con índices
5. **🔧 Mantenimiento**: Estructura más limpia y fácil de mantener

## 🚀 **Próximos Pasos**

1. **Integrar en el Frontend**: Actualizar componentes para usar nuevos endpoints
2. **Migrar Datos Existentes**: Ejecutar migración de datos históricos
3. **Testing**: Probar todos los flujos de usuario
4. **Documentación**: Crear guías de uso para desarrolladores






















