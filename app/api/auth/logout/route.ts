import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("[SERVER] Logout request received")
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("[SERVER] Supabase logout error:", error)
      // Continuar de todos modos para limpiar cookies
    } else {
      console.log("[SERVER] Supabase logout successful")
    }
    // Crear respuesta exitosa
    const response = new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
    // Limpiar cookies específicas de Supabase
    const supabaseCookies = [
      "sb-access-token",
      "sb-refresh-token",
      "sb-provider-token",
      "sb-auth-token",
      "sb-id-token",
      "sb-session",
      "sb-user",
      "sb-auth-event",
      "sb-auth-data",
      "sb-auth-state",
      "sb-auth-storage",
      "sb-auth-callback",
      "sb-auth-return-to",
      "sb-auth-token-scopes",
      "sb-auth-token-type",
      "sb-auth-token-expiry",
      "sb-auth-token-issued-at",
      "sb-auth-token-refresh-at",
      "sb-auth-token-refresh-expiry",
      "sb-auth-token-refresh-issued-at",
      "sb-auth-token-refresh-token-type",
      "sb-auth-token-refresh-token-scopes",
      "sb-auth-token-refresh-token-expiry",
      "sb-auth-token-refresh-token-issued-at",
      "sb-auth-token-refresh-token-refresh-at",
      "sb-auth-token-refresh-token-refresh-expiry",
      "sb-auth-token-refresh-token-refresh-issued-at",
      "sb-auth-token-refresh-token-refresh-token-type",
      "sb-auth-token-refresh-token-refresh-token-scopes",
    ]
    // Buscar y limpiar cookies de Supabase con el patrón específico
    const allCookies = cookieStore.getAll()
    const supabasePattern = /^sb-.*/
    allCookies.forEach((cookie) => {
      if (supabasePattern.test(cookie.name)) {
        try {
          console.log(`[SERVER] Clearing Supabase cookie: ${cookie.name}`)
          cookieStore.delete(cookie.name)
        } catch (cookieError) {
          console.warn(`[SERVER] Could not clear cookie ${cookie.name}:`, cookieError)
        }
      }
    })
    // Limpiar cookies específicas también
    supabaseCookies.forEach((cookieName) => {
      try {
        cookieStore.delete(cookieName)
      } catch (cookieError) {
        // Ignore individual cookie errors
      }
    })
    console.log("[SERVER] Logout completed successfully")
    return response
  } catch (error: any) {
    console.error("[SERVER] Unexpected server-side logout error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
