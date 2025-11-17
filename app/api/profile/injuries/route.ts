import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';

/**
 * GET /api/profile/injuries
 * Obtiene las lesiones del usuario autenticado
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

    // Consultar lesiones del usuario
    const { data: injuries, error } = await supabase
      .from('user_injuries')
      .select('id, name, description, severity, restrictions, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe, devolver array vacío
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          injuries: []
        });
      }
      
      console.error('Error consultando lesiones:', error);
      return NextResponse.json(
        { 
          error: 'Error al consultar lesiones',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      injuries: injuries || []
    });

  } catch (error: any) {
    console.error('Error en GET /api/profile/injuries:', error);
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
 * POST /api/profile/injuries
 * Crea una nueva lesión
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
    const { name, description, severity, restrictions } = body;

    if (!name || !severity) {
      return NextResponse.json(
        { error: 'name y severity son requeridos' },
        { status: 400 }
      );
    }

    // Validar severity
    if (!['low', 'medium', 'high'].includes(severity)) {
      return NextResponse.json(
        { error: 'severity debe ser: low, medium o high' },
        { status: 400 }
      );
    }

    // Crear nueva lesión
    const { data: created, error: insertError } = await supabase
      .from('user_injuries')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        severity,
        restrictions: restrictions || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando lesión:', insertError);
      return NextResponse.json(
        { error: 'Error al crear lesión', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      injury: created
    });

  } catch (error: any) {
    console.error('Error en POST /api/profile/injuries:', error);
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
 * PUT /api/profile/injuries
 * Actualiza una lesión existente
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
    const { id, name, description, severity, restrictions } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la lesión pertenece al usuario
    const { data: existing, error: checkError } = await supabase
      .from('user_injuries')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Lesión no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Validar severity si se proporciona
    if (severity && !['low', 'medium', 'high'].includes(severity)) {
      return NextResponse.json(
        { error: 'severity debe ser: low, medium o high' },
        { status: 400 }
      );
    }

    // Actualizar lesión
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (severity !== undefined) updateData.severity = severity;
    if (restrictions !== undefined) updateData.restrictions = restrictions;

    const { data: updated, error: updateError } = await supabase
      .from('user_injuries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando lesión:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar lesión', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      injury: updated
    });

  } catch (error: any) {
    console.error('Error en PUT /api/profile/injuries:', error);
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
 * DELETE /api/profile/injuries
 * Elimina una lesión
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

    // Verificar que la lesión pertenece al usuario y eliminarla
    const { error: deleteError } = await supabase
      .from('user_injuries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error eliminando lesión:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar lesión', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/profile/injuries:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

