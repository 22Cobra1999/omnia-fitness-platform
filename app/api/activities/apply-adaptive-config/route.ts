import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient()

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        // 2. Parse Request Body
        const { productIds, config } = await request.json()

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No se especificaron productos' }, { status: 400 })
        }

        if (!config) {
            return NextResponse.json({ success: false, error: 'No se especificó la configuración' }, { status: 400 })
        }

        console.log(`💾 [API] Applying adaptive config to products: ${productIds.join(', ')}`)

        // 3. Update Activities
        // We only update 'adaptive_rule_ids' as requested
        const { error: updateError } = await supabase
            .from('activities')
            .update({
                adaptive_rule_ids: config.adaptive_rule_ids || [],
                updated_at: new Date().toISOString()
            })
            .in('id', productIds)
            .eq('coach_id', user.id) // Security check: only update own products

        if (updateError) {
            console.error('❌ [API] Error updating adaptive_config:', updateError)
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Configuración aplicada correctamente a ${productIds.length} programas`
        })

    } catch (error: any) {
        console.error('❌ [API] Critical error in apply-adaptive-config:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
