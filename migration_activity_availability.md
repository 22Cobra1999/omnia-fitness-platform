# Migración de Bloques de Horarios a activity_availability

## 1. Configurar RLS para activity_availability

```sql
-- Habilitar RLS en activity_availability
ALTER TABLE activity_availability ENABLE ROW LEVEL SECURITY;

-- Crear política para que los coaches puedan gestionar sus propios bloques
CREATE POLICY "Coaches can manage their own activity availability" ON activity_availability
FOR ALL USING (
  activity_id IN (
    SELECT id FROM activities 
    WHERE coach_id = auth.uid()
  )
);

-- Política para lectura pública (opcional)
CREATE POLICY "Public can view activity availability" ON activity_availability
FOR SELECT USING (
  activity_id IN (
    SELECT id FROM activities 
    WHERE is_public = true
  )
);
```

## 2. Verificar estructura de activity_availability

```sql
-- Verificar que la tabla tiene las columnas necesarias
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activity_availability'
ORDER BY ordinal_position;
```

## 3. Función para migrar datos existentes

```sql
-- Función para extraer bloques de horarios de la descripción
CREATE OR REPLACE FUNCTION migrate_workshop_blocks()
RETURNS void AS $$
DECLARE
    activity_record RECORD;
    blocks_json JSONB;
    block_record JSONB;
BEGIN
    -- Iterar sobre todas las actividades de tipo workshop
    FOR activity_record IN 
        SELECT id, description 
        FROM activities 
        WHERE type = 'workshop' 
        AND description LIKE '%[BLOQUES_HORARIO]%'
    LOOP
        -- Extraer el JSON de bloques de la descripción
        blocks_json := (
            SELECT jsonb_extract_path_text(
                jsonb_build_object('content', activity_record.description),
                'content'
            )::jsonb
        );
        
        -- Extraer solo la parte de bloques
        blocks_json := (
            SELECT jsonb_extract_path_text(
                blocks_json,
                'blocks'
            )::jsonb
        );
        
        -- Insertar cada bloque en activity_availability
        FOR block_record IN SELECT * FROM jsonb_array_elements(blocks_json)
        LOOP
            INSERT INTO activity_availability (
                activity_id,
                availability_type,
                session_type,
                start_time,
                end_time,
                start_date,
                end_date,
                color,
                selected_dates,
                repeat_type,
                selected_week_days,
                selected_weeks,
                selected_months
            ) VALUES (
                activity_record.id,
                'workshop_block',
                'scheduled',
                (block_record->>'startTime')::time,
                (block_record->>'endTime')::time,
                (block_record->>'startDate')::date,
                (block_record->>'endDate')::date,
                block_record->>'color',
                block_record->'selectedDates',
                block_record->>'repeatType',
                ARRAY(SELECT jsonb_array_elements_text(block_record->'selectedWeekDays')),
                ARRAY(SELECT jsonb_array_elements_text(block_record->'selectedWeeks')),
                ARRAY(SELECT jsonb_array_elements_text(block_record->'selectedMonths'))
            );
        END LOOP;
        
        -- Limpiar la descripción removiendo los bloques
        UPDATE activities 
        SET description = regexp_replace(
            description, 
            '\n\n\[BLOQUES_HORARIO\].*?\[/BLOQUES_HORARIO\]', 
            '', 
            's'
        )
        WHERE id = activity_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la migración
SELECT migrate_workshop_blocks();
```

## 4. Verificar migración

```sql
-- Verificar que los bloques se migraron correctamente
SELECT 
    a.title,
    aa.availability_type,
    aa.start_time,
    aa.end_time,
    aa.start_date,
    aa.end_date,
    aa.color
FROM activities a
JOIN activity_availability aa ON a.id = aa.activity_id
WHERE a.type = 'workshop'
ORDER BY a.title, aa.start_date;
```

## 5. Limpiar función después de migración

```sql
-- Eliminar la función de migración
DROP FUNCTION IF EXISTS migrate_workshop_blocks();
```

