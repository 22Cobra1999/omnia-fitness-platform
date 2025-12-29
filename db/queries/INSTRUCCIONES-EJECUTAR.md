# Instrucciones para Ejecutar las Correcciones

## Resumen de Status Correcto

### Análisis de cada Enrollment (fecha actual: 2025-12-21)

| ID | Activity | Status Actual | Status Correcto | Razón |
|---|---|---|---|---|
| 145 | 48 | 'activa' | **'activa'** ✅ | Empezó (start_date) y no está finalizada |
| 168 | 78 | 'activa' | **'finalizada'** ❌ | program_end_date ('2025-12-19') ya pasó |
| 181 | 59 | 'pendiente' | **'expirada'** ❌ | expiration_date ('2025-12-18') pasó sin empezar |
| 191 | 59 | 'pendiente' | **'pendiente'** ✅ | No empezó y expiration_date aún no pasa |
| 203 | 93 | 'activa' | **'activa'** ✅ | Empezó y program_end_date aún no pasa |

## Correcciones Necesarias

1. **ID 168**: Cambiar de 'activa' a 'finalizada'
2. **ID 181**: Cambiar de 'pendiente' a 'expirada'

## Lógica de Status

1. **"expirada"**: `expiration_date < CURRENT_DATE` AND `start_date IS NULL`
   - El cliente no empezó y se venció el plazo para empezar

2. **"finalizada"**: `program_end_date < CURRENT_DATE` OR status explícito 'finalizada'/'completed'
   - El programa terminó (última fecha de progreso + 6 días ya pasó)

3. **"activa"**: `start_date IS NOT NULL` AND (`program_end_date IS NULL` OR `program_end_date >= CURRENT_DATE`)
   - El cliente empezó y el programa aún no terminó

4. **"pendiente"**: `start_date IS NULL` AND (`expiration_date IS NULL` OR `expiration_date >= CURRENT_DATE`)
   - El cliente no empezó pero aún tiene tiempo para hacerlo

## Ejecutar Queries

Ejecuta el archivo: `db/queries/ejecutar-correcciones-completas.sql`

Este script:
1. Populará `expiration_date` si falta (created_at + 10 días)
2. Populará `program_end_date` si falta (última fecha progreso + 6 días)
3. Corregirá todos los status según la lógica
4. Mostrará una verificación final


## Resumen de Status Correcto

### Análisis de cada Enrollment (fecha actual: 2025-12-21)

| ID | Activity | Status Actual | Status Correcto | Razón |
|---|---|---|---|---|
| 145 | 48 | 'activa' | **'activa'** ✅ | Empezó (start_date) y no está finalizada |
| 168 | 78 | 'activa' | **'finalizada'** ❌ | program_end_date ('2025-12-19') ya pasó |
| 181 | 59 | 'pendiente' | **'expirada'** ❌ | expiration_date ('2025-12-18') pasó sin empezar |
| 191 | 59 | 'pendiente' | **'pendiente'** ✅ | No empezó y expiration_date aún no pasa |
| 203 | 93 | 'activa' | **'activa'** ✅ | Empezó y program_end_date aún no pasa |

## Correcciones Necesarias

1. **ID 168**: Cambiar de 'activa' a 'finalizada'
2. **ID 181**: Cambiar de 'pendiente' a 'expirada'

## Lógica de Status

1. **"expirada"**: `expiration_date < CURRENT_DATE` AND `start_date IS NULL`
   - El cliente no empezó y se venció el plazo para empezar

2. **"finalizada"**: `program_end_date < CURRENT_DATE` OR status explícito 'finalizada'/'completed'
   - El programa terminó (última fecha de progreso + 6 días ya pasó)

3. **"activa"**: `start_date IS NOT NULL` AND (`program_end_date IS NULL` OR `program_end_date >= CURRENT_DATE`)
   - El cliente empezó y el programa aún no terminó

4. **"pendiente"**: `start_date IS NULL` AND (`expiration_date IS NULL` OR `expiration_date >= CURRENT_DATE`)
   - El cliente no empezó pero aún tiene tiempo para hacerlo

## Ejecutar Queries

Ejecuta el archivo: `db/queries/ejecutar-correcciones-completas.sql`

Este script:
1. Populará `expiration_date` si falta (created_at + 10 días)
2. Populará `program_end_date` si falta (última fecha progreso + 6 días)
3. Corregirá todos los status según la lógica
4. Mostrará una verificación final




