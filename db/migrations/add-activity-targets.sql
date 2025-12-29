-- Agregar columnas de metas a la tabla activities
-- Estas columnas almacenarán los objetivos diarios según lo comprado por el cliente

ALTER TABLE activities ADD COLUMN daily_kcal_target INTEGER DEFAULT 500;
ALTER TABLE activities ADD COLUMN daily_minutes_target INTEGER DEFAULT 60;
ALTER TABLE activities ADD COLUMN daily_exercises_target INTEGER DEFAULT 3;
ALTER TABLE activities ADD COLUMN daily_plates_target INTEGER DEFAULT 4;
ALTER TABLE activities ADD COLUMN program_duration_days INTEGER DEFAULT 30;

-- Actualizar valores existentes según el tipo de actividad
UPDATE activities 
SET 
    daily_kcal_target = CASE 
        WHEN type = 'fitness' THEN 500
        WHEN type = 'nutrition' THEN 400
        ELSE 500
    END,
    daily_minutes_target = CASE 
        WHEN type = 'fitness' THEN 60
        WHEN type = 'nutrition' THEN 0
        ELSE 45
    END,
    daily_exercises_target = CASE 
        WHEN type = 'fitness' THEN 3
        ELSE 0
    END,
    daily_plates_target = CASE 
        WHEN type = 'nutrition' THEN 4
        ELSE 0
    END
WHERE daily_kcal_target IS NULL OR daily_minutes_target IS NULL
