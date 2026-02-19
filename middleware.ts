import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Esta función se ejecuta en el edge runtime
export async function middleware(request: NextRequest) {
  // Inicializar respuesta
  const res = NextResponse.next()

  // Obtener la ruta
  const path = request.nextUrl.pathname

  // Verificar si es una solicitud de cierre de sesión
  const isLogoutRequest = path === "/api/auth/logout"

  // Si es una solicitud de cierre de sesión, permitir sin verificación
  if (isLogoutRequest) {
    return res
  }

  // Verificar si hay un parámetro de logout en la URL
  const isLogoutRedirect = request.nextUrl.searchParams.has("logout") || request.nextUrl.searchParams.has("forceLogout")

  // Si es una redirección después de logout, permitir sin verificación
  if (isLogoutRedirect && path === "/") {
    return res
  }

  // Definir rutas públicas que no requieren autenticación
  const isPublicPath =
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/api/") ||
    path === "/admin/setup" ||
    path === "/about" ||
    path === "/pricing" ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    // Permitir acceso a actividades públicas
    path.startsWith("/activities/") ||
    path.startsWith("/activity/") ||
    // Permitir acceso a la API de perfil para usuarios no autenticados
    path.startsWith("/api/profile") ||
    path === "/robots.txt" ||
    path === "/sitemap.xml"

  // Si es una ruta pública, permitir acceso sin verificación
  if (isPublicPath) {
    return res
  }

  // Verificar si hay una sesión activa
  try {
    // Obtener token de la cookie
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("Missing Supabase environment variables")
      return res
    }

    // Crear cliente de Supabase con control de caché
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      cookies: {
        get(name) {
          const cookie = request.cookies.get(name)
          return cookie?.value
        },
      },
      global: {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    })

    // Verificar sesión con múltiples intentos
    let sessionData = null
    let attempts = 0
    const maxAttempts = 2

    while (!sessionData && attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!error && data.session) {
          sessionData = data
          break
        }
      } catch (e) {
        console.warn(`Session verification attempt ${attempts + 1} failed:`, e)
      }
      attempts++
    }

    if (!sessionData?.session) {
      console.log("No hay sesión activa, redirigiendo a /")
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Si hay sesión, permitir acceso
    return res
  } catch (error) {
    console.error("Error in middleware:", error)
    // En caso de error, permitir acceso para evitar loops
    return res
  }
}

// Configurar middleware para ejecutarse en rutas específicas
export const config = {
  matcher: ["/profile/:path*", "/settings/:path*", "/dashboard/:path*", "/admin/:path*", "/mobile/profile/:path*"],
}
