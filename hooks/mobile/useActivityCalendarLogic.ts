"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientMetrics } from '@/hooks/client/use-client-metrics'
import { createSupabaseClient } from "@/lib/supabase/supabase-client"
import { DayData } from "../../components/mobile/calendar/types"

export function useActivityCalendarLogic(userId?: string) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [activityFilter, setActivityFilter] = useState<'fitness' | 'nutricion'>('fitness')
    const { weeklyData, loading, refetch } = useClientMetrics(userId, activityFilter, currentDate)
    const [monthlyData, setMonthlyData] = useState<DayData[]>([])

    // Edit Mode States
    const [isEditing, setIsEditing] = useState(false)
    const [sourceDate, setSourceDate] = useState<Date | null>(null)
    const [targetDate, setTargetDate] = useState<Date | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [applyToAllSameDays, setApplyToAllSameDays] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const supabase = createSupabaseClient()

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    const dayNames = ["D", "L", "M", "M", "J", "V", "S"]
    const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    const getDayName = (dayIndex: number) => {
        return dayNamesFull[dayIndex] || ''
    }

    // Effect to refetch when filters change
    useEffect(() => {
        if (userId) {
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth()
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)

            const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
            const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

            refetch(startStr, endStr)
        }
    }, [userId, currentDate, activityFilter, refetch])

    // Effect to build monthly grid
    useEffect(() => {
        if (weeklyData) {
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth()
            const daysInMonth = new Date(year, month + 1, 0).getDate()
            const firstDayOfMonth = new Date(year, month, 1).getDay()

            const days: DayData[] = []

            // Fill empty days at start
            for (let i = 0; i < firstDayOfMonth; i++) {
                days.push({
                    date: "",
                    day: 0,
                    kcal: 0,
                    minutes: 0,
                    exercises: 0,
                    kcalTarget: 500,
                    minutesTarget: 60,
                    exercisesTarget: 3
                })
            }

            // Map real data
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayData = weeklyData.find(d => d.date === dateStr)

                days.push({
                    date: dateStr,
                    day,
                    kcal: dayData?.kcal || 0,
                    minutes: dayData?.minutes || 0,
                    exercises: dayData?.exercises || 0,
                    kcalTarget: dayData?.kcalTarget || 500,
                    minutesTarget: dayData?.minutesTarget || 60,
                    exercisesTarget: dayData?.target || 3
                })
            }

            setMonthlyData(days)
        }
    }, [weeklyData, currentDate])

    const goToPreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

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

    const handleDayClick = (dateStr: string) => {
        if (!isEditing || !dateStr) return

        const [y, m, d] = dateStr.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)

        if (!sourceDate) {
            setSourceDate(dateObj)
        } else {
            setTargetDate(dateObj)
            setShowConfirmModal(true)
        }
    }

    const handleConfirmUpdate = async () => {
        if (!userId || !sourceDate || !targetDate) return

        setIsUpdating(true)
        try {
            const sourceStr = sourceDate.toISOString().split('T')[0]
            const targetStr = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

            const { error: errorProg } = await (supabase
                .from('progreso_cliente') as any)
                .update({ fecha: targetStr })
                .eq('cliente_id', userId)
                .eq('fecha', sourceStr)

            const { error: errorNut } = await (supabase
                .from('progreso_cliente_nutricion') as any)
                .update({ fecha: targetStr })
                .eq('cliente_id', userId)
                .eq('fecha', sourceStr)

            if (errorProg || errorNut) throw new Error('Error al mover actividades')

            if (applyToAllSameDays) {
                const { data: futureProgress } = await supabase
                    .from('progreso_cliente')
                    .select('id, fecha')
                    .eq('cliente_id', userId)
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

                        const { data: futureNut } = await supabase
                            .from('progreso_cliente_nutricion')
                            .select('id, fecha')
                            .eq('cliente_id', userId)
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

            // Force refetch and maybe page reload if needed
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

    return {
        currentDate,
        activityFilter,
        setActivityFilter,
        loading,
        monthlyData,
        monthNames,
        dayNames,
        isEditing,
        toggleEditMode,
        sourceDate,
        targetDate,
        showConfirmModal,
        setShowConfirmModal,
        applyToAllSameDays,
        setApplyToAllSameDays,
        isUpdating,
        goToPreviousMonth,
        goToNextMonth,
        handleDayClick,
        handleConfirmUpdate,
        getDayName // Exposed helper
    }
}
