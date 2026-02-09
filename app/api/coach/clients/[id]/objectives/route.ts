import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteHandlerClient()
        const { id: clientId } = await params

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { exercise_title, unit, value } = body

        const { data: created, error } = await supabase
            .from('user_exercise_objectives')
            .insert({
                user_id: clientId,
                exercise_title,
                unit,
                current_value: value,
                objective: value // Initial objective same as value
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, objective: created })
    } catch (error: any) {
        console.error('Error in coach objectives POST:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteHandlerClient()
        const { id: clientId } = await params

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { objectives, id, current_value, objective, exercise_title, unit } = body

        // Case 1: Multiple objectives
        if (objectives && Array.isArray(objectives)) {
            for (const obj of objectives) {
                if (obj.id) {
                    await supabase
                        .from('user_exercise_objectives')
                        .update({
                            exercise_title: obj.exercise_title,
                            current_value: obj.current_value,
                            objective: obj.objective,
                            unit: obj.unit,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', obj.id)
                        .eq('user_id', clientId)
                }
            }
        }

        // Case 2: Single objective update
        if (id) {
            const updates: any = { updated_at: new Date().toISOString() }
            if (current_value !== undefined) updates.current_value = current_value
            if (objective !== undefined) updates.objective = objective
            if (exercise_title !== undefined) updates.exercise_title = exercise_title
            if (unit !== undefined) updates.unit = unit

            const { data: updated, error } = await supabase
                .from('user_exercise_objectives')
                .update(updates)
                .eq('id', id)
                .eq('user_id', clientId)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, objective: updated })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach objectives update:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteHandlerClient()
        const { id: clientId } = await params

        const { searchParams } = new URL(request.url)
        const objectiveId = searchParams.get('id')

        if (!objectiveId) return NextResponse.json({ error: 'Objective ID required' }, { status: 400 })

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { error } = await supabase
            .from('user_exercise_objectives')
            .delete()
            .eq('id', objectiveId)
            .eq('user_id', clientId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach objectives DELETE:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
