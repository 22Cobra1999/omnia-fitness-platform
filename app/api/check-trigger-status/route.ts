import { NextResponse } from "next/server"
import { createClientWithCookies } from "../../../lib/supabase-server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClientWithCookies(cookieStore)

    // console.log("🔍 Verificando estado del trigger...")

    // Verificar si existe el trigger
    const { data: triggers, error: triggersError } = await supabase
      .rpc('check_trigger_exists', { trigger_name: 'trigger_generate_periods_and_executions' })

    if (triggersError) {
      console.log("No se puede verificar trigger via RPC, asumiendo que no existe")
      
      return NextResponse.json({
        success: false,
        message: "Trigger no verificado - ejecutar script de creación",
        data: {
          triggerExists: false,
          nextStep: "Ejecutar db/create-complete-trigger-final.sql en Supabase"
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Trigger verificado",
      data: {
        triggerExists: true,
        triggerName: "trigger_generate_periods_and_executions"
      }
    })
  } catch (error: any) {
    console.error("Error verificando trigger:", error)
    return NextResponse.json({ 
      success: false, 
      message: "No se puede verificar trigger",
      data: {
        triggerExists: false,
        nextStep: "Ejecutar db/create-complete-trigger-final.sql en Supabase"
      }
    }, { status: 500 })
  }
}
































