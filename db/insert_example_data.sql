-- Script con datos de ejemplo para las nuevas tablas

-- Insertar datos de ejemplo en la tabla periods
INSERT INTO periods (activity_id, periods_count) VALUES
(101, 3),
(102, 2),
(103, 4)
ON CONFLICT (activity_id) DO UPDATE SET 
    periods_count = EXCLUDED.periods_count,
    updated_at = CURRENT_TIMESTAMP;

-- Insertar datos de ejemplo en la tabla exercise_planning
INSERT INTO exercise_planning (activity_id, week_number, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
-- Semana 1
(101, 1, 
 '{"exercises": [5,6]}',
 '{"exercises": [7]}',
 '{"exercises": [8]}',
 '{"exercises": [9]}',
 '{"exercises": [10,11]}',
 '{"exercises": [12]}',
 '{}'
),
-- Semana 2
(101, 2,
 '{"exercises": [5,6]}',
 '{"exercises": [7]}',
 '{"exercises": [8]}',
 '{"exercises": [9]}',
 '{"exercises": [10,11]}',
 '{"exercises": [12]}',
 '{}'
),
-- Semana 3
(101, 3,
 '{"exercises": [5,6]}',
 '{"exercises": [7]}',
 '{"exercises": [8]}',
 '{"exercises": [9]}',
 '{"exercises": [10,11]}',
 '{"exercises": [12]}',
 '{}'
),
-- Actividad 102 - Semana 1
(102, 1,
 '{"exercises": [1,2]}',
 '{"exercises": [3]}',
 '{"exercises": [4]}',
 '{}',
 '{"exercises": [5,6]}',
 '{}',
 '{}'
),
-- Actividad 102 - Semana 2
(102, 2,
 '{"exercises": [1,2]}',
 '{"exercises": [3]}',
 '{"exercises": [4]}',
 '{}',
 '{"exercises": [5,6]}',
 '{}',
 '{}'
)
ON CONFLICT (activity_id, week_number) DO UPDATE SET
    monday = EXCLUDED.monday,
    tuesday = EXCLUDED.tuesday,
    wednesday = EXCLUDED.wednesday,
    thursday = EXCLUDED.thursday,
    friday = EXCLUDED.friday,
    saturday = EXCLUDED.saturday,
    sunday = EXCLUDED.sunday,
    updated_at = CURRENT_TIMESTAMP;

-- Insertar datos de ejemplo en la tabla client_progress
INSERT INTO client_progress (activity_id, client_id, date, exercises_done, exercises_not_done, details_series, minutes_json, calories_json) VALUES
(101, 202, '2025-01-25',
 ARRAY[5,6],
 ARRAY[1,2,3,4],
 '{"5": [{"peso": 80, "series": 4, "reps": 8, "minutes": 12, "calories": 90}, {"peso": 85, "series": 3, "reps": 6, "minutes": 10, "calories": 70}, {"peso": 90, "series": 2, "reps": 4, "minutes": 8, "calories": 60}], "6": [{"peso": 30, "series": 3, "reps": 15, "minutes": 15, "calories": 100}]}',
 '{"5": 30, "6": 15}',
 '{"5": 220, "6": 100}'
),
(101, 203, '2025-01-25',
 ARRAY[7,8],
 ARRAY[9,10,11,12],
 '{"7": [{"peso": 50, "series": 3, "reps": 12, "minutes": 20, "calories": 150}], "8": [{"peso": 25, "series": 4, "reps": 15, "minutes": 18, "calories": 120}]}',
 '{"7": 20, "8": 18}',
 '{"7": 150, "8": 120}'
),
(102, 202, '2025-01-26',
 ARRAY[1,2,3],
 ARRAY[4,5,6],
 '{"1": [{"peso": 40, "series": 3, "reps": 10, "minutes": 15, "calories": 100}], "2": [{"peso": 35, "series": 3, "reps": 12, "minutes": 12, "calories": 80}], "3": [{"peso": 30, "series": 2, "reps": 15, "minutes": 10, "calories": 60}]}',
 '{"1": 15, "2": 12, "3": 10}',
 '{"1": 100, "2": 80, "3": 60}'
);

-- Verificar los datos insertados
SELECT 'periods' as tabla, COUNT(*) as registros FROM periods
UNION ALL
SELECT 'exercise_planning' as tabla, COUNT(*) as registros FROM exercise_planning
UNION ALL
SELECT 'client_progress' as tabla, COUNT(*) as registros FROM client_progress;

-- Mostrar algunos ejemplos de los datos
SELECT 'Periods' as tabla, activity_id, periods_count FROM periods LIMIT 3;
SELECT 'Exercise Planning' as tabla, activity_id, week_number, monday, tuesday FROM exercise_planning LIMIT 3;
SELECT 'Client Progress' as tabla, activity_id, client_id, date, exercises_done FROM client_progress LIMIT 3;






















