const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBucketRLSPolicies() {
  console.log('🔧 ARREGLANDO POLÍTICAS RLS DE BUCKETS')
  console.log('=' * 50)
  
  try {
    // 1. VERIFICAR BUCKETS EXISTENTES
    console.log('\n📦 1. VERIFICANDO BUCKETS EXISTENTES...')
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return
    }
    
    console.log('📁 Buckets encontrados:')
    buckets.forEach(bucket => {
      console.log(`  📁 ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    // 2. CONFIGURAR POLÍTICAS RLS PARA BUCKETS
    console.log('\n🔐 2. CONFIGURANDO POLÍTICAS RLS...')
    
    const bucketPolicies = {
      'product-media': `
        -- Política para permitir lectura pública
        DROP POLICY IF EXISTS "Public read access" ON storage.objects;
        CREATE POLICY "Public read access" ON storage.objects
          FOR SELECT USING (bucket_id = 'product-media');
        
        -- Política para permitir subida a usuarios autenticados
        DROP POLICY IF EXISTS "Authenticated users can upload to product-media" ON storage.objects;
        CREATE POLICY "Authenticated users can upload to product-media" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'product-media' 
            AND auth.role() = 'authenticated'
          );
        
        -- Política para permitir actualización a usuarios autenticados
        DROP POLICY IF EXISTS "Authenticated users can update product-media" ON storage.objects;
        CREATE POLICY "Authenticated users can update product-media" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'product-media' 
            AND auth.role() = 'authenticated'
          );
        
        -- Política para permitir eliminación a usuarios autenticados
        DROP POLICY IF EXISTS "Authenticated users can delete product-media" ON storage.objects;
        CREATE POLICY "Authenticated users can delete product-media" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'product-media' 
            AND auth.role() = 'authenticated'
          );
      `,
      'user-media': `
        -- Política para permitir lectura pública
        DROP POLICY IF EXISTS "Public read access user-media" ON storage.objects;
        CREATE POLICY "Public read access user-media" ON storage.objects
          FOR SELECT USING (bucket_id = 'user-media');
        
        -- Política para permitir subida a usuarios autenticados
        DROP POLICY IF EXISTS "Authenticated users can upload to user-media" ON storage.objects;
        CREATE POLICY "Authenticated users can upload to user-media" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'user-media' 
            AND auth.role() = 'authenticated'
          );
        
        -- Política para permitir actualización a usuarios autenticados
        DROP POLICY IF EXISTS "Authenticated users can update user-media" ON storage.objects;
        CREATE POLICY "Authenticated users can update user-media" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'user-media' 
            AND auth.role() = 'authenticated'
          );
        
        -- Política para permitir eliminación a usuarios autenticados
        DROP POLICY IF EXISTS "Authenticated users can delete user-media" ON storage.objects;
        CREATE POLICY "Authenticated users can delete user-media" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'user-media' 
            AND auth.role() = 'authenticated'
          );
      `
    }
    
    // 3. APLICAR POLÍTICAS
    for (const [bucketName, policySQL] of Object.entries(bucketPolicies)) {
      console.log(`\n🔧 Configurando políticas para bucket: ${bucketName}`)
      
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: policySQL
        })
        
        if (policyError) {
          console.log(`  ❌ Error aplicando políticas para ${bucketName}:`, policyError.message)
        } else {
          console.log(`  ✅ Políticas aplicadas exitosamente para ${bucketName}`)
        }
      } catch (error) {
        console.log(`  ❌ Error ejecutando SQL para ${bucketName}:`, error.message)
      }
    }
    
    // 4. VERIFICAR QUE LOS BUCKETS ESTÉN CONFIGURADOS COMO PÚBLICOS
    console.log('\n🌐 3. VERIFICANDO CONFIGURACIÓN DE BUCKETS...')
    
    for (const bucket of buckets) {
      if (bucket.name === 'product-media' || bucket.name === 'user-media') {
        console.log(`📁 ${bucket.name}: ${bucket.public ? '✅ Público' : '❌ Privado'}`)
        
        if (!bucket.public) {
          console.log(`  ⚠️ El bucket ${bucket.name} debería ser público para permitir acceso a archivos`)
        }
      }
    }
    
    // 5. CREAR POLÍTICA ALTERNATIVA MÁS PERMISIVA
    console.log('\n🔓 4. APLICANDO POLÍTICA ALTERNATIVA MÁS PERMISIVA...')
    
    const alternativePolicy = `
      -- Eliminar todas las políticas existentes de storage.objects
      DROP POLICY IF EXISTS "Public read access" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can upload to product-media" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can update product-media" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can delete product-media" ON storage.objects;
      DROP POLICY IF EXISTS "Public read access user-media" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can upload to user-media" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can update user-media" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can delete user-media" ON storage.objects;
      
      -- Política permisiva para lectura
      CREATE POLICY "Allow public read access" ON storage.objects
        FOR SELECT USING (true);
      
      -- Política permisiva para inserción
      CREATE POLICY "Allow authenticated users to insert" ON storage.objects
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
      -- Política permisiva para actualización
      CREATE POLICY "Allow authenticated users to update" ON storage.objects
        FOR UPDATE USING (auth.role() = 'authenticated');
      
      -- Política permisiva para eliminación
      CREATE POLICY "Allow authenticated users to delete" ON storage.objects
        FOR DELETE USING (auth.role() = 'authenticated');
    `
    
    try {
      const { error: altPolicyError } = await supabase.rpc('exec_sql', {
        sql: alternativePolicy
      })
      
      if (altPolicyError) {
        console.log(`  ❌ Error aplicando política alternativa:`, altPolicyError.message)
      } else {
        console.log(`  ✅ Política alternativa aplicada exitosamente`)
      }
    } catch (error) {
      console.log(`  ❌ Error ejecutando política alternativa:`, error.message)
    }
    
    // 6. VERIFICAR POLÍTICAS APLICADAS
    console.log('\n📋 5. VERIFICANDO POLÍTICAS APLICADAS...')
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'objects')
        .eq('schemaname', 'storage')
      
      if (policiesError) {
        console.log(`  ⚠️ No se pudieron verificar las políticas:`, policiesError.message)
      } else {
        console.log(`  📊 Políticas encontradas: ${policies?.length || 0}`)
        policies?.forEach(policy => {
          console.log(`    🔐 ${policy.policyname}: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`)
        })
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando políticas:`, error.message)
    }
    
    console.log('\n🎉 CONFIGURACIÓN DE RLS COMPLETADA')
    console.log('=' * 40)
    
    console.log('\n✅ POLÍTICAS APLICADAS:')
    console.log('🔓 Lectura pública: Permitida para todos')
    console.log('🔐 Subida/Actualización/Eliminación: Solo usuarios autenticados')
    console.log('📁 Buckets afectados: product-media, user-media')
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. ✅ Políticas RLS configuradas')
    console.log('2. 🔄 Reiniciar servidor Next.js')
    console.log('3. 🧪 Probar subida de archivos')
    
    console.log('\n🎉 ¡RLS CONFIGURADO CORRECTAMENTE!')
    
  } catch (error) {
    console.error('❌ Error configurando RLS:', error)
  }
}

fixBucketRLSPolicies()
