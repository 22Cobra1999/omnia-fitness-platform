
import React from 'react'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import {
    DocumentMaterialState,
    GeneralFormState,
    SpecificFormState,
    ProductType
} from '../product-constants'

interface PreviewStepProps {
    editingProduct: any
    generalForm: GeneralFormState
    specificForm: SpecificFormState
    productCategory: 'fitness' | 'nutricion'
    selectedType: ProductType | null
    workshopSchedule: any[]
    documentMaterial: DocumentMaterialState
    derivedPreviewStats: {
        sesiones: number
        ejerciciosTotales: number
        ejerciciosUnicos: number
        semanas: number
    }
    user: any
}

export function PreviewStep({
    editingProduct,
    generalForm,
    specificForm,
    productCategory,
    selectedType,
    workshopSchedule,
    documentMaterial,
    derivedPreviewStats,
    user
}: PreviewStepProps) {

    // Logic extracted from CreateProductModal to construct the activity object for preview
    const activityPreview = {
        ...(editingProduct ? (editingProduct as any) : {}),
        // En creación: asegurar título/descripcion
        title: generalForm.name || (editingProduct as any)?.title || (editingProduct as any)?.name || 'Sin título',
        description: generalForm.description || (editingProduct as any)?.description || '',
        categoria: productCategory === 'nutricion' ? 'nutricion' : 'fitness',
        difficulty: specificForm.level || (editingProduct as any)?.difficulty || 'beginner',
        ...(selectedType === 'workshop'
            ? (() => {
                const now = new Date()
                now.setHours(0, 0, 0, 0)
                const hasFuture = (workshopSchedule || []).some((s: any) => {
                    const ds = String(s?.date || '').trim()
                    if (!ds) return false
                    const dd = new Date(ds)
                    dd.setHours(0, 0, 0, 0)
                    return dd >= now
                })
                return {
                    type: 'workshop',
                    cantidadTemas: derivedPreviewStats.ejerciciosUnicos,
                    cantidadDias: derivedPreviewStats.sesiones,
                    semanas_totales: derivedPreviewStats.semanas,
                    // Forzar estado activo en preview si hay fechas futuras
                    taller_activo: hasFuture,
                    is_finished: !hasFuture
                }
            })()
            : {}),
        // Mostrar objetivos seleccionados en el preview
        objetivos: generalForm.objetivos || [],
        ...(generalForm.image && typeof generalForm.image === 'object' && 'url' in generalForm.image
            ? { image_url: (generalForm.image as any).url }
            : {}),
        // Reflejar siempre el precio actual del formulario
        price: (() => {
            const parsed = parseFloat(String(generalForm.price ?? '').replace(',', '.'))
            return Number.isFinite(parsed) ? parsed : ((editingProduct as any)?.price ?? 0)
        })(),
        // Para documentos: agregar campos denormalizados calculados
        ...(selectedType === 'document' ? {
            type: 'document',
            semanas_totales: (() => {
                const valRaw = generalForm.duration_value
                const value = parseFloat(valRaw) || 0
                if (value <= 0) return 0

                const unit = generalForm.duration_unit || 'semanas'
                if (unit === 'días') return Math.max(1, Math.ceil(value / 7))
                if (unit === 'semanas') return Math.ceil(value)
                if (unit === 'meses') return Math.ceil(value * 4)
                return Math.ceil(value)
            })(),
            cantidadTemas: documentMaterial.topics.filter(t => t.saved).length,
            items_unicos: documentMaterial.topics.filter(t => t.saved).length,
            items_totales: documentMaterial.topics.filter(t => t.saved).length,
            sesiones_dias_totales: 0,
            capacity: generalForm.capacity === 'limitada'
                ? parseInt(generalForm.stockQuantity) || 0
                : 999
        } : {
            // Para programas/talleres: usar estadísticas calculadas en vivo
            items_unicos: derivedPreviewStats.ejerciciosUnicos,
            cantidadTemas: derivedPreviewStats.ejerciciosUnicos, // Asegurar para workshops
            sesiones_dias_totales: derivedPreviewStats.sesiones,
            cantidadDias: derivedPreviewStats.sesiones, // Asegurar para workshops
            semanas_totales: selectedType === 'workshop' ? derivedPreviewStats.semanas : 0,
            totalSessions: derivedPreviewStats.sesiones,
            // ⚠️ FIX: Correctly map capacity for preview.
            // If capacity is 'limitada', use stockQuantity.
            // If capacity is 'ilimitada' (or anything else), use a safe 'infinity' number (999999) consistent with backend logic.
            capacity: generalForm.capacity === 'limitada'
                ? (parseInt(generalForm.stockQuantity) || 0)
                : 999999
        }),
        previewStats: {
            sesiones: derivedPreviewStats.sesiones,
            ejerciciosTotales: derivedPreviewStats.ejerciciosTotales,
            ejerciciosUnicos: derivedPreviewStats.ejerciciosUnicos,
            semanas: derivedPreviewStats.semanas
        },
        // ✅ OVERRIDE FINAL: Asegurar que los stats calculados siempre ganen sobre valores guardados
        ...(selectedType !== 'document' ? {
            items_unicos: derivedPreviewStats.ejerciciosUnicos,
            cantidadTemas: derivedPreviewStats.ejerciciosUnicos,
            sesiones_dias_totales: derivedPreviewStats.sesiones,
            cantidadDias: derivedPreviewStats.sesiones,
            totalSessions: derivedPreviewStats.sesiones,
            semanas_totales: selectedType === 'workshop' ? derivedPreviewStats.semanas : ((editingProduct as any)?.semanas_totales || 0)
        } : {}),
        // Agregar información del coach para que se muestre en preview
        coach_name: (editingProduct as any)?.coach_name || (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'Coach',
        coach_rating: (editingProduct as any)?.coach_rating || 0,
        // Agregar meet credits si están configurados (desde form o desde DB)
        included_meet_credits: generalForm.included_meet_credits || (editingProduct as any)?.included_meet_credits || 0
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-center">
                <div className="flex-shrink-0 w-48">
                    <ActivityCard
                        activity={activityPreview}
                        size="small"
                    />
                </div>
            </div>
        </div>
    )
}
