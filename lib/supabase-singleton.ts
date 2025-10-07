import { createClient } from '@/lib/supabase-browser'

// Singleton global para evitar múltiples instancias
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    // En el servidor, crear un nuevo cliente cada vez
    return createClient()
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }

  return supabaseInstance
}

// Función para limpiar la instancia si es necesario
export function clearSupabaseInstance() {
  supabaseInstance = null
}
