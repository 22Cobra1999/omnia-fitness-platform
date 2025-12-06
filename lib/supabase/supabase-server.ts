import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn('Could not set cookies:', error)
          }
        },
      },
      auth: {
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    }
  )
}

// Cliente con service role para operaciones que requieren permisos elevados
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada. Algunas operaciones pueden fallar.')
    // Retornar null para que el código pueda manejar este caso
    return null
  }
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Alias para compatibilidad con código existente
export const createClient = createRouteHandlerClient
export const createClientWithCookies = createRouteHandlerClient