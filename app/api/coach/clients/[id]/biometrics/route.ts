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
        const { name, value, unit } = body

        const { data: created, error } = await supabase
            .from('user_biometrics')
            .insert({
                user_id: clientId,
                name,
                value,
                unit
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, biometric: created })
    } catch (error: any) {
        console.error('Error in coach biometrics POST:', error)
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
        const { weight, height, biometrics, id: singleBioId, name, value, unit } = body

        // Case 1: Updating weight/height in clients table
        if (weight !== undefined || height !== undefined) {
            const updates: any = {}
            if (weight !== undefined) updates.weight = weight
            if (height !== undefined) updates.Height = height

            await supabase
                .from('clients')
                .update(updates)
                .eq('id', clientId)
        }

        // Case 2: Updating an array of biometrics
        if (biometrics && Array.isArray(biometrics)) {
            for (const bio of biometrics) {
                if (bio.id) {
                    await supabase
                        .from('user_biometrics')
                        .update({
                            name: bio.name,
                            value: bio.value,
                            unit: bio.unit,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', bio.id)
                        .eq('user_id', clientId)
                }
            }
        }

        // Case 3: Updating a single biometric (from modal)
        if (singleBioId) {
            const { data: updated, error } = await supabase
                .from('user_biometrics')
                .update({
                    name,
                    value,
                    unit,
                    updated_at: new Date().toISOString()
                })
                .eq('id', singleBioId)
                .eq('user_id', clientId)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, biometric: updated })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach biometrics update:', error)
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
        const bioId = searchParams.get('id')

        if (!bioId) return NextResponse.json({ error: 'Biometric ID required' }, { status: 400 })

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { error } = await supabase
            .from('user_biometrics')
            .delete()
            .eq('id', bioId)
            .eq('user_id', clientId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach biometrics DELETE:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
