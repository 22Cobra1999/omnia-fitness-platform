import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteHandlerClient()
        const { id: clientId } = await params

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: injuries, error } = await supabase
            .from('user_injuries')
            .select('*')
            .eq('user_id', clientId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, injuries: injuries || [] })
    } catch (error: any) {
        console.error('Error in coach injuries GET:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

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
        const {
            name, description, severity, restrictions,
            muscle_id, muscle_name, muscle_group, pain_level, pain_description
        } = body

        const { data: created, error } = await supabase
            .from('user_injuries')
            .insert({
                user_id: clientId,
                name,
                description,
                severity,
                restrictions,
                muscle_id,
                muscle_name,
                muscle_group,
                pain_level,
                pain_description
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, injury: created })
    } catch (error: any) {
        console.error('Error in coach injuries POST:', error)
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
        const {
            id, name, description, severity, restrictions,
            muscle_id, muscle_name, muscle_group, pain_level, pain_description
        } = body

        const { data: updated, error } = await supabase
            .from('user_injuries')
            .update({
                name,
                description,
                severity,
                restrictions,
                muscle_id,
                muscle_name,
                muscle_group,
                pain_level,
                pain_description,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', clientId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, injury: updated })
    } catch (error: any) {
        console.error('Error in coach injuries PUT:', error)
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
        const injuryId = searchParams.get('id')

        if (!injuryId) return NextResponse.json({ error: 'Injury ID required' }, { status: 400 })

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { error } = await supabase
            .from('user_injuries')
            .delete()
            .eq('id', injuryId)
            .eq('user_id', clientId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach injuries DELETE:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
