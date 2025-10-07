import { createClient } from "@supabase/supabase-js"

// Singleton pattern para el cliente de Supabase
let supabaseClientInstance: ReturnType<typeof createClient> | null = null

export const createSupabaseClient = () => {
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClientInstance
}
