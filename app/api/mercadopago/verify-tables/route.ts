import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config/db';

/**
 * Endpoint para verificar que todas las tablas y campos de MercadoPago estén creados
 * GET /api/mercadopago/verify-tables
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin();

    const results: any = {
      tablas: [],
      campos_banco: [],
      campos_coach_credentials: [],
      campos_commission_config: [],
      indices: [],
      funciones: [],
      datos: null,
      rls: [],
      resumen: {
        tablas_ok: false,
        campos_banco_ok: false,
        campos_coach_ok: false,
        todo_ok: false
      }
    };

    // 1. Verificar tablas (intentando hacer SELECT en cada una)
    const tablasEsperadas = [
      'coach_mercadopago_credentials',
      'client_mercadopago_credentials',
      'marketplace_commission_config',
      'banco'
    ];

    for (const tabla of tablasEsperadas) {
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .limit(0);
      
      results.tablas.push({
        nombre: tabla,
        existe: !error,
        error: error?.message || null,
        descripcion: tabla === 'coach_mercadopago_credentials' ? 'Credenciales de coaches' :
                     tabla === 'client_mercadopago_credentials' ? 'Credenciales de clientes (aún no creada)' :
                     tabla === 'marketplace_commission_config' ? 'Configuración de comisiones' :
                     'Tabla banco'
      });
    }

    // 2. Verificar campos en banco (usando una query directa)
    const camposBancoEsperados = [
      'marketplace_fee',
      'seller_amount',
      'coach_mercadopago_user_id',
      'coach_access_token_encrypted',
      'mercadopago_payment_id',
      'mercadopago_preference_id',
      'mercadopago_status'
    ];

    // Verificar campos en banco (intentando hacer SELECT con cada campo)
    for (const campo of camposBancoEsperados) {
      try {
        const { error } = await supabase
          .from('banco')
          .select(campo)
          .limit(0);
        
        // Si el error menciona que la columna no existe, el campo no existe
        const existe = !error || (!error.message?.includes('column') && !error.message?.includes('does not exist'));
        
        results.campos_banco.push({
          campo: campo,
          existe: existe,
          error: existe ? null : (error?.message || 'Campo no encontrado'),
          critico: ['marketplace_fee', 'seller_amount', 'mercadopago_payment_id', 'mercadopago_status'].includes(campo)
        });
      } catch (err: any) {
        results.campos_banco.push({
          campo: campo,
          existe: false,
          error: err.message || 'Error al verificar campo',
          critico: ['marketplace_fee', 'seller_amount', 'mercadopago_payment_id', 'mercadopago_status'].includes(campo)
        });
      }
    }

    // 3. Verificar campos en coach_mercadopago_credentials
    const camposCoachEsperados = [
      'coach_id',
      'mercadopago_user_id',
      'access_token_encrypted',
      'refresh_token_encrypted',
      'oauth_authorized',
      'token_expires_at'
    ];

    for (const campo of camposCoachEsperados) {
      try {
        const { error } = await supabase
          .from('coach_mercadopago_credentials')
          .select(campo)
          .limit(0);
        
        const existe = !error || (!error.message?.includes('column') && !error.message?.includes('does not exist'));
        
        results.campos_coach_credentials.push({
          campo: campo,
          existe: existe,
          error: existe ? null : (error?.message || 'Campo no encontrado'),
          critico: ['coach_id', 'mercadopago_user_id', 'access_token_encrypted', 'oauth_authorized'].includes(campo)
        });
      } catch (err: any) {
        results.campos_coach_credentials.push({
          campo: campo,
          existe: false,
          error: err.message || 'Error al verificar campo',
          critico: ['coach_id', 'mercadopago_user_id', 'access_token_encrypted', 'oauth_authorized'].includes(campo)
        });
      }
    }

    // 4. Verificar campos en marketplace_commission_config
    const camposConfigEsperados = [
      'commission_type',
      'commission_value',
      'min_commission',
      'max_commission',
      'is_active'
    ];

    for (const campo of camposConfigEsperados) {
      try {
        const { error } = await supabase
          .from('marketplace_commission_config')
          .select(campo)
          .limit(0);
        
        const existe = !error || (!error.message?.includes('column') && !error.message?.includes('does not exist'));
        
        results.campos_commission_config.push({
          campo: campo,
          existe: existe,
          error: existe ? null : (error?.message || 'Campo no encontrado')
        });
      } catch (err: any) {
        results.campos_commission_config.push({
          campo: campo,
          existe: false,
          error: err.message || 'Error al verificar campo'
        });
      }
    }

    // 5. Verificar función
    try {
      const { data: funcionData, error: funcionError } = await supabase
        .rpc('calculate_marketplace_commission', { amount: 100 });
      
      results.funciones.push({
        nombre: 'calculate_marketplace_commission',
        existe: !funcionError,
        error: funcionError?.message || null
      });
    } catch (err: any) {
      results.funciones.push({
        nombre: 'calculate_marketplace_commission',
        existe: false,
        error: err.message
      });
    }

    // 6. Verificar datos de configuración
    try {
      const { data: configData, error: configError } = await supabase
        .from('marketplace_commission_config')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      results.datos = {
        tiene_configuracion: !configError && configData && configData.length > 0,
        configuracion: configData && configData.length > 0 ? configData[0] : null,
        error: configError?.message || null
      };
    } catch (err: any) {
      results.datos = {
        tiene_configuracion: false,
        configuracion: null,
        error: err.message
      };
    }

    // 7. Calcular resumen
    results.resumen.tablas_ok = results.tablas.filter((t: any) => 
      t.nombre !== 'client_mercadopago_credentials' && t.existe
    ).length >= 3; // banco, coach_mercadopago_credentials, marketplace_commission_config

    results.resumen.campos_banco_ok = results.campos_banco.filter((c: any) => 
      c.critico && c.existe
    ).length === 4; // Los 4 campos críticos

    results.resumen.campos_coach_ok = results.campos_coach_credentials.filter((c: any) => 
      c.critico && c.existe
    ).length === 4; // Los 4 campos críticos

    results.resumen.todo_ok = 
      results.resumen.tablas_ok && 
      results.resumen.campos_banco_ok && 
      results.resumen.campos_coach_ok &&
      results.funciones[0]?.existe &&
      results.datos?.tiene_configuracion;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error: any) {
    console.error('Error verificando tablas de MercadoPago:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

