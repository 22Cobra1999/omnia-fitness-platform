import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/client/progress-summary
 * Obtiene el resumen de progreso del cliente usando la query SQL
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id') || user.id;
    const categoria = searchParams.get('categoria'); // 'fitness' o 'nutricion' o null para todos

    // Leer la query SQL
    const queryPath = join(process.cwd(), 'db', 'queries', 'client-progress-summary.sql');
    const query = readFileSync(queryPath, 'utf-8');

    // Ejecutar la query usando RPC o directamente
    // Como Supabase no permite ejecutar queries SQL arbitrarias desde el cliente,
    // vamos a replicar la lógica en TypeScript
    
    // Obtener datos de fitness
    const { data: fitnessData, error: fitnessError } = await supabase
      .from('progreso_cliente')
      .select('id, fecha, actividad_id, ejercicios_completados, minutos_json, calorias_json')
      .eq('cliente_id', clienteId);

    if (fitnessError) {
      console.error('Error obteniendo datos fitness:', fitnessError);
    }

    // Obtener datos de nutrición
    const { data: nutritionData, error: nutritionError } = await supabase
      .from('progreso_cliente_nutricion')
      .select('id, fecha, actividad_id, ejercicios_completados, macros')
      .eq('cliente_id', clienteId);

    if (nutritionError) {
      console.error('Error obteniendo datos nutrición:', nutritionError);
    }

    // Procesar datos de fitness
    const fitnessResults = (fitnessData || []).map(record => {
      // Calcular ejercicios
      let ejercicios = 0;
      if (record.ejercicios_completados) {
        if (Array.isArray(record.ejercicios_completados)) {
          ejercicios = record.ejercicios_completados.length;
        } else if (typeof record.ejercicios_completados === 'object') {
          ejercicios = Object.keys(record.ejercicios_completados).length;
        }
      }

      // Calcular minutos
      let minutos = 0;
      if (record.minutos_json) {
        const minutosObj = typeof record.minutos_json === 'string' 
          ? JSON.parse(record.minutos_json) 
          : record.minutos_json;
        Object.values(minutosObj).forEach((min: any) => {
          minutos += Number(min) || 0;
        });
      }

      // Calcular calorías
      let calorias = 0;
      if (record.calorias_json) {
        const caloriasObj = typeof record.calorias_json === 'string'
          ? JSON.parse(record.calorias_json)
          : record.calorias_json;
        Object.values(caloriasObj).forEach((cal: any) => {
          calorias += Number(cal) || 0;
        });
      }

      return {
        cliente_id: record.cliente_id || clienteId,
        fecha: record.fecha,
        tipo: 'fitness' as const,
        ejercicios,
        minutos: minutos.toString(),
        calorias: calorias.toString(),
        platos: 0,
        completado: ejercicios > 0
      };
    });

    // Procesar datos de nutrición
    const nutritionResults = (nutritionData || []).map(record => {
      // Calcular platos
      let platos = 0;
      if (record.ejercicios_completados) {
        if (Array.isArray(record.ejercicios_completados)) {
          platos = record.ejercicios_completados.length;
        } else if (typeof record.ejercicios_completados === 'object') {
          platos = Object.keys(record.ejercicios_completados).length;
        }
      }

      // Calcular calorías desde macros
      let calorias = 0;
      if (record.macros) {
        const macrosObj = typeof record.macros === 'string'
          ? JSON.parse(record.macros)
          : record.macros;
        Object.values(macrosObj).forEach((macro: any) => {
          if (typeof macro === 'object' && macro !== null) {
            const proteinas = Number(macro.proteinas || macro.proteina || 0) || 0;
            const carbohidratos = Number(macro.carbohidratos || macro.carbs || 0) || 0;
            const grasas = Number(macro.grasas || macro.grasa || 0) || 0;
            calorias += (proteinas * 4) + (carbohidratos * 4) + (grasas * 9);
          }
        });
      }

      return {
        cliente_id: record.cliente_id || clienteId,
        fecha: record.fecha,
        tipo: 'nutricion' as const,
        ejercicios: 0,
        minutos: '0',
        calorias: calorias.toString(),
        platos,
        completado: platos > 0
      };
    });

    // Combinar resultados
    let allResults = [...fitnessResults, ...nutritionResults];

    // Filtrar por categoría si se especifica
    if (categoria) {
      allResults = allResults.filter(r => r.tipo === categoria);
    }

    // Ordenar por fecha y tipo
    allResults.sort((a, b) => {
      if (a.fecha !== b.fecha) {
        return a.fecha.localeCompare(b.fecha);
      }
      return a.tipo.localeCompare(b.tipo);
    });

    return NextResponse.json({
      success: true,
      data: allResults
    });

  } catch (error: any) {
    console.error('Error en progress-summary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

