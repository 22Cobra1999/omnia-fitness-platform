import { useState, useEffect } from 'react'
import { WorkshopMaterialState } from '../../product-constants'

export function useWorkshopLogic(editingProduct: any, selectedType: string | null) {
    const [workshopMaterial, setWorkshopMaterial] = useState<WorkshopMaterialState>({
        pdfType: 'none',
        pdfFile: null,
        pdfUrl: null,
        topicPdfs: {}
    })

    const [workshopSchedule, setWorkshopSchedule] = useState<any[]>([])

    useEffect(() => {
        if (editingProduct && selectedType === 'workshop') {
            // Populate material
            setWorkshopMaterial({
                pdfType: editingProduct.pdf_url ? 'general' : (editingProduct.topic_pdfs ? 'by-topic' : 'none'),
                pdfFile: null,
                pdfUrl: editingProduct.pdf_url || null,
                topicPdfs: editingProduct.topic_pdfs || {}
            })

            // Populate schedule by flattening taller_detalles
            const details = editingProduct.workshop_details || editingProduct.taller_detalles
            console.log('🔍 [useWorkshopLogic] Found details:', details?.length, details)
            if (details && Array.isArray(details)) {
                const flatSchedule: any[] = []
                const calculateDuration = (start: string, end: string) => {
                    if (!start || !end) return 0
                    try {
                        const [startH, startM] = start.split(':').map(Number)
                        const [endH, endM] = end.split(':').map(Number)
                        if (isNaN(startH) || isNaN(endH)) return 0
                        const startTotal = startH * 60 + (startM || 0)
                        const endTotal = endH * 60 + (endM || 0)
                        return Math.max(0, (endTotal - startTotal) / 60)
                    } catch (e) {
                        return 0
                    }
                }

                details.forEach((topic: any) => {
                    const parseJson = (val: any) => {
                        if (typeof val === 'string') {
                            try { return JSON.parse(val) } catch (e) { return null }
                        }
                        return val
                    }

                    const originales = parseJson(topic.originales)
                    const secundarios = parseJson(topic.secundarios)

                    if (originales?.fechas_horarios && Array.isArray(originales.fechas_horarios)) {
                        originales.fechas_horarios.forEach((session: any) => {
                            const startTime = session.hora_inicio || session.startTime || ""
                            const endTime = session.hora_fin || session.endTime || ""
                            flatSchedule.push({
                                ...session,
                                title: topic.nombre,
                                description: topic.descripcion,
                                date: session.fecha || session.date,
                                startTime,
                                endTime,
                                duration: session.duration || calculateDuration(startTime, endTime),
                                isPrimary: true
                            })
                        })
                    }

                    if (secundarios?.fechas_horarios && Array.isArray(secundarios.fechas_horarios)) {
                        secundarios.fechas_horarios.forEach((session: any) => {
                            const startTime = session.hora_inicio || session.startTime || ""
                            const endTime = session.hora_fin || session.endTime || ""
                            flatSchedule.push({
                                ...session,
                                title: topic.nombre,
                                description: topic.descripcion,
                                date: session.fecha || session.date,
                                startTime,
                                endTime,
                                duration: session.duration || calculateDuration(startTime, endTime),
                                isPrimary: false
                            })
                        })
                    }
                })

                if (flatSchedule.length > 0) {
                    console.log('✅ [useWorkshopLogic] Setting flatSchedule:', flatSchedule)
                    setWorkshopSchedule(flatSchedule)
                } else {
                    console.warn('⚠️ [useWorkshopLogic] flatSchedule is empty')
                }
            }
        }
    }, [editingProduct, selectedType])

    return {
        workshopMaterial,
        setWorkshopMaterial,
        workshopSchedule,
        setWorkshopSchedule
    }
}
