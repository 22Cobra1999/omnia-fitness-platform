import { getSupabaseClient } from '@/lib/supabase'

// Exportar createClient para compatibilidad con componentes existentes
export const createClient = getSupabaseClient

export { getSupabaseClient }
