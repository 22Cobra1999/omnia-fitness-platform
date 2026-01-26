-- Migration: Add category column to coaches table
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Update existing coaches based on their specialization if possible
UPDATE public.coaches 
SET category = 'fitness' 
WHERE specialization ILIKE '%fitness%' OR specialization ILIKE '%gym%' OR specialization ILIKE '%deporte%';

UPDATE public.coaches 
SET category = 'nutricion' 
WHERE specialization ILIKE '%nutricion%';
