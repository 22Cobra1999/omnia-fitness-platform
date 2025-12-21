#!/usr/bin/env tsx
/**
 * Script para corregir status de enrollments según la lógica definida
 * 
 * Ejecutar: npx tsx scripts/corregir-status-enrollments.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function ejecutarUpdate(sql: string, descripcion: string) {
  console.log(`\n📝 ${descripcion}...`)
  
  try {
    // Dividir en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.length < 10) continue

      try {
        // Intentar usar RPC execute_sql si existe
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        })

        if (error) {
          if (error.message.includes('function') || error.message.includes('does not exist')) {
            console.log(`   ⚠️  Función execute_sql no disponible`)
            console.log(`   💡 Ejecuta el SQL manualmente en Supabase Dashboard`)
            console.log(`   SQL: ${statement.substring(0, 100)}...`)
            return false
          } else {
            console.log(`   ⚠️  [${i + 1}] ${error.message.substring(0, 80)}`)
          }
        } else {
          console.log(`   ✅ [${i + 1}] Completado`)
        }
      } catch (e: any) {
        console.log(`   ⚠️  [${i + 1}] ${e.message.substring(0, 80)}`)
      }
    }
    
    return true
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function verificarStatus() {
  console.log('\n🔍 Verificando status de enrollments...\n')
  
  const { data, error } = await supabase
    .from('activity_enrollments')
    .select('id, activity_id, status, expiration_date, start_date, program_end_date, created_at')
    .in('id', [145, 168, 181, 191, 203])
    .order('id')

  if (error) {
    console.error('❌ Error obteniendo enrollments:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No se encontraron enrollments')
    return
  }

  console.log('📊 Status actual de cada enrollment:\n')
  console.log('ID  | Activity | Status Actual | Status Correcto | Estado')
  console.log('----|----------|---------------|-----------------|----------')

  for (const enrollment of data) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let statusCorrecto = 'pendiente'
    const expirationDate = enrollment.expiration_date ? new Date(enrollment.expiration_date) : null
    const programEndDate = enrollment.program_end_date ? new Date(enrollment.program_end_date) : null
    const hasStarted = enrollment.start_date !== null

    // Calcular status correcto
    if (expirationDate && !hasStarted && expirationDate < today) {
      statusCorrecto = 'expirada'
    } else if (programEndDate && hasStarted && programEndDate < today) {
      statusCorrecto = 'finalizada'
    } else if (hasStarted && (!programEndDate || programEndDate >= today)) {
      statusCorrecto = 'activa'
    } else {
      statusCorrecto = 'pendiente'
    }

    const estado = enrollment.status === statusCorrecto ? '✅' : '❌'
    
    console.log(
      `${enrollment.id.toString().padEnd(3)} | ${enrollment.activity_id.toString().padEnd(8)} | ${enrollment.status.padEnd(13)} | ${statusCorrecto.padEnd(15)} | ${estado}`
    )
  }
}

async function main() {
  console.log('🚀 Corrigiendo status de enrollments...\n')

  // Paso 1: Popular expiration_date
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET expiration_date = (created_at::date + INTERVAL '10 days')::date
     WHERE expiration_date IS NULL`,
    'Paso 1: Popular expiration_date'
  )

  // Paso 2: Popular program_end_date para fitness
  await ejecutarUpdate(
    `UPDATE activity_enrollments ae
     SET program_end_date = (
       SELECT (MAX(pc.fecha) + INTERVAL '6 days')::date
       FROM progreso_cliente pc
       WHERE pc.actividad_id = ae.activity_id
         AND pc.cliente_id = ae.client_id
     )
     WHERE ae.start_date IS NOT NULL
       AND ae.program_end_date IS NULL
       AND EXISTS (
         SELECT 1 
         FROM progreso_cliente pc
         WHERE pc.actividad_id = ae.activity_id
           AND pc.cliente_id = ae.client_id
       )`,
    'Paso 2: Popular program_end_date (fitness)'
  )

  // Paso 3: Popular program_end_date para nutrición
  await ejecutarUpdate(
    `UPDATE activity_enrollments ae
     SET program_end_date = (
       SELECT (MAX(pcn.fecha) + INTERVAL '6 days')::date
       FROM progreso_cliente_nutricion pcn
       WHERE pcn.actividad_id = ae.activity_id
         AND pcn.cliente_id = ae.client_id
     )
     WHERE ae.start_date IS NOT NULL
       AND ae.program_end_date IS NULL
       AND EXISTS (
         SELECT 1 
         FROM progreso_cliente_nutricion pcn
         WHERE pcn.actividad_id = ae.activity_id
           AND pcn.cliente_id = ae.client_id
       )
       AND NOT EXISTS (
         SELECT 1 
         FROM progreso_cliente pc
         WHERE pc.actividad_id = ae.activity_id
           AND pc.cliente_id = ae.client_id
       )`,
    'Paso 3: Popular program_end_date (nutrición)'
  )

  // Paso 4: Corregir status - expirada
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'expirada', updated_at = NOW()
     WHERE expiration_date IS NOT NULL
       AND expiration_date < CURRENT_DATE
       AND start_date IS NULL
       AND status != 'expirada'`,
    'Paso 4: Corregir status a "expirada"'
  )

  // Paso 5: Corregir status - finalizada
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'finalizada', updated_at = NOW()
     WHERE program_end_date IS NOT NULL
       AND program_end_date < CURRENT_DATE
       AND status != 'finalizada'`,
    'Paso 5: Corregir status a "finalizada"'
  )

  // Paso 6: Corregir status - activa
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'activa', updated_at = NOW()
     WHERE start_date IS NOT NULL
       AND (program_end_date IS NULL OR program_end_date >= CURRENT_DATE)
       AND status != 'activa'
       AND status != 'finalizada'
       AND status != 'expirada'`,
    'Paso 6: Corregir status a "activa"'
  )

  // Paso 7: Corregir status - pendiente
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'pendiente', updated_at = NOW()
     WHERE start_date IS NULL
       AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
       AND status != 'pendiente'
       AND status != 'expirada'`,
    'Paso 7: Corregir status a "pendiente"'
  )

  // Verificación final
  await verificarStatus()

  console.log('\n✅ Proceso completado!\n')
}

main().catch(console.error)

/**
 * Script para corregir status de enrollments según la lógica definida
 * 
 * Ejecutar: npx tsx scripts/corregir-status-enrollments.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function ejecutarUpdate(sql: string, descripcion: string) {
  console.log(`\n📝 ${descripcion}...`)
  
  try {
    // Dividir en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.length < 10) continue

      try {
        // Intentar usar RPC execute_sql si existe
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        })

        if (error) {
          if (error.message.includes('function') || error.message.includes('does not exist')) {
            console.log(`   ⚠️  Función execute_sql no disponible`)
            console.log(`   💡 Ejecuta el SQL manualmente en Supabase Dashboard`)
            console.log(`   SQL: ${statement.substring(0, 100)}...`)
            return false
          } else {
            console.log(`   ⚠️  [${i + 1}] ${error.message.substring(0, 80)}`)
          }
        } else {
          console.log(`   ✅ [${i + 1}] Completado`)
        }
      } catch (e: any) {
        console.log(`   ⚠️  [${i + 1}] ${e.message.substring(0, 80)}`)
      }
    }
    
    return true
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function verificarStatus() {
  console.log('\n🔍 Verificando status de enrollments...\n')
  
  const { data, error } = await supabase
    .from('activity_enrollments')
    .select('id, activity_id, status, expiration_date, start_date, program_end_date, created_at')
    .in('id', [145, 168, 181, 191, 203])
    .order('id')

  if (error) {
    console.error('❌ Error obteniendo enrollments:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No se encontraron enrollments')
    return
  }

  console.log('📊 Status actual de cada enrollment:\n')
  console.log('ID  | Activity | Status Actual | Status Correcto | Estado')
  console.log('----|----------|---------------|-----------------|----------')

  for (const enrollment of data) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let statusCorrecto = 'pendiente'
    const expirationDate = enrollment.expiration_date ? new Date(enrollment.expiration_date) : null
    const programEndDate = enrollment.program_end_date ? new Date(enrollment.program_end_date) : null
    const hasStarted = enrollment.start_date !== null

    // Calcular status correcto
    if (expirationDate && !hasStarted && expirationDate < today) {
      statusCorrecto = 'expirada'
    } else if (programEndDate && hasStarted && programEndDate < today) {
      statusCorrecto = 'finalizada'
    } else if (hasStarted && (!programEndDate || programEndDate >= today)) {
      statusCorrecto = 'activa'
    } else {
      statusCorrecto = 'pendiente'
    }

    const estado = enrollment.status === statusCorrecto ? '✅' : '❌'
    
    console.log(
      `${enrollment.id.toString().padEnd(3)} | ${enrollment.activity_id.toString().padEnd(8)} | ${enrollment.status.padEnd(13)} | ${statusCorrecto.padEnd(15)} | ${estado}`
    )
  }
}

async function main() {
  console.log('🚀 Corrigiendo status de enrollments...\n')

  // Paso 1: Popular expiration_date
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET expiration_date = (created_at::date + INTERVAL '10 days')::date
     WHERE expiration_date IS NULL`,
    'Paso 1: Popular expiration_date'
  )

  // Paso 2: Popular program_end_date para fitness
  await ejecutarUpdate(
    `UPDATE activity_enrollments ae
     SET program_end_date = (
       SELECT (MAX(pc.fecha) + INTERVAL '6 days')::date
       FROM progreso_cliente pc
       WHERE pc.actividad_id = ae.activity_id
         AND pc.cliente_id = ae.client_id
     )
     WHERE ae.start_date IS NOT NULL
       AND ae.program_end_date IS NULL
       AND EXISTS (
         SELECT 1 
         FROM progreso_cliente pc
         WHERE pc.actividad_id = ae.activity_id
           AND pc.cliente_id = ae.client_id
       )`,
    'Paso 2: Popular program_end_date (fitness)'
  )

  // Paso 3: Popular program_end_date para nutrición
  await ejecutarUpdate(
    `UPDATE activity_enrollments ae
     SET program_end_date = (
       SELECT (MAX(pcn.fecha) + INTERVAL '6 days')::date
       FROM progreso_cliente_nutricion pcn
       WHERE pcn.actividad_id = ae.activity_id
         AND pcn.cliente_id = ae.client_id
     )
     WHERE ae.start_date IS NOT NULL
       AND ae.program_end_date IS NULL
       AND EXISTS (
         SELECT 1 
         FROM progreso_cliente_nutricion pcn
         WHERE pcn.actividad_id = ae.activity_id
           AND pcn.cliente_id = ae.client_id
       )
       AND NOT EXISTS (
         SELECT 1 
         FROM progreso_cliente pc
         WHERE pc.actividad_id = ae.activity_id
           AND pc.cliente_id = ae.client_id
       )`,
    'Paso 3: Popular program_end_date (nutrición)'
  )

  // Paso 4: Corregir status - expirada
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'expirada', updated_at = NOW()
     WHERE expiration_date IS NOT NULL
       AND expiration_date < CURRENT_DATE
       AND start_date IS NULL
       AND status != 'expirada'`,
    'Paso 4: Corregir status a "expirada"'
  )

  // Paso 5: Corregir status - finalizada
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'finalizada', updated_at = NOW()
     WHERE program_end_date IS NOT NULL
       AND program_end_date < CURRENT_DATE
       AND status != 'finalizada'`,
    'Paso 5: Corregir status a "finalizada"'
  )

  // Paso 6: Corregir status - activa
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'activa', updated_at = NOW()
     WHERE start_date IS NOT NULL
       AND (program_end_date IS NULL OR program_end_date >= CURRENT_DATE)
       AND status != 'activa'
       AND status != 'finalizada'
       AND status != 'expirada'`,
    'Paso 6: Corregir status a "activa"'
  )

  // Paso 7: Corregir status - pendiente
  await ejecutarUpdate(
    `UPDATE activity_enrollments
     SET status = 'pendiente', updated_at = NOW()
     WHERE start_date IS NULL
       AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
       AND status != 'pendiente'
       AND status != 'expirada'`,
    'Paso 7: Corregir status a "pendiente"'
  )

  // Verificación final
  await verificarStatus()

  console.log('\n✅ Proceso completado!\n')
}

main().catch(console.error)

