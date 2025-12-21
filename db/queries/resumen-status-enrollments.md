# Resumen de Status Correcto para cada Enrollment

## Análisis (asumiendo fecha actual: 2025-12-21)

### ID 145 - Activity 48
- **Status actual**: 'activa'
- **Status correcto**: 'activa' ✅
- **Razón**: 
  - Tiene `start_date = '2025-10-09'` (empezó)
  - `program_end_date = null` (aún no se calculó o no tiene progreso)
  - No está finalizada
  - **Mantener**: 'activa'

### ID 168 - Activity 78
- **Status actual**: 'activa'
- **Status correcto**: 'finalizada' ❌
- **Razón**: 
  - Tiene `start_date = '2025-10-20'` (empezó)
  - `program_end_date = '2025-12-19'` (ya pasó - 2 días atrás)
  - **Corregir a**: 'finalizada'

### ID 181 - Activity 59 (versión 1)
- **Status actual**: 'pendiente'
- **Status correcto**: 'expirada' ❌
- **Razón**: 
  - `start_date = null` (no empezó)
  - `expiration_date = '2025-12-18'` (ya pasó - 3 días atrás)
  - **Corregir a**: 'expirada'

### ID 191 - Activity 59 (versión 2)
- **Status actual**: 'pendiente'
- **Status correcto**: 'pendiente' ✅
- **Razón**: 
  - `start_date = null` (no empezó)
  - `expiration_date = '2025-12-22'` (aún no pasa - 1 día más)
  - **Mantener**: 'pendiente'

### ID 203 - Activity 93
- **Status actual**: 'activa'
- **Status correcto**: 'activa' ✅
- **Razón**: 
  - Tiene `start_date = '2025-12-22'` (empezó)
  - `program_end_date = '2026-01-18'` (aún no pasa - 28 días más)
  - No está finalizada
  - **Mantener**: 'activa'

## Resumen de Correcciones Necesarias

1. **ID 168**: 'activa' → 'finalizada' (program_end_date pasó)
2. **ID 181**: 'pendiente' → 'expirada' (expiration_date pasó sin empezar)

## Lógica de Status

1. **"expirada"**: `expiration_date < CURRENT_DATE` AND `start_date IS NULL`
2. **"finalizada"**: `program_end_date < CURRENT_DATE` OR status explícito 'finalizada'/'completed'
3. **"activa"**: `start_date IS NOT NULL` AND (`program_end_date IS NULL` OR `program_end_date >= CURRENT_DATE`)
4. **"pendiente"**: `start_date IS NULL` AND (`expiration_date IS NULL` OR `expiration_date >= CURRENT_DATE`)


## Análisis (asumiendo fecha actual: 2025-12-21)

### ID 145 - Activity 48
- **Status actual**: 'activa'
- **Status correcto**: 'activa' ✅
- **Razón**: 
  - Tiene `start_date = '2025-10-09'` (empezó)
  - `program_end_date = null` (aún no se calculó o no tiene progreso)
  - No está finalizada
  - **Mantener**: 'activa'

### ID 168 - Activity 78
- **Status actual**: 'activa'
- **Status correcto**: 'finalizada' ❌
- **Razón**: 
  - Tiene `start_date = '2025-10-20'` (empezó)
  - `program_end_date = '2025-12-19'` (ya pasó - 2 días atrás)
  - **Corregir a**: 'finalizada'

### ID 181 - Activity 59 (versión 1)
- **Status actual**: 'pendiente'
- **Status correcto**: 'expirada' ❌
- **Razón**: 
  - `start_date = null` (no empezó)
  - `expiration_date = '2025-12-18'` (ya pasó - 3 días atrás)
  - **Corregir a**: 'expirada'

### ID 191 - Activity 59 (versión 2)
- **Status actual**: 'pendiente'
- **Status correcto**: 'pendiente' ✅
- **Razón**: 
  - `start_date = null` (no empezó)
  - `expiration_date = '2025-12-22'` (aún no pasa - 1 día más)
  - **Mantener**: 'pendiente'

### ID 203 - Activity 93
- **Status actual**: 'activa'
- **Status correcto**: 'activa' ✅
- **Razón**: 
  - Tiene `start_date = '2025-12-22'` (empezó)
  - `program_end_date = '2026-01-18'` (aún no pasa - 28 días más)
  - No está finalizada
  - **Mantener**: 'activa'

## Resumen de Correcciones Necesarias

1. **ID 168**: 'activa' → 'finalizada' (program_end_date pasó)
2. **ID 181**: 'pendiente' → 'expirada' (expiration_date pasó sin empezar)

## Lógica de Status

1. **"expirada"**: `expiration_date < CURRENT_DATE` AND `start_date IS NULL`
2. **"finalizada"**: `program_end_date < CURRENT_DATE` OR status explícito 'finalizada'/'completed'
3. **"activa"**: `start_date IS NOT NULL` AND (`program_end_date IS NULL` OR `program_end_date >= CURRENT_DATE`)
4. **"pendiente"**: `start_date IS NULL` AND (`expiration_date IS NULL` OR `expiration_date >= CURRENT_DATE`)

