import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔧 INSTALANDO TRIGGER CORREGIDO...')
    
    // Leer el archivo SQL
    const sqlPath = path.join(process.cwd(), 'sql', 'fix-trigger-complete.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📋 SQL leído correctamente, ejecutando...')
    console.log('📄 Contenido SQL:', sqlContent.substring(0, 200) + '...')
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`🔄 Ejecutando ${statements.length} statements SQL...`)
    
    const results = []
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`📝 Ejecutando statement ${i + 1}/${statements.length}...`)
      
      try {
        // Intentar con exec_sql
        const { data: result1, error: error1 } = await supabase
          .rpc('exec_sql', { sql: statement })
        
        if (!error1) {
          console.log(`✅ Statement ${i + 1} ejecutado con exec_sql:`, result1)
          results.push({ statement: i + 1, success: true, method: 'exec_sql', result: result1 })
          continue
        }
        
        // Intentar con execute_sql
        const { data: result2, error: error2 } = await supabase
          .rpc('execute_sql', { sql: statement })
        
        if (!error2) {
          console.log(`✅ Statement ${i + 1} ejecutado con execute_sql:`, result2)
          results.push({ statement: i + 1, success: true, method: 'execute_sql', result: result2 })
          continue
        }
        
        // Si ambos fallan
        console.log(`⚠️ Statement ${i + 1} falló con ambos métodos:`, { error1, error2 })
        results.push({ 
          statement: i + 1, 
          success: false, 
          error1, 
          error2,
          sql: statement.substring(0, 100) + '...'
        })
        
      } catch (e) {
        console.log(`❌ Error ejecutando statement ${i + 1}:`, e)
        results.push({ 
          statement: i + 1, 
          success: false, 
          error: e,
          sql: statement.substring(0, 100) + '...'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    console.log(`📊 Resultados: ${successCount} exitosos, ${failureCount} fallidos`)
    
    if (successCount > 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Trigger instalado: ${successCount}/${statements.length} statements exitosos`,
        results,
        successCount,
        failureCount
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo ejecutar ningún statement',
        results,
        successCount,
        failureCount
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}




