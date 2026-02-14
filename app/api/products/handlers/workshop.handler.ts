
import { syncWorkshopToCalendar } from '@/lib/utils/workshop-sync'

const formatDateSpanish = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
}

/**
 * Handles creation of workshop details (taller_detalles) and calendar sync.
 */
export async function handleWorkshopCreation(supabase: any, activityId: number | string, body: any, userId: string) {
    if (body.modality !== 'workshop' || !body.workshopSchedule || !Array.isArray(body.workshopSchedule)) {
        console.log('⚠️ handleWorkshopCreation: No workshopSchedule provided or invalid format')
        return
    }

    // Agrupar sesiones por tema
    const topicGroups = new Map()

    for (const session of body.workshopSchedule) {
        const topicKey = session.title || 'Sin título'
        if (!topicGroups.has(topicKey)) {
            topicGroups.set(topicKey, {
                nombre: session.title,
                descripcion: session.description || '',
                originales: [],
                secundarios: []
            })
        }

        const topic = topicGroups.get(topicKey)
        const horarioItem = {
            fecha: session.date,
            hora_inicio: session.startTime,
            hora_fin: session.endTime,
            cupo: 20 // Cupo por defecto
        }

        // Si no viene isPrimary (viejas versiones del UI), asumir que es horario principal
        if (session.isPrimary !== false) {
            topic.originales.push(horarioItem)
        } else {
            topic.secundarios.push(horarioItem)
        }
    }

    // Manejar PDFs del taller
    let generalPdfUrl = null
    const topicPdfUrls: Record<string, { url: string, fileName: string }> = {}

    if (body.workshopMaterial) {
        const material = body.workshopMaterial

        // Si hay PDF general, guardarlo
        if (material.pdfType === 'general' && material.pdfUrl && material.pdfUrl.startsWith('http')) {
            generalPdfUrl = material.pdfUrl
        }

        // Si hay PDFs por tema, guardar las URLs
        if (material.pdfType === 'by-topic' && material.topicPdfs) {
            for (const [topicTitle, topicPdf] of Object.entries(material.topicPdfs)) {
                const topicPdfAny = topicPdf as any
                if (topicPdfAny && topicPdfAny.url && String(topicPdfAny.url).startsWith('http')) {
                    topicPdfUrls[topicTitle] = {
                        url: topicPdfAny.url,
                        fileName: topicPdfAny.fileName || null
                    }
                }
            }
        }
    }

    // Guardar PDF general en activity_media si existe
    if (generalPdfUrl) {
        await supabase
            .from('activity_media')
            .insert({
                activity_id: activityId,
                pdf_url: generalPdfUrl
            })
    }

    for (const [topicTitle, topicData] of topicGroups) {
        const originalesJson = {
            fechas_horarios: topicData.originales
        }

        const secundariosJson = {
            fechas_horarios: topicData.secundarios
        }

        // Verificar si hay fechas futuras para determinar si el taller está activo
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const hasFutureDates = topicData.originales.some((horario: any) => {
            const fecha = new Date(horario.fecha)
            fecha.setHours(0, 0, 0, 0)
            return fecha >= now
        })

        // Insertar en taller_detalles con activo = true si hay fechas futuras
        const topicInsert: any = {
            actividad_id: activityId,
            nombre: topicData.nombre || 'Sin título',
            descripcion: topicData.descripcion || '',
            originales: originalesJson,
            secundarios: secundariosJson,
            activo: hasFutureDates // Activo solo si hay fechas futuras
        }

        // Agregar PDF por tema si existe
        if (topicPdfUrls[topicTitle]) {
            topicInsert.pdf_url = topicPdfUrls[topicTitle].url
            topicInsert.pdf_file_name = topicPdfUrls[topicTitle].fileName
        }

        const { error: topicError } = await supabase
            .from('taller_detalles')
            .insert(topicInsert)

        if (topicError) {
            console.error('❌ Error creando tema en taller_detalles:', topicError)
        }
    }

    // ✅ SINCRONIZAR A CALENDAR_EVENTS
    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        await syncWorkshopToCalendar(activityIdInt, userId)
    } catch (syncError) {
        console.error('⚠️ [API/Products] Error sincronizando taller al calendario:', syncError)
    }
}

/**
 * Handles update of workshop details.
 */
export async function handleWorkshopUpdate(supabase: any, activityId: number | string, body: any, userId: string) {
    if (body.modality !== 'workshop' || !body.workshopSchedule || !Array.isArray(body.workshopSchedule)) {
        console.log('⚠️ handleWorkshopUpdate: No workshopSchedule provided or invalid format')
        return
    }

    // Cargar temas existentes para hacer merge inteligente
    const { data: existingTopics, error: fetchError } = await supabase
        .from('taller_detalles')
        .select('id, nombre, descripcion, originales, pdf_url, pdf_file_name, activo')
        .eq('actividad_id', activityId)

    if (fetchError) {
        console.error('❌ Error cargando temas existentes:', fetchError)
    }

    const existingTopicsMap = new Map()
    if (existingTopics) {
        existingTopics.forEach((tema: any) => {
            existingTopicsMap.set(tema.nombre, tema)
        })
    }

    console.log(`📊 Temas existentes encontrados: ${existingTopics?.length || 0}`)

    // Agrupar sesiones por tema
    const topicGroups = new Map()

    for (const session of body.workshopSchedule) {
        const topicKey = session.title || 'Sin título'
        if (!topicGroups.has(topicKey)) {
            topicGroups.set(topicKey, {
                nombre: session.title,
                descripcion: session.description || '',
                originales: [],
                secundarios: []
            })
        }

        const topic = topicGroups.get(topicKey)
        const horarioItem = {
            fecha: session.date,
            hora_inicio: session.startTime,
            hora_fin: session.endTime,
            cupo: 20
        }

        if (session.isPrimary !== false) {
            topic.originales.push(horarioItem)
        } else {
            topic.secundarios.push(horarioItem)
        }
    }

    // Manejar PDFs
    const topicPdfUrls: Record<string, { url: string, fileName: string }> = {}
    if (body.workshopMaterial && body.workshopMaterial.pdfType === 'by-topic' && body.workshopMaterial.topicPdfs) {
        for (const [topicTitle, topicPdf] of Object.entries(body.workshopMaterial.topicPdfs)) {
            const topicPdfAny = topicPdf as any
            if (topicPdfAny && topicPdfAny.url && String(topicPdfAny.url).startsWith('http')) {
                topicPdfUrls[topicTitle] = {
                    url: topicPdfAny.url,
                    fileName: topicPdfAny.fileName || null
                }
            }
        }
    }

    // Procesar temas: Insertar nuevos o actualizar existentes
    const currentTopicNames = new Set()
    let hasAnyFutureDatesGlobal = false

    for (const [topicTitle, topicData] of topicGroups) {
        currentTopicNames.add(topicTitle)

        const originalesJson = { fechas_horarios: topicData.originales }
        const secundariosJson = { fechas_horarios: topicData.secundarios }

        // Calcular flag activo
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const hasFutureDates = topicData.originales.some((horario: any) => {
            const fecha = new Date(horario.fecha)
            fecha.setHours(0, 0, 0, 0)
            return fecha >= now
        })

        if (hasFutureDates) hasAnyFutureDatesGlobal = true

        const topicInsert: any = {
            actividad_id: activityId,
            nombre: topicData.nombre || 'Sin título',
            descripcion: topicData.descripcion || '',
            originales: {
                fechas_horarios: [...topicData.originales, ...topicData.secundarios]
            },
            activo: hasFutureDates
        }

        if (topicPdfUrls[topicTitle]) {
            topicInsert.pdf_url = topicPdfUrls[topicTitle].url
            topicInsert.pdf_file_name = topicPdfUrls[topicTitle].fileName
        }

        if (existingTopicsMap.has(topicTitle)) {
            // Actualizar existente
            const existingTopic = existingTopicsMap.get(topicTitle)

            // Preservar PDF si no se envió uno nuevo pero ya existía
            if (!topicInsert.pdf_url && existingTopic.pdf_url) {
                // Si el usuario no mandó nuevo material, mantenemos el anterior
                // Pero wait, si borró el material? El frontend manda el estado completo normalmente.
                // Asumiremos que si viene undefined en el body es que no cambió, o si viene null es borrar.
                // En este caso topicPdfUrls solo tiene lo nuevo/actual.
                // Simplificación: Update sobrescribe.
            }

            const { error: updateError } = await supabase
                .from('taller_detalles')
                .update(topicInsert)
                .eq('id', existingTopic.id)

            if (updateError) console.error('❌ Error actualizando tema:', updateError)
        } else {
            // Insertar nuevo
            const { error: insertError } = await supabase
                .from('taller_detalles')
                .insert(topicInsert)

            if (insertError) console.error('❌ Error insertando nuevo tema:', insertError)
        }
    }

    // Eliminar temas que ya no existen en el nuevo schedule
    if (existingTopics) {
        const topicsToDelete = existingTopics
            .filter((t: any) => !currentTopicNames.has(t.nombre))
            .map((t: any) => t.id)

        if (topicsToDelete.length > 0) {
            console.log(`🗑️ Eliminando ${topicsToDelete.length} temas obsoletos`)
            await supabase
                .from('taller_detalles')
                .delete()
                .in('id', topicsToDelete)
        }
    }


    // Si el taller estaba finalizado y se agregaron nuevas fechas futuras, generar nueva versión y reactivar
    if (hasAnyFutureDatesGlobal) {
        const { data: currentActivity } = await supabase
            .from('activities')
            .select('is_finished, workshop_versions')
            .eq('id', activityId)
            .single()

        const wasFinished = currentActivity?.is_finished === true
        if (wasFinished) {
            const versions = (currentActivity as any)?.workshop_versions?.versions || []
            const nextVersion = (Array.isArray(versions) ? versions.length : 0) + 1
            const newVersion = {
                version: nextVersion,
                empezada_el: formatDateSpanish(new Date()),
                finalizada_el: null
            }

            await supabase
                .from('activities')
                .update({
                    is_finished: false,
                    finished_at: null,
                    workshop_versions: {
                        versions: [...(Array.isArray(versions) ? versions : []), newVersion]
                    }
                })
                .eq('id', activityId)

            console.log('🔄 Taller reactivado automáticamente al agregar nuevas fechas.')
        }
    }

    // Sincronizar calendario
    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        await syncWorkshopToCalendar(activityIdInt, userId)
    } catch (syncError) {
        console.error('⚠️ [API/Products] Error resincronizando calendario:', syncError)
    }
}
