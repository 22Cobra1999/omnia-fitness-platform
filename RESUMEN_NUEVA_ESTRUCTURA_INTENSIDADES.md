# Resumen: Nueva Estructura de Intensidades

## 📊 Datos Actuales
- **18 ejercicios** en `ejercicios_detalles` para la actividad 59
- **Estructura correcta**: `calorias` (INTEGER) y `detalle_series` (JSONB)
- **Datos válidos**: Todos los ejercicios tienen series y calorías

## 🎯 Objetivo
Crear una nueva tabla `intensidades` que:
- Tenga **una fila por intensidad** (no por serie)
- Use **mismo formato JSONB** para `detalle_series`
- Incluya **calorías por intensidad**
- Mantenga **relación 1:N** con `ejercicios_detalles`

## 📋 Estructura de la Nueva Tabla

```sql
CREATE TABLE intensidades (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id),
    nombre_ejercicio TEXT NOT NULL,
    intensidad TEXT NOT NULL, -- 'Principiante', 'Intermedio', 'Avanzado'
    detalle_series JSONB NOT NULL, -- [{"peso": 80, "repeticiones": 8, "series": 4}, ...]
    duracion_minutos INTEGER DEFAULT 30,
    calorias INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Transformación de Datos

### Para cada ejercicio (ej: Press de Banca):
**Original:**
```json
{
  "nombre_ejercicio": "Press de Banca",
  "calorias": 350,
  "detalle_series": [
    {"peso": 80, "repeticiones": 8, "series": 4},
    {"peso": 85, "repeticiones": 6, "series": 3},
    {"peso": 90, "repeticiones": 4, "series": 2}
  ]
}
```

**Se crearán 3 intensidades:**

1. **Principiante** (mismo peso, mismas calorías)
2. **Intermedio** (peso +15%, calorías +10%)
3. **Avanzado** (peso +30%, calorías +20%)

## 📈 Resultado Esperado

- **54 intensidades totales** (18 ejercicios × 3 intensidades)
- **3 intensidades por ejercicio**
- **Escalado automático** de peso y calorías
- **Misma estructura JSONB** para series

## 🚀 Scripts de Ejecución

1. **`db/execute-complete-setup.sql`**: Script completo (crear tabla + poblar datos)
2. **`db/test-final-query.sql`**: Verificar resultado

## ✅ Beneficios

1. **Eficiencia**: Una fila por intensidad en lugar de una por serie
2. **Flexibilidad**: Fácil agregar nuevas intensidades
3. **Consistencia**: Mismo formato JSONB en ambas tablas
4. **Escalabilidad**: Fácil asociar intensidades a clientes específicos
5. **Seguimiento**: Calorías específicas por intensidad

## 🎯 Próximo Paso

Ejecutar `db/execute-complete-setup.sql` en Supabase SQL Editor para crear la nueva estructura.

































