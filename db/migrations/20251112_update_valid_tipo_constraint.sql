-- Actualiza el constraint valid_tipo para admitir todas las categorías disponibles en la app
ALTER TABLE ejercicios_detalles
  DROP CONSTRAINT IF EXISTS valid_tipo;

ALTER TABLE ejercicios_detalles
  ADD CONSTRAINT valid_tipo
  CHECK (
    tipo IN (
      'fuerza',
      'cardio',
      'hiit',
      'movilidad',
      'flexibilidad',
      'equilibrio',
      'funcional',
      'otro'
    )
  );
