import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * GET /api/profile/biometrics
 * Obtiene las mediciones biométricas del usuario autenticado
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

    // Consultar biométricas del usuario
    const { data: biometrics, error } = await supabase
      .from('user_biometrics')
      .select('id, name, value, unit, notes, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe, devolver array vacío
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          biometrics: []
        });
      }
      
      console.error('Error consultando biométricas:', error);
      return NextResponse.json(
        { 
          error: 'Error al consultar biométricas',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      biometrics: biometrics || []
    });

  } catch (error: any) {
    console.error('Error en GET /api/profile/biometrics:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/biometrics
 * Crea una nueva medición biométrica
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, value, unit, notes } = body;

    if (!name || value === undefined || !unit) {
      return NextResponse.json(
        { error: 'name, value y unit son requeridos' },
        { status: 400 }
      );
    }

    // Crear nueva medición biométrica
    const { data: created, error: insertError } = await supabase
      .from('user_biometrics')
      .insert({
        user_id: user.id,
        name,
        value: parseFloat(value.toString()),
        unit,
        notes: notes || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando biométrica:', insertError);
      return NextResponse.json(
        { error: 'Error al crear biométrica', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      biometric: created
    });

  } catch (error: any) {
    console.error('Error en POST /api/profile/biometrics:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/biometrics
 * Actualiza una medición biométrica existente
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, name, value, unit, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la biométrica pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('user_biometrics')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Biométrica no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Actualizar biométrica
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = parseFloat(value.toString());
    if (unit !== undefined) updateData.unit = unit;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updated, error: updateError } = await supabase
      .from('user_biometrics')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando biométrica:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar biométrica', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      biometric: updated
    });

  } catch (error: any) {
    console.error('Error en PUT /api/profile/biometrics:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/biometrics
 * Elimina una medición biométrica
 */
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la biométrica pertenece al usuario y eliminarla
    const { error: deleteError } = await supabase
      .from('user_biometrics')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error eliminando biométrica:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar biométrica', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/profile/biometrics:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

