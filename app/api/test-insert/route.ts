import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Obtener la sesión actual
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }
    const userId = session.user.id
    // Datos mínimos para la inserción
    const minimalData = {
      activity_id: 1, // Asegúrate de que este ID exista en la tabla activities
      client_id: userId,
      status: "test",
      created_at: new Date().toISOString(),
    }
    console.log("Intentando inserción mínima con:", minimalData)
    // Intento de inserción directa
    const { data: insertResult, error: insertError } = await supabase
      .from("activity_enrollments")
      .insert(minimalData)
      .select()
    if (insertError) {
      console.error("Error en inserción de prueba:", insertError)
      // Intentar obtener más información sobre el error
      const errorDetails = {
        code: insertError.code,
        message: insertError.message,
        hint: insertError.hint,
        details: insertError.details,
      }
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          details: errorDetails,
          attempted: minimalData,
        },
        { status: 500 },
      )
    }
    return NextResponse.json({
      success: true,
      message: "Inserción de prueba exitosa",
      data: insertResult,
    })
  } catch (error) {
    console.error("Error en test-insert:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
