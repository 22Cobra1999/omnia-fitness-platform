import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    const activityId = 59

    console.log("🧪 Probando inserción de ejercicio...")

    // Probar inserción de un ejercicio simple
    const { data: insertResult, error: insertError } = await supabase
      .from("ejercicios_detalles")
      .insert({
        activity_id: activityId,
        nombre_ejercicio: "Test Exercise",
        tipo: "fuerza",
        semana: 1,
        dia: 1
      })
      .select()

    if (insertError) {
      console.error("Error insertando ejercicio:", insertError)
      return NextResponse.json({ 
        success: false, 
        error: insertError.message,
        code: insertError.code,
        details: insertError
      }, { status: 500 })
    }

    // console.log("✅ Ejercicio insertado:", insertResult)

    // Verificar que se puede leer
    const { data: readResult, error: readError } = await supabase
      .from("ejercicios_detalles")
      .select("*")
      .eq("activity_id", activityId)
      .eq("nombre_ejercicio", "Test Exercise")

    if (readError) {
      console.error("Error leyendo ejercicio:", readError)
      return NextResponse.json({ 
        success: false, 
        error: "Error leyendo ejercicio: " + readError.message 
      }, { status: 500 })
    }

    // Limpiar ejercicio de prueba
    await supabase
      .from("ejercicios_detalles")
      .delete()
      .eq("nombre_ejercicio", "Test Exercise")

    return NextResponse.json({
      success: true,
      message: "Prueba de inserción exitosa",
      data: {
        insertResult,
        readResult,
        canInsert: true,
        canRead: true
      }
    })
  } catch (error: any) {
    console.error("Error en la API de prueba:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































