import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createRouteHandlerClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
    }

    // Solo intentar obtener cookies si estamos en runtime, no durante build
    let cookieStore
    try {
      cookieStore = await cookies()
    } catch (cookieError: any) {
      // Si falla obtener cookies (durante build), usar cliente simple sin cookies
      if (process.env.NEXT_PHASE === 'phase-production-build' || cookieError.message?.includes('cookies')) {
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
        return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        })
      }
      throw cookieError
    }
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      const allCookies = cookieStore.getAll()
      const hasAuthCookies = allCookies.some(cookie => 
        cookie.name.includes('supabase') || cookie.name.includes('auth')
      )
      console.log('🔍 [createRouteHandlerClient] Cookies encontradas:', {
        total: allCookies.length,
        hasAuthCookies,
        cookieNames: allCookies.map(c => c.name).slice(0, 5)
      })
    }

    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
              console.warn('⚠️ [createRouteHandlerClient] Could not set cookies:', error)
            }
          },
        },
        auth: {
          detectSessionInUrl: false,
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true
        }
      }
    )
  } catch (error) {
    console.error('❌ [createRouteHandlerClient] Error creando cliente:', error)
    throw error
  }
}

// Cliente con service role para operaciones que requieren permisos elevados
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  
  const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKeyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabaseUrl = typeof supabaseUrlRaw === 'string' ? supabaseUrlRaw.trim() : supabaseUrlRaw
  const serviceRoleKey = typeof serviceRoleKeyRaw === 'string' ? serviceRoleKeyRaw.trim() : serviceRoleKeyRaw
  
  if (!supabaseUrl || !serviceRoleKey) {
    // Durante build, retornar cliente placeholder
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return createSupabaseClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    }
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada. Algunas operaciones pueden fallar.')
    // Retornar null para que el código pueda manejar este caso
    return null
  }
  
  return createSupabaseClient(
    supabaseUrl,
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