-- Script para eliminar la tabla user_goals y sus políticas
-- Ya que hemos migrado al nuevo sistema de progreso con user_exercises y user_progress_records

-- Eliminar políticas RLS primero
DROP POLICY IF EXISTS "Users can view their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON user_goals;

-- Eliminar índices
DROP INDEX IF EXISTS idx_user_goals_user_id;

-- Eliminar la tabla user_goals
DROP TABLE IF EXISTS user_goals;

-- Comentario para documentar la eliminación
-- La tabla user_goals fue eliminada el [fecha] y reemplazada por:
-- - user_exercises: Para almacenar ejercicios del usuario
-- - user_progress_records: Para almacenar marcas/records de progreso


















































