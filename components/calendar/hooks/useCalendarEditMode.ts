
import { useState } from "react"
import { format } from "date-fns"
import { SupabaseClient } from "@supabase/supabase-js"

interface UseCalendarEditModeProps {
    supabase: SupabaseClient
    authUserId: string | null
    sourceDate: Date | null
    setSourceDate: (date: Date | null) => void
    targetDate: Date | null
    setTargetDate: (date: Date | null) => void
}

export function useCalendarEditMode({
    supabase,
    authUserId,
    sourceDate,
    setSourceDate,
    targetDate,
    setTargetDate
}: UseCalendarEditModeProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const toggleEditMode = () => {
        if (isEditing) {
            setIsEditing(false)
            setSourceDate(null)
            setTargetDate(null)
            setShowConfirmModal(false)
        } else {
            setIsEditing(true)
            setSourceDate(null)
            setTargetDate(null)
        }
    }

    const handleConfirmUpdate = async () => {
        if (!authUserId || !sourceDate || !targetDate) return

        setIsUpdating(true)
        try {
            const sourceStr = format(sourceDate, 'yyyy-MM-dd')
            const targetStr = format(targetDate, 'yyyy-MM-dd')

            const { error: errorProg } = await (supabase
                .from('progreso_cliente') as any)
                .update({ fecha: targetStr })
                .eq('cliente_id', authUserId)
                .eq('fecha', sourceStr)

            const { error: errorNut } = await (supabase
                .from('progreso_cliente_nutricion') as any)
                .update({ fecha: targetStr })
                .eq('cliente_id', authUserId)
                .eq('fecha', sourceStr)

            if (errorProg || errorNut) throw new Error('Error al mover actividades')

            if (applyToAllSameDays) {
                const { data: futureProgress } = await (supabase
                    .from('progreso_cliente') as any)
                    .select('id, fecha')
                    .eq('cliente_id', authUserId)
                    .gt('fecha', sourceStr)

                if (futureProgress && futureProgress.length > 0) {
                    const dayOfWeek = sourceDate.getDay()
                    const diffTime = targetDate.getTime() - sourceDate.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                    const updates = futureProgress.filter((item: any) => {
                        const d = new Date(item.fecha)
                        const dLocal = new Date(d.getTime() + (d.getTimezoneOffset() * 60000))
                        return dLocal.getDay() === dayOfWeek
                    }).map((item: any) => {
                        const d = new Date(item.fecha)
                        const newD = new Date(d.getTime() + (diffDays * 24 * 60 * 60 * 1000))
                        return {
                            id: item.id,
                            fecha: newD.toISOString().split('T')[0]
                        }
                    })

                    if (updates.length > 0) {
                        await (supabase.from('progreso_cliente') as any).upsert(updates)

                        const { data: futureNut } = await (supabase
                            .from('progreso_cliente_nutricion') as any)
                            .select('id, fecha')
                            .eq('cliente_id', authUserId)
                            .gt('fecha', sourceStr)

                        if (futureNut && futureNut.length > 0) {
                            const nutUpdates = futureNut.filter((item: any) => {
                                const d = new Date(item.fecha)
                                const dLocal = new Date(d.getTime() + (d.getTimezoneOffset() * 60000))
                                return dLocal.getDay() === dayOfWeek
                            }).map((item: any) => {
                                const d = new Date(item.fecha)
                                const newD = new Date(d.getTime() + (diffDays * 24 * 60 * 60 * 1000))
                                return {
                                    id: item.id,
                                    fecha: newD.toISOString().split('T')[0]
                                }
                            })
                            if (nutUpdates.length > 0) {
                                await (supabase.from('progreso_cliente_nutricion') as any).upsert(nutUpdates)
                            }
                        }
                    }
                }
            }

            setIsEditing(false)
            setSourceDate(null)
            setTargetDate(null)
            setShowConfirmModal(false)

            if (typeof window !== 'undefined') {
                window.location.reload()
            }

        } catch (error) {
            console.error('Error updating dates:', error)
            alert('Hubo un error al cambiar la fecha. Inténtalo de nuevo.')
        } finally {
            setIsUpdating(false)
        }
    }

    const getDayName = (dayIndex: number) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        return days[dayIndex] || ''
    }

    return {
        isEditing,
        setIsEditing,
        toggleEditMode,
        showConfirmModal,
        setShowConfirmModal,
        applyToAllSameDays,
        setApplyToAllSameDays,
        isUpdating,
        handleConfirmUpdate,
        getDayName
    }
}
