-- Script para actualizar datos del coach en la tabla coaches
-- Ejecutar este script en el SQL Editor de Supabase

-- Verificar si el coach existe en la tabla coaches
SELECT * FROM coaches WHERE id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

-- Si no existe, insertarlo con datos básicos
INSERT INTO coaches (
    id,
    full_name,
    specialization,
    experience_years,
    certifications,
    hourly_rate,
    bio,
    created_at,
    updated_at
) VALUES (
    'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f',
    'Franco Pomati coach',
    'General, Futbol',
    5,
    ARRAY['Certificación en Entrenamiento Personal', 'Certificación en Fútbol'],
    50.00,
    'Coach especializado en fitness y fútbol con 5 años de experiencia ayudando a deportistas a alcanzar sus objetivos.',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    specialization = EXCLUDED.specialization,
    experience_years = EXCLUDED.experience_years,
    certifications = EXCLUDED.certifications,
    hourly_rate = EXCLUDED.hourly_rate,
    bio = EXCLUDED.bio,
    updated_at = NOW();

-- Verificar que se insertó correctamente
SELECT * FROM coaches WHERE id = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';

