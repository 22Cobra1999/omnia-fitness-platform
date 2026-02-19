import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from "../../../../../lib/supabase/supabase-server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const activityId = resolvedParams.id
        const supabase = await createRouteHandlerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
        }

        console.log(`📸 [snapshot-expired] Procesando actividad ${activityId} para usuario ${user.id}`)

        // 1. Check if snapshot already exists
        const { data: existing, error: existingError } = await supabase
            .from('actividades_vencidas')
            .select('id')
            .eq('activity_id', activityId)
            .eq('client_id', user.id)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ success: true, message: 'Snapshot ya existe', id: existing.id })
        }

        // 2. Fetch enrollment info to ensure it exists
        const { data: enrollment, error: enrError } = await supabase
            .from('activity_enrollments')
            .select('id')
            .eq('activity_id', activityId)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (enrError || !enrollment) {
            console.error('❌ [snapshot-expired] Error buscando enrollment:', enrError)
            return NextResponse.json({ error: 'Enrollment no encontrado' }, { status: 404 })
        }

        // 3. Call the archive RPC
        console.log(`📦 [snapshot-expired] Ejecutando RPC para enrollment ${enrollment.id}`)
        const { data: archiveResult, error: rpcError } = await supabase
            .rpc('archive_expired_enrollment', { p_enrollment_id: enrollment.id })

        if (rpcError) {
            console.error('❌ [snapshot-expired] Error en RPC archive_expired_enrollment:', rpcError)
            return NextResponse.json({ error: 'Error durante el proceso de archivado', details: rpcError }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: archiveResult })
    } catch (error) {
        console.error('❌ [snapshot-expired] Error inesperado:', error)
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
