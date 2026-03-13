import { useState } from 'react'
import { toast } from 'sonner'
import { PlanType, ProductType } from '../../product-constants'
import { getPlanLimit } from '@/lib/utils/plan-limits'

interface SubmitProductParams {
    generalForm: any
    specificForm: any
    selectedType: ProductType
    productCategory: 'fitness' | 'nutricion'
    user: any
    editingProduct: any
    persistentCsvData: any[] | undefined
    persistentCalendarSchedule: any
    periods: number
    workshopSchedule: any[]
    workshopMaterial: any
    documentMaterial: any
    weeklyStats: any
    pendingImageFile: File | null
    pendingVideoFile: File | null
    planType: PlanType
    onClose: (refresh?: boolean) => void
    setCurrentStep: (step: any) => void
}

export function useProductSubmission() {
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishProgress, setPublishProgress] = useState('')
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({})

    const handlePublishProduct = async (params: SubmitProductParams) => {
        const {
            generalForm, selectedType, productCategory, user, editingProduct,
            persistentCsvData, persistentCalendarSchedule, periods, workshopSchedule,
            workshopMaterial, documentMaterial, weeklyStats, pendingImageFile, pendingVideoFile,
            planType, onClose, setCurrentStep, specificForm
        } = params

        if (isPublishing) return

        console.log('🚀 [useProductSubmission] handlePublishProduct started', { generalForm, selectedType })
        setIsPublishing(true)
        setValidationErrors([])
        setFieldErrors({})

        try {
            // Basic validation
            const errors: string[] = []
            const currentFieldErrors: { [key: string]: boolean } = {}

            if (!generalForm.name) {
                errors.push('Título es requerido')
                currentFieldErrors.name = true
            }
            if (!generalForm.description) {
                errors.push('Descripción es requerida')
                currentFieldErrors.description = true
            }
            if (!generalForm.price || parseFloat(generalForm.price) <= 0) {
                errors.push('Precio válido es requerido')
                currentFieldErrors.price = true
            }
            if (generalForm.capacity === 'limitada' && (!generalForm.stockQuantity || parseInt(generalForm.stockQuantity) <= 0)) {
                errors.push('Cupos es requerido si la capacidad es limitada')
                currentFieldErrors.stockQuantity = true
            }
            if (!specificForm?.level) {
                errors.push('Dificultad es requerida')
                currentFieldErrors.level = true
            }

            // Planning validation
            const hasPlanning = selectedType === 'workshop' 
                ? (workshopSchedule && workshopSchedule.length > 0)
                : (persistentCalendarSchedule && Object.keys(persistentCalendarSchedule).length > 0)
            
            if (!hasPlanning && selectedType !== 'document') {
                errors.push('Debes agregar al menos una actividad o tema en la planificación')
            }

            if (errors.length > 0) {
                setValidationErrors(errors)
                setFieldErrors(currentFieldErrors)
                
                // Only redirect to general if those fields are the ones missing
                if (currentFieldErrors.name || currentFieldErrors.description || currentFieldErrors.price || currentFieldErrors.stockQuantity || currentFieldErrors.level) {
                    setCurrentStep('general')
                } else if (selectedType === 'workshop') {
                    setCurrentStep('workshopSchedule')
                } else if (selectedType === 'program') {
                    setCurrentStep('weeklyPlan')
                }
                
                setIsPublishing(false)
                return
            }

            setPublishProgress('Preparando archivos...')

            // 1. Upload Main Image (Deferred)
            let finalImageUrl = (generalForm.image && 'url' in generalForm.image) ? generalForm.image.url : null
            const isLocalImage = finalImageUrl && finalImageUrl.startsWith('blob:')

            if (pendingImageFile || isLocalImage) {
                setPublishProgress('Subiendo imagen...')
                const fileToUpload = pendingImageFile || (await fetch(finalImageUrl!).then(r => r.blob()))

                const formData = new FormData()
                formData.append('file', fileToUpload as Blob)
                formData.append('mediaType', 'image')
                formData.append('category', 'product')

                try {
                    const res = await fetch('/api/upload-organized', { method: 'POST', body: formData })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.success) finalImageUrl = data.url
                    } else {
                        throw new Error('Falló la subida de imagen')
                    }
                } catch (e) {
                    console.error('Image upload failed', e)
                    toast.error('Error subiendo imagen, se guardará sin ella.')
                    finalImageUrl = null
                }
            }

            // 2. Upload Main Video if pending
            let finalVideoUrl = generalForm.videoUrl || null
            if (pendingVideoFile) {
                setPublishProgress('Subiendo video...')
                const formData = new FormData()
                formData.append('file', pendingVideoFile)
                formData.append('title', pendingVideoFile.name)
                const res = await fetch('/api/bunny/upload-video', { method: 'POST', body: formData })
                const data = await res.json()
                if (res.ok && data.success) finalVideoUrl = data.streamUrl
            }

            if (typeof finalVideoUrl === 'string' && (finalVideoUrl.trim() === '' || finalVideoUrl.startsWith('blob:'))) finalVideoUrl = null
            if (typeof finalImageUrl === 'string' && (finalImageUrl.trim() === '' || finalImageUrl.startsWith('blob:'))) finalImageUrl = null

            // 3. Prepare product data
            const capacityRaw = parseInt(generalForm.stockQuantity)
            const parsedCapacity = Number.isFinite(capacityRaw) ? Math.max(1, capacityRaw) : 1
            const capacity = generalForm.capacity === 'ilimitada' ? 999999 : parsedCapacity

            // Validate and map difficulty level
            const validLevels = ['beginner', 'intermediate', 'advanced']
            let finalLevel = (specificForm?.level || 'beginner').toLowerCase().trim()
            const levelMap: Record<string, string> = {
                'principiante': 'beginner', 'intermedio': 'intermediate', 'avanzado': 'advanced',
                'basico': 'beginner', 'básico': 'beginner'
            }
            if (levelMap[finalLevel]) finalLevel = levelMap[finalLevel]
            if (!validLevels.includes(finalLevel)) finalLevel = 'beginner'


            const productData = {
                name: generalForm.name,
                description: generalForm.description,
                price: parseFloat(generalForm.price),
                modality: selectedType,
                categoria: productCategory,
                level: finalLevel,
                difficulty: finalLevel,
                capacity: capacity,
                type: generalForm.modality || 'online',
                included_meet_credits: selectedType === 'workshop' ? 0 : (generalForm.included_meet_credits || 0),
                is_public: generalForm.is_public !== false,
                is_paused: !!generalForm.is_paused,
                coach_id: user?.id,
                image_url: finalImageUrl,
                video_url: finalVideoUrl,
                csvData: persistentCsvData || [],
                weeklySchedule: persistentCalendarSchedule || null,
                periods: periods,
                editingProductId: editingProduct?.id,
                workshopSchedule: selectedType === 'workshop' ? workshopSchedule : null,
                workshopMaterial: selectedType === 'workshop' ? workshopMaterial : null,
                documentMaterial: selectedType === 'document' ? documentMaterial : null,
                objetivos: generalForm.objetivos,
                restricciones: generalForm.restricciones,
                location_name: generalForm.location_name,
                location_url: generalForm.location_url,
                workshop_mode: generalForm.workshop_mode,
                participants_per_class: generalForm.participants_per_class,
                semanas_totales: weeklyStats?.semanas || 0,
                sesiones_dias_totales: weeklyStats?.sesiones || 0,
                items_totales: weeklyStats?.ejerciciosTotales || 0,
                items_unicos: weeklyStats?.ejerciciosUnicos || 0,
            }

            console.log('🚀 [useProductSubmission] Submit Payload:', {
                weeklySchedulePreview: productData.weeklySchedule ? JSON.stringify(productData.weeklySchedule).substring(0, 200) : 'null',
                modality: productData.modality
            })

            const method = editingProduct ? 'PUT' : 'POST'
            const response = await fetch('/api/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            })

            const result = await response.json()
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al guardar el producto')
            }

            // 4. Handle bulk exercises/nutrition
            if (persistentCsvData && persistentCsvData.length > 0 && selectedType === 'program') {
                setPublishProgress('Guardando detalles...')
                const bulkEndpoint = productCategory === 'nutricion' ? '/api/activity-nutrition/bulk' : '/api/activities/exercises/bulk'
                await fetch(bulkEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        activityId: result.product?.id,
                        exercises: persistentCsvData
                    })
                })
            }

            toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado')
            onClose(true)
        } catch (error: any) {
            console.error('Error publishing product:', error)
            toast.error(error.message || 'Error al publicar')
        } finally {
            setIsPublishing(false)
            setPublishProgress('')
        }
    }

    const clearFieldError = (fieldName: string) => {
        setFieldErrors(prev => {
            const next = { ...prev }
            delete next[fieldName]
            return next
        })
    }

    return {
        isPublishing,
        setIsPublishing,
        publishProgress,
        setPublishProgress,
        validationErrors,
        fieldErrors,
        setValidationErrors,
        setFieldErrors,
        handlePublishProduct,
        clearFieldError
    }
}
