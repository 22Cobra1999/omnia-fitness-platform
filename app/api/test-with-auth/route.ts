import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔍 Probando con autenticación...")

    // Verificar sesión
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no autenticado: " + (userError?.message || "No user found") 
      }, { status: 401 })
    }

    // console.log("✅ Usuario autenticado:", user.email)

    // Probar lectura de ejercicios
    const { data: exercises, error: exercisesError } = await supabase
      .from("ejercicios_detalles")
      .select("id, nombre_ejercicio, tipo")
      .eq("activity_id", 59)
      .limit(5)

    if (exercisesError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error leyendo ejercicios: " + exercisesError.message 
      }, { status: 500 })
    }

    // console.log("✅ Ejercicios leídos:", exercises?.length || 0)

    // Probar inserción de ejercicio
    const { data: insertResult, error: insertError } = await supabase
      .from("ejercicios_detalles")
      .insert({
        activity_id: 59,
        nombre_ejercicio: "Test Exercise Auth",
        tipo: "fuerza",
        semana: 1,
        dia: 1
      })
      .select()

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: "Error insertando ejercicio: " + insertError.message 
      }, { status: 500 })
    }

    // console.log("✅ Ejercicio insertado:", insertResult)

    // Limpiar ejercicio de prueba
    await supabase
      .from("ejercicios_detalles")
      .delete()
      .eq("nombre_ejercicio", "Test Exercise Auth")

    return NextResponse.json({
      success: true,
      message: "Prueba con autenticación exitosa",
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        exercisesRead: exercises?.length || 0,
        exerciseInserted: true,
        canRead: true,
        canInsert: true
      }
    })
  } catch (error: any) {
    console.error("Error en la API de prueba con auth:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
































