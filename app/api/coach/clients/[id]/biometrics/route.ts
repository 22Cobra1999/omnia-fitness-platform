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
        const { weight, height, biometrics } = body

        // 1. Update clients table for weight/height
        if (weight !== undefined || height !== undefined) {
            const updates: any = {}
            if (weight !== undefined) updates.weight = weight
            if (height !== undefined) updates.Height = height // Table uses 'Height' with capital H in some places?

            const { error: clientError } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', clientId)

            if (clientError) {
                console.error('Error updating client weight/height:', clientError)
            }
        }

        // 2. Update specific biometrics in user_biometrics
        if (biometrics && Array.isArray(biometrics)) {
            for (const bio of biometrics) {
                if (bio.id) {
                    await supabase
                        .from('user_biometrics')
                        .update({
                            value: bio.value,
                            unit: bio.unit,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', bio.id)
                        .eq('user_id', clientId)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in coach biometrics update:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
