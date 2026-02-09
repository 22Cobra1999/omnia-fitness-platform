import { useState, useEffect, useMemo } from 'react'
import { GeneralFormState, ProductType, PlanType } from '../../product-constants'
import { getPlanLimit } from '@/lib/utils/plan-limits'
import { toast } from 'sonner'

export function useGeneralProductForm(
    editingProduct: any,
    selectedType: ProductType | null,
    productCategory: 'fitness' | 'nutricion',
    planType: PlanType
) {
    const [generalForm, setGeneralForm] = useState<GeneralFormState>({
        name: '',
        description: '',
        price: '',
        image: null,
        videoUrl: '',
        modality: 'online',
        included_meet_credits: 0,
        is_public: false,
        objetivos: [],
        restricciones: [],
        capacity: 'ilimitada',
        stockQuantity: '0',
        dietType: '',
        dias_acceso: 30,
        location_name: '',
        location_url: '',
        workshop_mode: 'grupal',
        participants_per_class: undefined,
        duration_value: '',
        duration_unit: 'semanas'
    })

    const splitSemicolonList = (val: any): string[] => {
        if (!val) return []
        if (Array.isArray(val)) return val
        return String(val).split(';').map(s => s.trim()).filter(Boolean)
    }

    // Initialize from editingProduct
    useEffect(() => {
        if (editingProduct) {
            const stockQuantity = editingProduct.capacity?.toString() || ''

            setGeneralForm(prev => ({
                ...prev,
                name: editingProduct.title || editingProduct.name || '',
                description: editingProduct.description || '',
                price: editingProduct.price?.toString() || '',
                image: editingProduct.image_url ? { url: editingProduct.image_url } : null,
                videoUrl: editingProduct.video_url || '',
                modality: editingProduct.type === 'program' ? 'online' : (editingProduct.type || 'online'),
                included_meet_credits: editingProduct.included_meet_credits || 0,
                is_public: editingProduct.is_public !== false,
                objetivos: splitSemicolonList(editingProduct.objetivos),
                restricciones: splitSemicolonList(editingProduct.restricciones),
                capacity: editingProduct.capacity ? 'limitada' : 'ilimitada',
                stockQuantity: stockQuantity,
                dietType: editingProduct.diet_type || '',
                dias_acceso: editingProduct.dias_acceso || 30,
                location_name: editingProduct.location_name || '',
                location_url: editingProduct.location_url || '',
                workshop_mode: editingProduct.workshop_mode || 'grupal',
                participants_per_class: editingProduct.participants_per_class,
                duration_value: editingProduct.semanas_totales?.toString() || '',
                duration_unit: 'semanas'
            }))
        }
    }, [editingProduct])

    const handlePriceChange = (rawValue: string) => {
        let value = rawValue.replace(/[^0-9.,]/g, '')
        value = value.replace(',', '.')
        const [integerPart, ...decimalParts] = value.split('.')
        let normalized = integerPart
        if (decimalParts.length > 0) {
            const decimals = decimalParts.join('').slice(0, 2)
            normalized += `.${decimals}`
        }
        setGeneralForm(prev => ({ ...prev, price: normalized }))
    }

    const handlePriceBlur = () => {
        if (!generalForm.price) return
        const normalized = generalForm.price.replace(',', '.')
        const parsed = parseFloat(normalized)
        if (Number.isNaN(parsed)) {
            setGeneralForm(prev => ({ ...prev, price: '' }))
            return
        }
        setGeneralForm(prev => ({ ...prev, price: parsed.toFixed(2) }))
    }

    const handleStockQuantityChange = (rawValue: string) => {
        const limitByPlan = getPlanLimit(planType, 'stockPerProduct')
        const numericOnly = rawValue.replace(/\D/g, '')
        if (numericOnly === '') {
            setGeneralForm(prev => ({ ...prev, stockQuantity: '' }))
            return
        }
        let parsed = parseInt(numericOnly, 10)
        if (Number.isNaN(parsed)) {
            setGeneralForm(prev => ({ ...prev, stockQuantity: '' }))
            return
        }
        if (parsed > limitByPlan) {
            parsed = limitByPlan
            toast.info(`Límite de cupos por producto en tu plan: ${limitByPlan}`)
        }
        setGeneralForm(prev => ({ ...prev, stockQuantity: parsed.toString() }))
    }

    const addObjetivo = (value: string) => {
        const v = String(value || '').trim()
        if (!v) return
        setGeneralForm(prev => {
            if (prev.objetivos.includes(v)) return prev
            return { ...prev, objetivos: [...prev.objetivos, v] }
        })
    }

    const removeObjetivo = (val: string) => {
        setGeneralForm(prev => ({ ...prev, objetivos: prev.objetivos.filter(o => o !== val) }))
    }

    const addRestriccion = (value: string) => {
        const v = String(value || '').trim()
        if (!v) return
        setGeneralForm(prev => {
            if (prev.restricciones.includes(v)) return prev
            return { ...prev, restricciones: [...prev.restricciones, v] }
        })
    }

    const removeRestriccion = (val: string) => {
        setGeneralForm(prev => ({ ...prev, restricciones: prev.restricciones.filter(r => r !== val) }))
    }


    return {
        generalForm,
        setGeneralForm,
        handlePriceChange,
        handlePriceBlur,
        handleStockQuantityChange,
        addObjetivo,
        removeObjetivo,
        addRestriccion,
        removeRestriccion
    }
}
