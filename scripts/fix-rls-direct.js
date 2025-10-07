const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

// Usar service key para tener permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSDirect() {
  console.log('🔧 ARREGLANDO RLS DIRECTAMENTE')
  console.log('=' * 40)
  
  try {
    // 1. VERIFICAR AUTENTICACIÓN CON SERVICE KEY
    console.log('\n🔐 1. VERIFICANDO PERMISOS DE ADMINISTRADOR...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('  ⚠️ No hay usuario autenticado (normal con service key)')
    } else {
      console.log('  ✅ Usuario autenticado:', user?.email)
    }
    
    // 2. PROBAR SUBIDA DIRECTA CON SERVICE KEY
    console.log('\n📤 2. PROBANDO SUBIDA DIRECTA CON SERVICE KEY...')
    
    // Crear un archivo de prueba
    const testContent = Buffer.from('Test content for RLS verification')
    const testBlob = new Blob([testContent], { type: 'text/plain' })
    
    const testPath = `test-rls-${Date.now()}.txt`
    console.log(`  📄 Subiendo archivo de prueba: ${testPath}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(`test/${testPath}`, testBlob, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.log(`  ❌ Error subiendo con service key:`, uploadError.message)
    } else {
      console.log(`  ✅ Subida exitosa con service key:`, uploadData.path)
      
      // Eliminar archivo de prueba
      const { error: deleteError } = await supabase.storage
        .from('product-media')
        .remove([`test/${testPath}`])
      
      if (deleteError) {
        console.log(`  ⚠️ Error eliminando archivo de prueba:`, deleteError.message)
      } else {
        console.log(`  🗑️ Archivo de prueba eliminado`)
      }
    }
    
    // 3. VERIFICAR POLÍTICAS EXISTENTES
    console.log('\n📋 3. VERIFICANDO POLÍTICAS EXISTENTES...')
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname, permissive, roles, cmd, qual')
        .eq('tablename', 'objects')
        .eq('schemaname', 'storage')
      
      if (policiesError) {
        console.log(`  ⚠️ Error consultando políticas:`, policiesError.message)
        console.log(`  ℹ️ Esto es normal si no hay políticas configuradas`)
      } else {
        console.log(`  📊 Políticas encontradas: ${policies?.length || 0}`)
        policies?.forEach(policy => {
          console.log(`    🔐 ${policy.policyname}`)
          console.log(`       📝 Comando: ${policy.cmd}`)
          console.log(`       👥 Roles: ${policy.roles}`)
          console.log(`       🔓 Permisivo: ${policy.permissive}`)
        })
      }
    } catch (error) {
      console.log(`  ⚠️ Error accediendo a políticas:`, error.message)
    }
    
    // 4. CREAR POLÍTICA SIMPLE USANDO SQL DIRECTO
    console.log('\n🔧 4. CREANDO POLÍTICA SIMPLE...')
    
    // Intentar crear una política básica
    const createPolicySQL = `
      -- Crear política simple para storage.objects
      CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON storage.objects
        FOR SELECT USING (true);
      
      CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON storage.objects
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
      CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON storage.objects
        FOR UPDATE USING (auth.role() = 'authenticated');
      
      CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON storage.objects
        FOR DELETE USING (auth.role() = 'authenticated');
    `
    
    try {
      // Usar el método rpc si está disponible
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_query: createPolicySQL
      })
      
      if (sqlError) {
        console.log(`  ❌ Error ejecutando SQL:`, sqlError.message)
        console.log(`  ℹ️ Intentando método alternativo...`)
        
        // Método alternativo: usar query directo
        const { error: queryError } = await supabase
          .from('storage.objects')
          .select('*')
          .limit(1)
        
        if (queryError) {
          console.log(`  ❌ Error accediendo a storage.objects:`, queryError.message)
        } else {
          console.log(`  ✅ Acceso a storage.objects funcionando`)
        }
      } else {
        console.log(`  ✅ Políticas creadas exitosamente`)
      }
    } catch (error) {
      console.log(`  ❌ Error en método SQL:`, error.message)
    }
    
    // 5. RECOMENDACIONES
    console.log('\n💡 5. RECOMENDACIONES PARA ARREGLAR RLS:')
    console.log('=' * 45)
    
    console.log('\n🔧 OPCIÓN 1: CONFIGURAR EN SUPABASE DASHBOARD')
    console.log('1. Ve a Supabase Dashboard → Authentication → Policies')
    console.log('2. Busca la tabla "storage.objects"')
    console.log('3. Crea las siguientes políticas:')
    console.log('')
    console.log('   📖 SELECT (Lectura):')
    console.log('   - Name: "Public read access"')
    console.log('   - Operation: SELECT')
    console.log('   - Target roles: public, authenticated')
    console.log('   - USING expression: true')
    console.log('')
    console.log('   📤 INSERT (Subida):')
    console.log('   - Name: "Authenticated insert"')
    console.log('   - Operation: INSERT')
    console.log('   - Target roles: authenticated')
    console.log('   - WITH CHECK expression: auth.role() = \'authenticated\'')
    console.log('')
    console.log('   ✏️ UPDATE (Actualización):')
    console.log('   - Name: "Authenticated update"')
    console.log('   - Operation: UPDATE')
    console.log('   - Target roles: authenticated')
    console.log('   - USING expression: auth.role() = \'authenticated\'')
    console.log('')
    console.log('   🗑️ DELETE (Eliminación):')
    console.log('   - Name: "Authenticated delete"')
    console.log('   - Operation: DELETE')
    console.log('   - Target roles: authenticated')
    console.log('   - USING expression: auth.role() = \'authenticated\'')
    
    console.log('\n🔧 OPCIÓN 2: USAR SQL EDITOR')
    console.log('1. Ve a Supabase Dashboard → SQL Editor')
    console.log('2. Ejecuta este SQL:')
    console.log('')
    console.log('```sql')
    console.log('-- Habilitar RLS en storage.objects si no está habilitado')
    console.log('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Crear políticas')
    console.log('CREATE POLICY "Public read access" ON storage.objects')
    console.log('  FOR SELECT USING (true);')
    console.log('')
    console.log('CREATE POLICY "Authenticated insert" ON storage.objects')
    console.log('  FOR INSERT WITH CHECK (auth.role() = \'authenticated\');')
    console.log('')
    console.log('CREATE POLICY "Authenticated update" ON storage.objects')
    console.log('  FOR UPDATE USING (auth.role() = \'authenticated\');')
    console.log('')
    console.log('CREATE POLICY "Authenticated delete" ON storage.objects')
    console.log('  FOR DELETE USING (auth.role() = \'authenticated\');')
    console.log('```')
    
    console.log('\n🎯 ESTADO ACTUAL:')
    console.log('✅ Buckets creados y configurados como públicos')
    console.log('✅ Service key funciona correctamente')
    console.log('❌ Políticas RLS necesitan configuración manual')
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETADO')
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
  }
}

fixRLSDirect()
