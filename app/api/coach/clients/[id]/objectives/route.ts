import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createRouteHandlerClient()
        const { id: clientId } = params

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { objectives } = body

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

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach objectives update:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
