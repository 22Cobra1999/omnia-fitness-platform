import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase/supabase-server';

/**
 * GET /api/profile/exercise-progress
 * Obtiene el progreso de ejercicios del usuario autenticado
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

    // Check for userId query param (for Coach viewing Client)
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const queryUserId = targetUserId || user.id;

    // If viewing another user, use admin client to bypass RLS
    const dbClient = targetUserId ? createServiceRoleClient() : supabase;

    // Consultar objetivos de ejercicios del usuario desde user_exercise_objectives
    const { data: objectives, error: objectivesError } = await dbClient
      .from('user_exercise_objectives')
      .select('id, exercise_title, unit, current_value, objective, created_at, updated_at')
      .eq('user_id', queryUserId)
      .order('created_at', { ascending: false });

    // Si hay error con user_exercise_objectives, intentar con user_exercise_progress como fallback
    if (objectivesError) {
      // Si la tabla no existe, intentar con user_exercise_progress
      if (objectivesError.code === '42P01' || objectivesError.message?.includes('does not exist')) {
        console.log('Tabla user_exercise_objectives no existe, usando user_exercise_progress como fallback');

        const { data: exercises, error: progressError } = await dbClient
          .from('user_exercise_progress')
          .select('id, exercise_title, unit, value_1, date_1, created_at, updated_at')
          .eq('user_id', queryUserId)
          .order('created_at', { ascending: false });

        if (progressError) {
          if (progressError.code === '42P01' || progressError.message?.includes('does not exist')) {
            return NextResponse.json({
              exercises: []
            });
          }

          console.error('Error consultando ejercicios:', progressError);
          return NextResponse.json(
            {
              error: 'Error al consultar ejercicios',
              details: progressError.message,
              code: progressError.code
            },
            { status: 500 }
          );
        }

        // Transformar datos de user_exercise_progress
        const formattedExercises = (exercises || []).map((exercise: any) => ({
          id: exercise.id,
          exercise_title: exercise.exercise_title,
          unit: exercise.unit,
          current_value: exercise.value_1 ? parseFloat(exercise.value_1.toString()) : undefined,
          objective: undefined,
          created_at: exercise.created_at,
          updated_at: exercise.updated_at || exercise.date_1
        }));

        return NextResponse.json({
          exercises: formattedExercises
        });
      }

      console.error('Error consultando objetivos:', objectivesError);
      return NextResponse.json(
        {
          error: 'Error al consultar objetivos',
          details: objectivesError.message,
          code: objectivesError.code
        },
        { status: 500 }
      );
    }

    // Transformar los datos de user_exercise_objectives al formato esperado por el componente
    const formattedExercises = (objectives || []).map((exercise: any) => ({
      id: exercise.id,
      exercise_title: exercise.exercise_title,
      unit: exercise.unit,
      current_value: exercise.current_value ? parseFloat(exercise.current_value.toString()) : undefined,
      objective: exercise.objective ? parseFloat(exercise.objective.toString()) : undefined,
      created_at: exercise.created_at,
      updated_at: exercise.updated_at
    }));

    return NextResponse.json({
      exercises: formattedExercises
    });

  } catch (error: any) {
    console.error('Error en GET /api/profile/exercise-progress:', error);
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
 * POST /api/profile/exercise-progress
 * Crea o actualiza el progreso de un ejercicio
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
    const { exercise_title, unit, current_value, objective } = body;

    if (!exercise_title || !unit) {
      return NextResponse.json(
        { error: 'exercise_title y unit son requeridos' },
        { status: 400 }
      );
    }

    // Intentar usar user_exercise_objectives primero
    let useObjectivesTable = true;
    let existing = null;

    // Buscar si ya existe un objetivo con ese título para este usuario
    const { data: existingObjective, error: checkError } = await supabase
      .from('user_exercise_objectives')
      .select('id, current_value, objective')
      .eq('user_id', user.id)
      .eq('exercise_title', exercise_title)
      .maybeSingle();

    if (checkError && checkError.code === '42P01') {
      // Tabla no existe, usar user_exercise_progress como fallback
      useObjectivesTable = false;
      const { data: existingProgress } = await supabase
        .from('user_exercise_progress')
        .select('id, value_1')
        .eq('user_id', user.id)
        .eq('exercise_title', exercise_title)
        .maybeSingle();
      existing = existingProgress;
    } else if (!checkError && existingObjective) {
      existing = existingObjective;
    }

    if (existing) {
      // Actualizar objetivo existente
      if (useObjectivesTable) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (current_value !== undefined) updateData.current_value = parseFloat(current_value.toString());
        if (objective !== undefined) updateData.objective = parseFloat(objective.toString());
        if (unit !== undefined) updateData.unit = unit;

        const { data: updated, error: updateError } = await supabase
          .from('user_exercise_objectives')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error actualizando objetivo:', updateError);
          return NextResponse.json(
            { error: 'Error al actualizar objetivo', details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          exercise: {
            id: updated.id,
            exercise_title: updated.exercise_title,
            unit: updated.unit,
            current_value: updated.current_value ? parseFloat(updated.current_value.toString()) : undefined,
            objective: updated.objective ? parseFloat(updated.objective.toString()) : undefined,
            created_at: updated.created_at,
            updated_at: updated.updated_at
          }
        });
      } else {
        // Fallback a user_exercise_progress
        const updateData: any = {
          value_1: current_value,
          date_1: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await supabase
          .from('user_exercise_progress')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error actualizando ejercicio:', updateError);
          return NextResponse.json(
            { error: 'Error al actualizar ejercicio', details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          exercise: {
            id: updated.id,
            exercise_title: updated.exercise_title,
            unit: updated.unit,
            current_value: updated.value_1 ? parseFloat(updated.value_1.toString()) : undefined,
            objective: undefined,
            created_at: updated.created_at,
            updated_at: updated.updated_at
          }
        });
      }
    } else {
      // Crear nuevo objetivo
      if (useObjectivesTable) {
        const { data: created, error: insertError } = await supabase
          .from('user_exercise_objectives')
          .insert({
            user_id: user.id,
            exercise_title,
            unit,
            current_value: current_value ? parseFloat(current_value.toString()) : null,
            objective: objective ? parseFloat(objective.toString()) : null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creando objetivo:', insertError);
          return NextResponse.json(
            { error: 'Error al crear objetivo', details: insertError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          exercise: {
            id: created.id,
            exercise_title: created.exercise_title,
            unit: created.unit,
            current_value: created.current_value ? parseFloat(created.current_value.toString()) : undefined,
            objective: created.objective ? parseFloat(created.objective.toString()) : undefined,
            created_at: created.created_at,
            updated_at: created.updated_at
          }
        });
      } else {
        // Fallback a user_exercise_progress
        const { data: created, error: insertError } = await supabase
          .from('user_exercise_progress')
          .insert({
            user_id: user.id,
            exercise_title,
            unit,
            value_1: current_value,
            date_1: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creando ejercicio:', insertError);
          return NextResponse.json(
            { error: 'Error al crear ejercicio', details: insertError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          exercise: {
            id: created.id,
            exercise_title: created.exercise_title,
            unit: created.unit,
            current_value: created.value_1 ? parseFloat(created.value_1.toString()) : undefined,
            objective: undefined,
            created_at: created.created_at,
            updated_at: created.updated_at
          }
        });
      }
    }

  } catch (error: any) {
    console.error('Error en POST /api/profile/exercise-progress:', error);
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
 * PUT /api/profile/exercise-progress
 * Actualiza un objetivo de ejercicio existente
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
    const { id, exercise_title, unit, current_value, objective } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Intentar actualizar en user_exercise_objectives primero
    let useObjectivesTable = true;

    // Verificar si existe en user_exercise_objectives
    const { data: existingObjective, error: checkError } = await supabase
      .from('user_exercise_objectives')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code === '42P01') {
      // Tabla no existe, usar user_exercise_progress como fallback
      useObjectivesTable = false;
    } else if (checkError || !existingObjective) {
      // No encontrado en user_exercise_objectives, intentar user_exercise_progress
      useObjectivesTable = false;
    }

    if (useObjectivesTable) {
      // Actualizar en user_exercise_objectives
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (exercise_title !== undefined) updateData.exercise_title = exercise_title;
      if (unit !== undefined) updateData.unit = unit;
      if (current_value !== undefined) updateData.current_value = parseFloat(current_value.toString());
      if (objective !== undefined) updateData.objective = parseFloat(objective.toString());

      const { data: updated, error: updateError } = await supabase
        .from('user_exercise_objectives')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando objetivo:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar objetivo', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        exercise: {
          id: updated.id,
          exercise_title: updated.exercise_title,
          unit: updated.unit,
          current_value: updated.current_value ? parseFloat(updated.current_value.toString()) : undefined,
          objective: updated.objective ? parseFloat(updated.objective.toString()) : undefined,
          created_at: updated.created_at,
          updated_at: updated.updated_at
        }
      });
    } else {
      // Fallback: actualizar en user_exercise_progress
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (exercise_title !== undefined) updateData.exercise_title = exercise_title;
      if (unit !== undefined) updateData.unit = unit;
      if (current_value !== undefined) {
        updateData.value_1 = parseFloat(current_value.toString());
        updateData.date_1 = new Date().toISOString();
      }

      const { data: updated, error: updateError } = await supabase
        .from('user_exercise_progress')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando ejercicio:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar ejercicio', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        exercise: {
          id: updated.id,
          exercise_title: updated.exercise_title,
          unit: updated.unit,
          current_value: updated.value_1 ? parseFloat(updated.value_1.toString()) : undefined,
          objective: undefined,
          created_at: updated.created_at,
          updated_at: updated.updated_at
        }
      });
    }

  } catch (error: any) {
    console.error('Error en PUT /api/profile/exercise-progress:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

