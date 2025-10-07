// lib/env-config.ts

// Función para obtener variables de entorno con valores por defecto
export function getEnv(key: string, defaultValue = ""): string {
  // En el navegador, buscar variables con NEXT_PUBLIC_
  if (typeof window !== "undefined") {
    const browserKey = `NEXT_PUBLIC_${key}`
    return process.env[browserKey] || defaultValue
  }

  // En el servidor, buscar la variable directamente
  return process.env[key] || defaultValue
}

// Configuración de Supabase
export const supabaseConfig = {
  url: getEnv("SUPABASE_URL", getEnv("NEXT_PUBLIC_SUPABASE_URL", "")),
  anonKey: getEnv("SUPABASE_ANON_KEY", getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")),
  serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
}

// Verificar si estamos en modo de desarrollo
export const isDevelopment = process.env.NODE_ENV === "development"

// Verificar si tenemos configuración de Supabase
export const hasSupabaseConfig = !!supabaseConfig.url && !!supabaseConfig.anonKey
