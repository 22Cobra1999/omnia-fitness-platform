import { NextRequest, NextResponse } from 'next/server';
import { createClientWithCookies } from '../../../lib/supabase-server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const supabase = await createClientWithCookies(cookieStore);

    // Leer el script SQL
    const scriptPath = path.join(process.cwd(), 'db', 'fix-double-execution-trigger.sql');
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');

    // Ejecutar el script SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlScript });

    if (error) {
      console.error('Error ejecutando script:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error ejecutando script SQL',
        details: error 
      });
    }

    // Verificar el estado después del fix
    const { data: executions, error: executionsError } = await supabase
      .from('ejecuciones_ejercicio')
      .select('*');

    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `SELECT trigger_name, event_manipulation, action_timing 
                    FROM information_schema.triggers 
                    WHERE trigger_name = 'trigger_generate_executions'` 
      });

    return NextResponse.json({
      success: true,
      message: 'Trigger corregido exitosamente',
      data: {
        executionsCount: executions?.length || 0,
        executionsError,
        triggers,
        triggersError
      }
    });

  } catch (error) {
    console.error('Error en execute-trigger-fix:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}






































