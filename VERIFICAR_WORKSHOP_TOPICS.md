# Verificación de Workshop Topics

## Queries para verificar en Supabase SQL Editor

### 1. Ver todos los temas guardados
```sql
SELECT * FROM workshop_topics ORDER BY created_at DESC;
```

### 2. Ver temas del producto ID 87 (Taller de Yoga Avanzado)
```sql
SELECT 
  id,
  activity_id,
  title,
  description,
  original_days_of_week,
  original_start_time,
  original_end_time,
  bis_enabled,
  bis_days_of_week,
  bis_start_time,
  bis_end_time,
  created_at
FROM workshop_topics 
WHERE activity_id = 87;
```

### 3. Ver workshop_schedule_blocks en activities
```sql
SELECT 
  id, 
  title, 
  workshop_type, 
  workshop_schedule_blocks::text 
FROM activities 
WHERE id = 87;
```

### 4. Ver todos los talleres con sus temas
```sql
SELECT 
  a.id,
  a.title as activity_title,
  wt.id as topic_id,
  wt.title as topic_title,
  wt.original_days_of_week,
  wt.original_start_time,
  wt.original_end_time,
  wt.bis_enabled
FROM activities a
LEFT JOIN workshop_topics wt ON a.id = wt.activity_id
WHERE a.type = 'workshop'
ORDER BY a.id, wt.id;
```

## Logs a verificar

Los logs del frontend muestran:
- ✅ `workshopSchedule` se envía correctamente con `title`, `description`, `date`, `startTime`, `endTime`, `duration`, `isPrimary`
- ✅ Los datos se envían al backend con el método PUT

Los logs del backend deberían mostrar:
- 📝 "Actualizando temas de taller en workshop_topics"
- 📊 El JSON completo del `workshopSchedule` recibido
- 🔢 Número de sesiones
- 🗑️ "Temas antiguos eliminados correctamente"
- 📊 "Total de temas encontrados: X"
- 🔄 "Procesando tema: [nombre del tema]"
- ✅ "Tema creado en workshop_topics: [nombre del tema]"

Si no ves estos logs del backend, significa que la condición no se está cumpliendo o hay un error silencioso.

## Productos creados para testing:
- **ID 86**: Taller de Meditación
- **ID 87**: Taller de Yoga Avanzado (última actualización: tema "Respiración Profunda")




