/**
 * Script para verificar las vinculaciones entre usuarios de Omnia y MercadoPago
 * 
 * Uso:
 *   node scripts/verificar-vinculaciones-mp.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarVinculaciones() {
  console.log('🔍 Verificando vinculaciones de MercadoPago...\n');

  try {
    // 1. Verificar coaches conectados
    console.log('📊 COACHES CONECTADOS:');
    console.log('─'.repeat(60));
    
    const { data: coaches, error: coachesError } = await supabase
      .from('coach_mercadopago_credentials')
      .select(`
        coach_id,
        mercadopago_user_id,
        oauth_authorized,
        oauth_authorized_at,
        token_expires_at
      `)
      .order('oauth_authorized_at', { ascending: false });

    if (coachesError) {
      console.error('❌ Error al obtener coaches:', coachesError.message);
    } else if (!coaches || coaches.length === 0) {
      console.log('   ⚠️  No hay coaches conectados aún');
    } else {
      for (const coach of coaches) {
        const status = coach.oauth_authorized ? '✅ Conectado' : '❌ No conectado';
        const mpUserId = coach.mercadopago_user_id || 'N/A';
        const fecha = coach.oauth_authorized_at 
          ? new Date(coach.oauth_authorized_at).toLocaleString('es-AR')
          : 'N/A';
        
        console.log(`   ${status}`);
        console.log(`   Coach ID: ${coach.coach_id}`);
        console.log(`   MP User ID: ${mpUserId}`);
        console.log(`   Fecha: ${fecha}`);
        
        if (coach.token_expires_at) {
          const expira = new Date(coach.token_expires_at);
          const ahora = new Date();
          const diasRestantes = Math.ceil((expira - ahora) / (1000 * 60 * 60 * 24));
          if (diasRestantes < 7) {
            console.log(`   ⚠️  Token expira en ${diasRestantes} días`);
          } else {
            console.log(`   ✅ Token válido por ${diasRestantes} días más`);
          }
        }
        console.log('');
      }
    }

    // 2. Estadísticas
    console.log('📈 ESTADÍSTICAS:');
    console.log('─'.repeat(60));
    
    const totalCoaches = coaches?.length || 0;
    const coachesConectados = coaches?.filter(c => c.oauth_authorized).length || 0;
    const coachesNoConectados = totalCoaches - coachesConectados;
    
    console.log(`   Total de coaches en la BD: ${totalCoaches}`);
    console.log(`   ✅ Conectados: ${coachesConectados}`);
    console.log(`   ❌ No conectados: ${coachesNoConectados}`);
    console.log('');

    // 3. Verificar configuración de comisiones
    console.log('💰 CONFIGURACIÓN DE COMISIONES:');
    console.log('─'.repeat(60));
    
    const { data: config, error: configError } = await supabase
      .from('marketplace_commission_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('❌ Error al obtener configuración:', configError.message);
    } else if (!config) {
      console.log('   ⚠️  No hay configuración activa');
    } else {
      console.log(`   Tipo: ${config.commission_type}`);
      console.log(`   Valor: ${config.commission_value}${config.commission_type === 'percentage' ? '%' : ''}`);
      if (config.min_commission) {
        console.log(`   Mínimo: ${config.min_commission}`);
      }
      if (config.max_commission) {
        console.log(`   Máximo: ${config.max_commission}`);
      }
    }
    console.log('');

    // 4. Verificar función de cálculo
    console.log('🔧 FUNCIÓN DE CÁLCULO:');
    console.log('─'.repeat(60));
    
    try {
      const { data: resultado, error: funcionError } = await supabase
        .rpc('calculate_marketplace_commission', { amount: 100 });

      if (funcionError) {
        console.log('   ❌ Error al ejecutar función:', funcionError.message);
      } else {
        console.log(`   ✅ Función funciona correctamente`);
        console.log(`   Comisión para $100: $${resultado}`);
      }
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }
    console.log('');

    // 5. Resumen
    console.log('📋 RESUMEN:');
    console.log('─'.repeat(60));
    
    const todoOk = coachesConectados > 0 && config && !configError;
    
    if (todoOk) {
      console.log('   ✅ Todo está configurado correctamente');
      console.log('   ✅ Hay coaches conectados');
      console.log('   ✅ La configuración de comisiones está activa');
      console.log('   ✅ Listo para recibir pagos');
    } else {
      console.log('   ⚠️  Faltan algunos pasos:');
      if (coachesConectados === 0) {
        console.log('      - No hay coaches conectados a MercadoPago');
        console.log('      - Los coaches deben ir a Profile → Conectar MercadoPago');
      }
      if (!config || configError) {
        console.log('      - No hay configuración de comisiones activa');
        console.log('      - Ejecuta las migraciones SQL');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar
verificarVinculaciones()
  .then(() => {
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });








