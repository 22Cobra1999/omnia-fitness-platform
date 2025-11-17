import { createBrowserClient } from "@supabase/ssr"

// Singleton pattern para el cliente de Supabase
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

export const createSupabaseClient = () => {
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // createBrowserClient usa document.cookie automáticamente en el navegador
  // No necesitamos configuración adicional de cookies
  supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return supabaseClientInstance
}

// Alias for compatibility
export const getSupabaseClient = createSupabaseClient
export { createSupabaseClient as createClient }
