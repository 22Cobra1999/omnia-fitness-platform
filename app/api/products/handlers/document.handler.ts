
/**
 * Handles creation of document topics and PDF materials.
 */
export async function handleDocumentCreation(supabase: any, activityId: number | string, body: any) {
    if (body.modality !== 'document' || !body.documentMaterial) {
        return
    }

    const material = body.documentMaterial
    const topics = material.topics || []
    const topicPdfs = material.topicPdfs || {}

    // 1. Guardar PDF general si existe
    if (material.pdfType === 'general' && material.pdfUrl) {
        await supabase
            .from('activity_media')
            .insert({
                activity_id: activityId,
                pdf_url: material.pdfUrl
            })
    }

    // 2. Guardar cada tema en document_topics
    for (const topic of topics) {
        if (!topic.title) continue

        const topicInsert = {
            activity_id: activityId,
            title: topic.title,
            description: topic.description || '',
            pdf_url: topicPdfs[topic.id]?.url || null,
            pdf_filename: topicPdfs[topic.id]?.fileName || null
        }

        const { error: topicError } = await supabase
            .from('document_topics')
            .insert(topicInsert)

        if (topicError) {
            console.error(`❌ Error insertando tema de documento "${topic.title}":`, topicError)
        }
    }
}

/**
 * Handles update of document topics.
 */
export async function handleDocumentUpdate(supabase: any, activityId: number | string, body: any) {
    if (body.modality !== 'document' || !body.documentMaterial) {
        return
    }

    const material = body.documentMaterial
    const topics = material.topics || []
    const topicPdfs = material.topicPdfs || {}

    // 1. Actualizar PDF general si existe
    if (typeof material.pdfUrl === 'string' && material.pdfUrl.length > 0) {
        const { data: existingMedia } = await supabase
            .from('activity_media')
            .select('id')
            .eq('activity_id', activityId)
            .maybeSingle()

        if (existingMedia) {
            await supabase
                .from('activity_media')
                .update({ pdf_url: material.pdfUrl })
                .eq('id', existingMedia.id)
        } else {
            await supabase
                .from('activity_media')
                .insert({
                    activity_id: activityId,
                    pdf_url: material.pdfUrl
                })
        }
    }

    // 2. Obtener temas existentes para saber cuáles actualizar y cuáles borrar
    const { data: existingTopics } = await supabase
        .from('document_topics')
        .select('id, title')
        .eq('activity_id', activityId)

    const existingTopicsMap = new Map()
    if (existingTopics) {
        existingTopics.forEach((t: any) => existingTopicsMap.set(t.title, t.id))
    }

    const currentTopicNames = new Set()

    // 3. Procesar temas: Insertar o actualizar
    for (const topic of topics) {
        if (!topic.title) continue
        currentTopicNames.add(topic.title)

        const topicData = {
            activity_id: activityId,
            title: topic.title,
            description: topic.description || '',
            pdf_url: topicPdfs[topic.id]?.url || null,
            pdf_filename: topicPdfs[topic.id]?.fileName || null
        }

        if (existingTopicsMap.has(topic.title)) {
            // Actualizar existente
            const topicId = existingTopicsMap.get(topic.title)
            await supabase
                .from('document_topics')
                .update(topicData)
                .eq('id', topicId)
        } else {
            // Insertar nuevo
            await supabase
                .from('document_topics')
                .insert(topicData)
        }
    }

    // 4. Eliminar temas obsoletos
    if (existingTopics) {
        const topicsToDelete = existingTopics
            .filter((t: any) => !currentTopicNames.has(t.title))
            .map((t: any) => t.id)

        if (topicsToDelete.length > 0) {
            await supabase
                .from('document_topics')
                .delete()
                .in('id', topicsToDelete)
        }
    }
}
