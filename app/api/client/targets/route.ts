import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * Endpoint para obtener las metas del cliente basadas en el total de lo comprado
 * Las metas son la suma completa de ejercicios/platos/kcal que compró
 * 
 * @route GET /api/client/targets
 * @query category: 'fitness' | 'nutrition'
 */
export async function GET(request: NextRequest) {
  console.log(' [TARGETS] API endpoint called at:', new Date().toISOString());
  
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log(' [TARGETS] Authentication failed');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryRaw = (searchParams.get('category') || 'fitness').toLowerCase();
    const isNutrition = categoryRaw === 'nutrition' || categoryRaw === 'nutricion' || categoryRaw === 'nutrición';
    const category = isNutrition ? 'nutrition' : 'fitness';

    console.log(' [TARGETS] Debug: user.id:', user.id);
    console.log(' [TARGETS] Debug: category solicitada:', categoryRaw);
    console.log(' [TARGETS] Debug: category normalizada:', category);
    
    const { data: purchasedTotals, error: totalsError } = await supabase
      .rpc('get_purchased_totals', { 
        client_id_param: user.id 
      });

    console.log(' [TARGETS] Debug: totalsError:', totalsError);
    console.log(' [TARGETS] Debug: purchasedTotals:', purchasedTotals);

    if (totalsError) {
      console.error('Error obteniendo totales comprados:', totalsError);
      // Fallback a metas por defecto si hay error
      const defaultTargets = isNutrition 
        ? { kcal: 400, minutes: 0, exercises: 0, plates: 4 }
        : { kcal: 500, minutes: 60, exercises: 3, plates: 0 };
      
      return NextResponse.json({
        success: true,
        targets: defaultTargets,
        source: 'default'
      });
    }

    if (!purchasedTotals || purchasedTotals.length === 0) {
      console.log('🎯 [TARGETS] Debug: Sin compras encontradas - usando default por categoría');
      // Sin compras - usar metas por defecto SEGÚN CATEGORÍA
      const defaultTargets = isNutrition 
        ? { kcal: 400, minutes: 0, exercises: 0, plates: 4 }
        : { kcal: 500, minutes: 60, exercises: 3, plates: 0 };
      
      console.log('🎯 [TARGETS] Debug: defaultTargets para', category, ':', defaultTargets);
      
      return NextResponse.json({
        success: true,
        targets: defaultTargets,
        source: 'default'
      });
    }

    // Obtener metas específicas por categoría
    const categoryTarget = purchasedTotals.find((t: any) => {
      const tType = String(t?.type || '').toLowerCase();
      if (isNutrition) return tType === 'nutrition' || tType === 'nutricion' || tType === 'nutrición';
      return tType === 'fitness';
    });
    
    console.log('🎯 [TARGETS] Debug: purchasedTotals:', purchasedTotals);
    console.log('🎯 [TARGETS] Debug: category solicitada:', category);
    console.log('🎯 [TARGETS] Debug: categoryTarget encontrado:', categoryTarget);
    
    const targets = {
      kcal: categoryTarget?.kcal_target || (isNutrition ? 400 : 500),
      minutes: categoryTarget?.minutes_target || (isNutrition ? 0 : 60),
      exercises: !isNutrition ? (categoryTarget?.items_target || 3) : 0,
      plates: isNutrition ? (categoryTarget?.items_target || 4) : 0
    };
    
    console.log('🎯 [TARGETS] Debug: targets calculados:', targets);

    return NextResponse.json({
      success: true,
      targets,
      source: 'purchased'
    });

  } catch (error: any) {
    console.error('Error en targets endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
