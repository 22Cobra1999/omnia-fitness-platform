import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createRouteHandlerClient()
        const { data, error } = await supabase
            .from('adaptive_rules_catalog')
            .select('*')
            .eq('is_active', true)
            .order('phase', { ascending: true })

        if (error) throw error

        return NextResponse.json({ success: true, catalog: data })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
