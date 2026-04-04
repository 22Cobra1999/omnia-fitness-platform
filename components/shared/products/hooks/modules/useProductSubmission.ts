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
    mediaUploadUrl: string | null
    isMediaUploading: boolean
    planType: PlanType
    onClose: (refresh?: boolean) => void
    setCurrentStep: (step: any) => void
}

export function useProductSubmission() {
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishProgress, setPublishProgress] = useState('')
    const [publishPercentage, setPublishPercentage] = useState(0)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({})

    const cleanScheduleForSubmission = (schedule: any) => {
        if (!schedule || typeof schedule !== 'object') return null
        const cleaned: any = {}
        
        Object.entries(schedule).forEach(([weekNum, weekData]: [string, any]) => {
            cleaned[weekNum] = {}
            Object.entries(weekData).forEach(([dayKey, dayContent]: [string, any]) => {
                if (!dayContent || !dayContent.ejercicios) return
                
                cleaned[weekNum][dayKey] = {
                    blockCount: dayContent.blockCount,
                    blockNames: dayContent.blockNames,
                    ejercicios: (dayContent.ejercicios || []).map((ex: any) => {
                        const item: any = {
                            id: ex.id,
                            orden: ex.orden || ex.order || 1,
                            bloque: ex.bloque || ex.block || 1
                        }
                        // Only keep essential variables that might have been changed/personalized
                        if (ex.series) item.series = String(ex.series)
                        if (ex.reps) item.reps = String(ex.reps)
                        if (ex.peso) item.peso = String(ex.peso)
                        if (ex.detalle_series) item.detalle_series = String(ex.detalle_series)
                        if (ex.notas_coach) item.notas_coach = String(ex.notas_coach)
                        if (ex.calorias || ex.calories) item.calorias = Number(ex.calorias || ex.calories || 0)
                        if (ex.proteinas) item.proteinas = Number(ex.proteinas || 0)
                        if (ex.carbohidratos) item.carbohidratos = Number(ex.carbohidratos || 0)
                        if (ex.grasas) item.grasas = Number(ex.grasas || 0)
                        if (ex.minutos || ex.duration) item.minutos = Number(ex.minutos || ex.duration || 0)
                        return item
                    }).filter((ex: any) => ex.id !== undefined && ex.id !== null)
                }
            })
        })
        return cleaned
    }

    const handlePublishProduct = async (params: SubmitProductParams) => {
        const {
            generalForm, selectedType, productCategory, user, editingProduct,
            persistentCsvData, persistentCalendarSchedule, periods, workshopSchedule,
            workshopMaterial, documentMaterial, weeklyStats, pendingImageFile, pendingVideoFile,
            mediaUploadUrl, isMediaUploading,
            planType, onClose, setCurrentStep, specificForm
        } = params

        if (isPublishing) return

        setIsPublishing(true)
        setPublishProgress('Validando datos...')
        setPublishPercentage(5)
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
                setPublishPercentage(0)
                return
            }

            setPublishProgress('Preparando archivos...')
            setPublishPercentage(10)

            // 1. Wait for Background Upload if in progress
            let finalImageUrl = (generalForm.image && 'url' in generalForm.image) ? generalForm.image.url : null
            let finalVideoUrl = generalForm.videoUrl || null
            let finalVideoMetadata = {
                bunny_video_id: null,
                bunny_library_id: null,
                video_thumbnail_url: null,
                video_file_name: null
            }
            
            // Sync with background upload result
            if (mediaUploadUrl) {
                if (pendingVideoFile) finalVideoUrl = mediaUploadUrl
                if (pendingImageFile) finalImageUrl = mediaUploadUrl
            }

            // 2. Fallback Upload (only if background failed or wasn't even triggered)
            const isLocalImage = finalImageUrl && finalImageUrl.startsWith('blob:')
            if (pendingImageFile || isLocalImage) {
                if (finalImageUrl && !finalImageUrl.startsWith('blob:')) {
                    // Already uploaded in background or from gallery
                    setPublishPercentage(40)
                } else {
                    setPublishProgress('Subiendo imagen...')
                    setPublishPercentage(30)
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
                        }
                    } catch (e) {
                        console.error('Image fallback upload failed', e)
                    }
                    setPublishPercentage(45)
                }
            }

            if (pendingVideoFile && (finalVideoUrl?.startsWith('blob:') || !finalVideoUrl)) {
                setPublishProgress('Subiendo video...')
                setPublishPercentage(60)
                const formData = new FormData()
                formData.append('file', pendingVideoFile)
                formData.append('title', pendingVideoFile.name)
                const res = await fetch('/api/bunny/upload-video', { method: 'POST', body: formData })
                const data = await res.json()
                if (res.ok && data.success) {
                    finalVideoUrl = data.streamUrl
                    finalVideoMetadata = {
                        bunny_video_id: data.videoId,
                        bunny_library_id: data.libraryId,
                        video_thumbnail_url: data.thumbnailUrl,
                        video_file_name: data.fileName
                    }
                }
                setPublishPercentage(75)
            }

            if (typeof finalVideoUrl === 'string' && (finalVideoUrl.trim() === '' || finalVideoUrl.startsWith('blob:'))) finalVideoUrl = null
            if (typeof finalImageUrl === 'string' && (finalImageUrl.trim() === '' || finalImageUrl.startsWith('blob:'))) finalImageUrl = null

            setPublishProgress('Finalizando publicación...')
            setPublishPercentage(85)

            // 3. Prepare product data - CLEANED SCHEDULE
            const capacityRaw = parseInt(generalForm.stockQuantity)
            const parsedCapacity = Number.isFinite(capacityRaw) ? Math.max(1, capacityRaw) : 1
            const capacity = generalForm.capacity === 'ilimitada' ? 0 : parsedCapacity

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
                coach_id: user?.id,
                image_url: finalImageUrl,
                video_url: finalVideoUrl,
                ...finalVideoMetadata,
                // csvData is NOT sent to backend (not used and makes payload huge)
                // USE CLEANED SCHEDULE
                weeklySchedule: cleanScheduleForSubmission(persistentCalendarSchedule),
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

            console.log("💾 [useProductSubmission] Final Product Data Save:", JSON.stringify({
                ...productData,
                weeklySchedule: '[REDACTED_FOR_LOGS]',
                workshopSchedule: productData.workshopSchedule ? '[REDACTED_FOR_LOGS]' : null
            }, null, 2))

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

            setPublishPercentage(100)
            setPublishProgress('¡Éxito!')

            // 4. Handle bulk exercises/nutrition (if any)
            if (persistentCsvData && persistentCsvData.length > 0 && selectedType === 'program') {
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
            setPublishPercentage(0)
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
        publishPercentage,
        setPublishProgress,
        validationErrors,
        fieldErrors,
        setValidationErrors,
        setFieldErrors,
        handlePublishProduct,
        clearFieldError
    }
}
