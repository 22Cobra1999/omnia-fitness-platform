import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🔍 VERIFICANDO Y CREANDO TABLA ACTIVITY_ENROLLMENTS...')
    
    // 1. Intentar obtener datos de la tabla para ver si existe
    console.log('\n1️⃣ VERIFICANDO EXISTENCIA DE LA TABLA...')
    let tableExists = false
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('activity_enrollments')
        .select('*')
        .limit(1)
      
      if (!testError) {
        tableExists = true
        console.log('✅ Tabla activity_enrollments existe')
      } else {
        console.log('❌ Tabla activity_enrollments NO existe:', testError.message)
      }
    } catch (e) {
      console.log('❌ Error verificando tabla:', e)
    }
    
    // 2. Si no existe, intentar crearla
    if (!tableExists) {
      console.log('\n2️⃣ CREANDO TABLA ACTIVITY_ENROLLMENTS...')
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS activity_enrollments (
          id SERIAL PRIMARY KEY,
          activity_id INTEGER NOT NULL,
          client_id UUID NOT NULL,
          status TEXT NOT NULL DEFAULT 'activa',
          progress INTEGER DEFAULT 0,
          amount_paid DECIMAL(10,2) DEFAULT 0,
          payment_method TEXT,
          payment_date TIMESTAMP,
          start_date DATE,
          expiration_date DATE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT fk_activity FOREIGN KEY (activity_id) REFERENCES activities(id),
          CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id)
        );
      `
      
      console.log('📋 SQL para crear tabla:', createTableSQL)
      
      try {
        // Intentar crear la tabla usando rpc
        const { data: createResult, error: createError } = await supabase
          .rpc('exec_sql', { sql: createTableSQL })
        
        if (createError) {
          console.log('⚠️ Error con exec_sql:', createError)
          
          // Intentar con execute_sql
          const { data: createResult2, error: createError2 } = await supabase
            .rpc('execute_sql', { sql: createTableSQL })
          
          if (createError2) {
            console.log('⚠️ Error con execute_sql:', createError2)
          } else {
            console.log('✅ Tabla creada con execute_sql:', createResult2)
            tableExists = true
          }
        } else {
          console.log('✅ Tabla creada con exec_sql:', createResult)
          tableExists = true
        }
      } catch (e) {
        console.log('❌ Error creando tabla:', e)
      }
    }
    
    // 3. Probar inserción después de crear la tabla
    if (tableExists) {
      console.log('\n3️⃣ PROBANDO INSERCIÓN DESPUÉS DE CREAR TABLA...')
      
      const testData = {
        activity_id: 78,
        client_id: '00dedc23-0b17-4e50-b84e-b2e8100dc93c',
        status: 'activa'
      }
      
      console.log('📋 Datos de prueba:', testData)
      
      try {
        const { data: insertResult, error: insertError } = await supabase
          .from('activity_enrollments')
          .insert([testData])
          .select()
        
        if (insertError) {
          console.log('❌ Error en inserción:', insertError)
          return NextResponse.json({ 
            success: false, 
            error: 'Error en inserción',
            details: insertError,
            tableExists: tableExists
          })
        } else {
          console.log('✅ Inserción exitosa:', insertResult)
          return NextResponse.json({ 
            success: true, 
            message: 'Tabla creada e inserción exitosa',
            insertResult: insertResult,
            tableExists: tableExists
          })
        }
      } catch (e) {
        console.log('❌ Error en inserción:', e)
        return NextResponse.json({ 
          success: false, 
          error: 'Error en inserción',
          details: e,
          tableExists: tableExists
        })
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo crear la tabla',
        tableExists: tableExists
      })
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





