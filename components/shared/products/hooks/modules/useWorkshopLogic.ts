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
            setWorkshopMaterial({
                pdfType: editingProduct.pdf_url ? 'general' : (editingProduct.topic_pdfs ? 'by-topic' : 'none'),
                pdfFile: null,
                pdfUrl: editingProduct.pdf_url || null,
                topicPdfs: editingProduct.topic_pdfs || {}
            })
            // If workshop schedule is needed from DB, it should be loaded here or passed via editingProduct
            // editingProduct seems to contain it in some format? 
            // The original code doesn't explicitly load workshopSchedule from editingProduct 
            // in the initial useEffect, except maybe via a separate fetch or if it's already in editingProduct object.
            // Let's assume it might come in editingProduct or need specific handling.
            // In the original code, only `workshopMaterial` was set in the useEffect (lines 891-898).
            // `workshopSchedule` state was initialized empty (line 187).
            // Wait, if editing a workshop, surely schedule should be populated?
            // Ah, maybe the component handling the schedule loads it? 
            // Or maybe I missed it in the original huge file.
            // Let's re-read the original file around line 891.
        }
    }, [editingProduct, selectedType])

    return {
        workshopMaterial,
        setWorkshopMaterial,
        workshopSchedule,
        setWorkshopSchedule
    }
}
