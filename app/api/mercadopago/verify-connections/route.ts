import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config/db';

/**
 * Endpoint para verificar las vinculaciones entre usuarios de Omnia y MercadoPago
 * GET /api/mercadopago/verify-connections
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin();

    const results: any = {
      coaches: [],
      estadisticas: {
        total_coaches: 0,
        coaches_conectados: 0,
        coaches_no_conectados: 0
      },
      configuracion: null,
      funcion: null,
      timestamp: new Date().toISOString()
    };

    // 1. Obtener coaches conectados
    const { data: coaches, error: coachesError } = await supabase
      .from('coach_mercadopago_credentials')
      .select(`
        coach_id,
        mercadopago_user_id,
        oauth_authorized,
        oauth_authorized_at,
        token_expires_at,
        created_at,
        updated_at
      `)
      .order('oauth_authorized_at', { ascending: false });

    if (coachesError) {
      console.error('Error obteniendo coaches:', coachesError);
    } else if (coaches) {
      // Obtener información de usuarios
      const coachIds = coaches.map(c => c.coach_id);
      
      if (coachIds.length > 0) {
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', coachIds);

        const profileMap = new Map(
          (userProfiles || []).map(p => [p.id, p])
        );

        // Formatear coaches con información de usuario
        results.coaches = coaches.map((coach: any) => {
          const profile = profileMap.get(coach.coach_id);
          const ahora = new Date();
          const expira = coach.token_expires_at ? new Date(coach.token_expires_at) : null;
          const diasRestantes = expira 
            ? Math.ceil((expira.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return {
            coach_id: coach.coach_id,
            coach_name: profile?.full_name || 'N/A',
            coach_email: profile?.email || 'N/A',
            mercadopago_user_id: coach.mercadopago_user_id || null,
            oauth_authorized: coach.oauth_authorized || false,
            oauth_authorized_at: coach.oauth_authorized_at || null,
            token_expires_at: coach.token_expires_at || null,
            token_valido: diasRestantes !== null && diasRestantes > 0,
            dias_restantes_token: diasRestantes,
            created_at: coach.created_at,
            updated_at: coach.updated_at
          };
        });
      } else {
        results.coaches = [];
      }
    }

    // 2. Calcular estadísticas
    results.estadisticas.total_coaches = results.coaches.length;
    results.estadisticas.coaches_conectados = results.coaches.filter(
      (c: any) => c.oauth_authorized === true
    ).length;
    results.estadisticas.coaches_no_conectados = 
      results.estadisticas.total_coaches - results.estadisticas.coaches_conectados;

    // 3. Verificar configuración de comisiones
    const { data: config, error: configError } = await supabase
      .from('marketplace_commission_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!configError && config) {
      results.configuracion = {
        id: config.id,
        commission_type: config.commission_type,
        commission_value: config.commission_value,
        min_commission: config.min_commission,
        max_commission: config.max_commission,
        is_active: config.is_active,
        description: config.description
      };
    }

    // 4. Verificar función de cálculo
    try {
      const { data: resultado, error: funcionError } = await supabase
        .rpc('calculate_marketplace_commission', { amount: 100 });

      if (!funcionError) {
        results.funcion = {
          existe: true,
          funciona: true,
          ejemplo: {
            monto: 100,
            comision: resultado
          }
        };
      } else {
        results.funcion = {
          existe: true,
          funciona: false,
          error: funcionError.message
        };
      }
    } catch (err: any) {
      results.funcion = {
        existe: false,
        funciona: false,
        error: err.message
      };
    }

    // 5. Resumen general
    results.resumen = {
      todo_ok: 
        results.estadisticas.coaches_conectados > 0 &&
        results.configuracion !== null &&
        results.funcion?.funciona === true,
      mensaje: results.estadisticas.coaches_conectados > 0
        ? `✅ ${results.estadisticas.coaches_conectados} coach(es) conectado(s) a MercadoPago`
        : '⚠️ No hay coaches conectados a MercadoPago aún'
    };

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error: any) {
    console.error('Error verificando conexiones:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}







