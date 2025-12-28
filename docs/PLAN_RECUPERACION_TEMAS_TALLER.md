# Plan de Recuperación y Persistencia de Temas de Taller

## 🔍 Problema Identificado

1. **Eliminación prematura**: En `app/api/products/route.ts` (línea 1004-1012), cuando se edita un taller, se eliminan TODOS los temas existentes ANTES de insertar los nuevos.
2. **Pérdida de datos**: Si hay un error o el usuario no completa el proceso, se pierden los datos antiguos.
3. **No se guardan nuevos horarios**: Si el proceso falla después de eliminar, los nuevos horarios tampoco se guardan.

## 📋 Plan de Solución

### PASO 1: Crear Endpoint de Recuperación desde `ejecuciones_taller`
- **Archivo**: `app/api/workshop/recover-topics/route.ts`
- **Función**: Recuperar temas y horarios desde `ejecuciones_taller.temas_cubiertos`
- **Lógica**:
  1. Buscar todas las ejecuciones del taller
  2. Extraer temas únicos desde `temas_cubiertos`
  3. Agrupar por `tema_nombre`
  4. Convertir a formato `taller_detalles`
  5. Retornar datos recuperados

### PASO 2: Modificar Flujo PUT para Merge Inteligente
- **Archivo**: `app/api/products/route.ts` (función PUT)
- **Cambios**:
  1. **NO eliminar** temas existentes al inicio
  2. **Cargar temas existentes** desde `taller_detalles`
  3. **Hacer merge inteligente**:
     - Si el tema existe (mismo nombre), **actualizar** horarios
     - Si el tema no existe, **insertar** nuevo
     - Si un tema existente no está en los nuevos datos, **mantenerlo** (no eliminar)
  4. **Solo actualizar** horarios de temas que cambiaron
  5. **Insertar** solo temas nuevos

### PASO 3: Endpoint de Recuperación Manual
- **Archivo**: `app/api/workshop/recover-topics/route.ts`
- **Método**: POST
- **Body**: `{ actividad_id: number }`
- **Respuesta**: Datos recuperados desde `ejecuciones_taller`

### PASO 4: Modificar Frontend para Cargar Datos Existentes
- **Archivo**: `components/shared/products/create-product-modal-refactored.tsx`
- **Cambios**:
  1. Al cargar datos del taller, **preservar** temas existentes
  2. Al agregar nuevos horarios, **mergear** con existentes
  3. Mostrar mensaje si se recuperan datos desde `ejecuciones_taller`

### PASO 5: Probar en Browser
- Abrir taller existente
- Agregar nuevos horarios
- Verificar que se mantienen los antiguos
- Verificar que se guardan los nuevos

## 🔄 Flujo Detallado

### Flujo Actual (PROBLEMÁTICO):
```
1. Usuario edita taller
2. Frontend envía nuevos horarios
3. Backend ELIMINA todos los temas (❌)
4. Backend intenta insertar nuevos temas
5. Si falla → Datos perdidos (❌)
```

### Flujo Nuevo (SOLUCIONADO):
```
1. Usuario edita taller
2. Frontend envía nuevos horarios
3. Backend CARGA temas existentes
4. Backend hace MERGE:
   - Actualiza temas existentes con nuevos horarios
   - Inserta temas nuevos
   - Mantiene temas que no cambiaron
5. Si falla → Datos antiguos se mantienen (✅)
6. Si éxito → Todos los datos se guardan (✅)
```

## 📊 Estructura de Datos

### Desde `ejecuciones_taller.temas_cubiertos`:
```json
[
  {
    "tema_id": 2,
    "tema_nombre": "Flexibilidad y Movilidad",
    "fecha_seleccionada": "2025-10-15",
    "horario_seleccionado": {
      "hora_inicio": "10:00",
      "hora_fin": "12:00"
    }
  }
]
```

### Convertir a formato `taller_detalles`:
```json
{
  "nombre": "Flexibilidad y Movilidad",
  "descripcion": "",
  "originales": {
    "fechas_horarios": [
      {
        "fecha": "2025-10-15",
        "hora_inicio": "10:00",
        "hora_fin": "12:00",
        "cupo": 20
      }
    ]
  }
}
```

## ✅ Checklist de Implementación

- [ ] Crear endpoint de recuperación
- [ ] Modificar PUT para merge inteligente
- [ ] Probar recuperación desde `ejecuciones_taller`
- [ ] Probar merge de horarios
- [ ] Probar persistencia de datos
- [ ] Probar en browser completo




























