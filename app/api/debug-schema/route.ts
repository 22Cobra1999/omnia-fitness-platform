import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/supabase-server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Consulta SQL para listar triggers
    const { data: triggers, error: triggerError } = await supabase.rpc('debug_get_triggers', { p_table_name: 'nutrition_program_details' })

    if (triggerError) {
        // Fallback: intentar inferir qué está pasando si el RPC no existe
        return NextResponse.json({ 
            error: "RPC debug_get_triggers no existe. Por favor, crea una función PL/pgSQL para listar triggers.",
            triggerError 
        })
    }

    return NextResponse.json({ triggers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
