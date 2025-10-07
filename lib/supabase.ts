import { createBrowserClient } from "@supabase/ssr"

// Singleton para el cliente del navegador
let browserClientInstance: any = null

// Cliente para componentes del lado del cliente - SINGLETON
export const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    // En el servidor, usar el cliente del servidor
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  if (!browserClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    browserClientInstance = createBrowserClient(supabaseUrl, supabaseKey)
  }

  return browserClientInstance
}

// Para componentes de servidor y rutas API
export function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseKey)
}
