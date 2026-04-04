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
        return
    }

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

    let generalPdfUrl = null
    const topicPdfUrls: Record<string, { url: string, fileName: string }> = {}

    if (body.workshopMaterial) {
        const material = body.workshopMaterial
        if (material.pdfType === 'general' && material.pdfUrl && material.pdfUrl.startsWith('http')) {
            generalPdfUrl = material.pdfUrl
        }
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

    if (generalPdfUrl) {
        await supabase.from('activity_media').insert({ activity_id: activityId, pdf_url: generalPdfUrl })
    }

    for (const [topicTitle, topicData] of topicGroups) {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const hasFutureDates = topicData.originales.some((horario: any) => {
            const fecha = new Date(horario.fecha)
            fecha.setHours(0, 0, 0, 0)
            return fecha >= now
        })

        const topicInsert: any = {
            actividad_id: activityId,
            nombre: topicData.nombre || 'Sin título',
            descripcion: topicData.descripcion || '',
            originales: { fechas_horarios: topicData.originales },
            secundarios: { fechas_horarios: topicData.secundarios },
            activo: hasFutureDates
        }

        if (topicPdfUrls[topicTitle]) {
            topicInsert.pdf_url = topicPdfUrls[topicTitle].url
            topicInsert.pdf_file_name = topicPdfUrls[topicTitle].fileName
        }

        const { error: topicError } = await supabase.from('taller_detalles').insert(topicInsert)
        if (topicError) console.error('❌ Error creando tema workshop:', topicError)
    }

    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        await syncWorkshopToCalendar(activityIdInt, userId)
    } catch (syncError) {
        console.error('⚠️ [API/Products] Error sincronizando taller:', syncError)
    }
}

/**
 * Handles update of workshop details.
 */
export async function handleWorkshopUpdate(supabase: any, activityId: number | string, body: any, userId: string) {
    if (body.modality !== 'workshop' || !body.workshopSchedule || !Array.isArray(body.workshopSchedule)) {
        return
    }

    const { data: existingTopics } = await supabase.from('taller_detalles').select('*').eq('actividad_id', activityId)

    const existingTopicsMap = new Map()
    if (existingTopics) existingTopics.forEach((tema: any) => existingTopicsMap.set(tema.nombre, tema))

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
        const horarioItem = { fecha: session.date, hora_inicio: session.startTime, hora_fin: session.endTime, cupo: 20 }
        if (session.isPrimary !== false) topic.originales.push(horarioItem)
        else topic.secundarios.push(horarioItem)
    }

    const topicPdfUrls: Record<string, { url: string, fileName: string }> = {}
    if (body.workshopMaterial?.pdfType === 'by-topic' && body.workshopMaterial.topicPdfs) {
        for (const [topicTitle, topicPdf] of Object.entries(body.workshopMaterial.topicPdfs)) {
            const topicPdfAny = topicPdf as any
            if (topicPdfAny?.url?.startsWith('http')) {
                topicPdfUrls[topicTitle] = { url: topicPdfAny.url, fileName: topicPdfAny.fileName || null }
            }
        }
    }

    const currentTopicNames = new Set()
    let hasAnyFutureDatesGlobal = false

    for (const [topicTitle, topicData] of topicGroups) {
        currentTopicNames.add(topicTitle)
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
            originales: { fechas_horarios: [...topicData.originales, ...topicData.secundarios] },
            activo: hasFutureDates
        }
        if (topicPdfUrls[topicTitle]) {
            topicInsert.pdf_url = topicPdfUrls[topicTitle].url
            topicInsert.pdf_file_name = topicPdfUrls[topicTitle].fileName
        }

        if (existingTopicsMap.has(topicTitle)) {
            const existingTopic = existingTopicsMap.get(topicTitle)
            await supabase.from('taller_detalles').update(topicInsert).eq('id', existingTopic.id)
        } else {
            await supabase.from('taller_detalles').insert(topicInsert)
        }
    }

    if (existingTopics) {
        const topicsToDelete = existingTopics.filter((t: any) => !currentTopicNames.has(t.nombre)).map((t: any) => t.id)
        if (topicsToDelete.length > 0) await supabase.from('taller_detalles').delete().in('id', topicsToDelete)
    }

    if (hasAnyFutureDatesGlobal) {
        const { data: currentActivity } = await supabase.from('activities').select('is_finished, workshop_versions').eq('id', activityId).single()
        if (currentActivity?.is_finished) {
            const versions = (currentActivity as any)?.workshop_versions?.versions || []
            const nextVersion = (Array.isArray(versions) ? versions.length : 0) + 1
            const newVersion = { version: nextVersion, empezada_el: formatDateSpanish(new Date()), finalizada_el: null }
            await supabase.from('activities').update({
                is_finished: false,
                finished_at: null,
                workshop_versions: { versions: [...(Array.isArray(versions) ? versions : []), newVersion] }
            }).eq('id', activityId)
        }
    }

    try {
        const activityIdInt = typeof activityId === 'string' ? parseInt(activityId, 10) : activityId
        await syncWorkshopToCalendar(activityIdInt, userId)
    } catch (syncError) {
        console.error('⚠️ [API/Products] Error resincronizando:', syncError)
    }
}
