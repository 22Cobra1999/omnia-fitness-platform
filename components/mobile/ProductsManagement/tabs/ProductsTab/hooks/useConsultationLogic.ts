import { useState, useCallback } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { toast } from "sonner"
import { ConsultationConfig, ConsultationSales } from "../../../types"

export function useConsultationLogic(userId: string | undefined) {
    const [consultations, setConsultations] = useState<Record<string, ConsultationConfig>>({
        express: { active: false, price: 0, time: 15, name: 'Express', icon: 1 },
        puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual', icon: 2 },
        profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda', icon: 3 }
    })
    const [isCafeModalOpen, setIsCafeModalOpen] = useState(false)
    const [isTogglingConsultation, setIsTogglingConsultation] = useState<string | null>(null)
    const [consultationSales, setConsultationSales] = useState<ConsultationSales>({
        express: [],
        puntual: [],
        profunda: []
    })
    const [pendingConsultations, setPendingConsultations] = useState<any[]>([])
    const [consultationError, setConsultationError] = useState<string | null>(null)
    const [coachPhone, setCoachPhone] = useState('')

    const fetchCafeConsultation = useCallback(async () => {
        if (!userId) return
        console.log("📡 [ConsultationLogic] Fetching coach session config...")
        try {
            const supabase = createClient()
            const { data: coach, error } = await supabase
                .from('coaches')
                .select('cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled, phone')
                .eq('id', userId)
                .single()

            if (!error && coach) {
                setConsultations({
                    express: { active: coach.cafe_enabled || false, price: coach.cafe || 0, time: 15, name: 'Express', icon: 1 },
                    puntual: { active: coach.meet_30_enabled || false, price: coach.meet_30 || 0, time: 30, name: 'Consulta puntual', icon: 2 },
                    profunda: { active: coach.meet_1_enabled || false, price: coach.meet_1 || 0, time: 60, name: 'Sesión profunda', icon: 3 }
                })
                if (coach.phone) {
                    setCoachPhone(coach.phone)
                }
            }
        } catch (error) {
            console.error('Error fetching consultations:', error)
        }
    }, [userId])

    const toggleConsultation = async (type: string) => {
        if (isTogglingConsultation || !userId) return
        setIsTogglingConsultation(type)
        setConsultationError(null)

        const newState = !consultations[type].active
        if (newState && consultations[type].price === 0) {
            setConsultationError('Configura un precio mayor a 0 para activar la consulta')
            setIsTogglingConsultation(null)
            return
        }

        try {
            const supabase = createClient()
            let enabledField = type === 'express' ? 'cafe_enabled' : type === 'puntual' ? 'meet_30_enabled' : 'meet_1_enabled'

            const { error } = await supabase
                .from('coaches')
                .update({ [enabledField]: newState })
                .eq('id', userId)

            if (!error) {
                setConsultations(prev => ({ ...prev, [type]: { ...prev[type], active: newState } }))
                toast.success(newState ? 'Activada' : 'Desactivada')
            }
        } catch (error) {
            toast.error('Error al actualizar')
        } finally {
            setIsTogglingConsultation(null)
        }
    }

    const updateConsultationPrice = async (type: string, price: number) => {
        if (!userId) return
        try {
            const supabase = createClient()
            let priceField = type === 'express' ? 'cafe' : type === 'puntual' ? 'meet_30' : 'meet_1'
            const { error } = await supabase.from('coaches').update({ [priceField]: price }).eq('id', userId)
            if (!error) {
                setConsultations(prev => ({ ...prev, [type]: { ...prev[type], price } }))
                toast.success('Precio actualizado')
            }
        } catch (error) {
            toast.error('Error al actualizar precio')
        }
    }

    return {
        state: {
            consultations,
            isCafeModalOpen,
            consultationSales,
            pendingConsultations,
            consultationError,
            isTogglingConsultation,
            coachPhone
        },
        actions: {
            setIsCafeModalOpen,
            setConsultations,
            setConsultationError,
            fetchCafeConsultation,
            toggleConsultation,
            updateConsultationPrice
        }
    }
}
