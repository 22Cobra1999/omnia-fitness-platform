import { useState, useEffect } from "react"

export interface TimeSlot {
    id: string
    dates: string[]
    startTime: string
    endTime: string
    duration: number
}

export interface WorkshopSession {
    title?: string
    description?: string
    date: string
    startTime: string
    endTime: string
    duration: number
}

interface UseWorkshopSchedulerLogicProps {
    sessions: WorkshopSession[]
    onSessionsChange: (sessions: WorkshopSession[]) => void
}

export function useWorkshopSchedulerLogic({ sessions, onSessionsChange }: UseWorkshopSchedulerLogicProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

    // Estados del tema
    const [topicTitle, setTopicTitle] = useState("")
    const [topicDescription, setTopicDescription] = useState("")

    // Horarios
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

    // Estados de edición
    const [currentStartTime, setCurrentStartTime] = useState("10:00")
    const [currentEndTime, setCurrentEndTime] = useState("12:00")
    const [editingTime, setEditingTime] = useState(false)

    // Estado para mostrar resumen del tema
    const [showSummary, setShowSummary] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [finishedTopic, setFinishedTopic] = useState<{
        title: string
        description: string
        timeSlots: TimeSlot[]
    } | null>(null)

    // Estado para controlar si estamos editando un tema existente
    const [isEditingExistingTopic, setIsEditingExistingTopic] = useState(false)
    const [originalSessionsBackup, setOriginalSessionsBackup] = useState<WorkshopSession[]>([])

    const isInEditorMode =
        editingTime ||
        isEditingExistingTopic ||
        Boolean(topicTitle.trim()) ||
        selectedDates.size > 0 ||
        timeSlots.length > 0

    // Función para convertir Date a string YYYY-MM-DD en zona horaria local
    const formatDateToLocalString = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Helper para parsear fecha YYYY-MM-DD sin desfase horario
    const parseDateSafe = (dateStr: string) => {
        if (!dateStr) return new Date()
        // Si viene en formato YYYY-MM-DD
        if (dateStr.includes('-') && dateStr.split('-').length === 3) {
            const [year, month, day] = dateStr.split('-').map(Number)
            return new Date(year, month - 1, day)
        }
        return new Date(dateStr)
    }

    const getTotalHoursForDate = (dateString: string) => {
        let totalHours = 0

        // Contar horas de sesiones actuales
        timeSlots.forEach(slot => {
            if (slot.dates.includes(dateString)) {
                totalHours += slot.duration
            }
        })

        // Contar horas de temas finalizados
        if (finishedTopic) {
            finishedTopic.timeSlots.forEach(slot => {
                if (slot.dates.includes(dateString)) {
                    totalHours += slot.duration
                }
            })
        }

        // Contar horas de sesiones ya guardadas (prop sessions)
        sessions.forEach(s => {
            const sessionDate = s.date && s.date.includes('T') ? s.date.split('T')[0] : s.date
            if (sessionDate === dateString) {
                totalHours += (Number(s.duration) || 0)
            }
        })

        return Math.round(totalHours * 10) / 10
    }

    // Obtener días del mes actual
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Días del mes anterior
        const prevMonth = new Date(year, month - 1, 0)
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
                totalHours: 0
            })
        }

        // Días del mes actual
        const today = new Date()
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dateString = formatDateToLocalString(date)
            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.toDateString() === today.toDateString(),
                isSelected: selectedDates.has(dateString),
                totalHours: getTotalHoursForDate(dateString)
            })
        }

        // Días del próximo mes
        const remainingDays = 42 - days.length
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: new Date(year, month + 1, day),
                isCurrentMonth: false,
                isToday: false,
                isSelected: false,
                totalHours: 0
            })
        }

        return days
    }

    const handleDateClick = (day: any) => {
        if (!day || !day.isCurrentMonth || !day.date) return

        const dateString = formatDateToLocalString(day.date)

        if (selectedDates.has(dateString)) {
            setSelectedDates(prev => {
                const newSet = new Set(prev)
                newSet.delete(dateString)
                return newSet
            })
        } else {
            setSelectedDates(prev => new Set([...prev, dateString]))
        }
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev)
            if (direction === 'prev') {
                newMonth.setMonth(newMonth.getMonth() - 1)
            } else {
                newMonth.setMonth(newMonth.getMonth() + 1)
            }
            return newMonth
        })
    }

    const calculateDuration = (startTime: string, endTime: string) => {
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        const diffMinutes = endMinutes - startMinutes
        return Math.round((diffMinutes / 60) * 10) / 10
    }

    const handleAddTimeSlot = () => {
        if (selectedDates.size === 0) return

        const duration = calculateDuration(currentStartTime, currentEndTime)
        if (!Number.isFinite(duration) || duration <= 0) return

        const newSlot: TimeSlot = {
            id: Date.now().toString(),
            dates: Array.from(selectedDates),
            startTime: currentStartTime,
            endTime: currentEndTime,
            duration
        }

        setTimeSlots(prev => [...prev, newSlot])
    }

    const handleRemoveTimeSlotDate = (id: string, dateToRemove: string) => {
        setTimeSlots(prev =>
            prev
                .map(slot => {
                    if (slot.id !== id) return slot
                    const nextDates = slot.dates.filter(d => d !== dateToRemove)
                    return { ...slot, dates: nextDates }
                })
                .filter(slot => slot.dates.length > 0)
        )
    }

    const formatDateShort = (date: string) => {
        if (!date) return ''
        const d = parseDateSafe(date)
        const day = d.getDate().toString().padStart(2, '0')
        const month = (d.getMonth() + 1).toString().padStart(2, '0')
        const year = d.getFullYear().toString().slice(-2)
        return `${day}/${month}/${year}`
    }

    const isPastDate = (dateString: string) => {
        const d = new Date(dateString)
        d.setHours(0, 0, 0, 0)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return d < now
    }

    const getTopicSummary = () => {
        if (!finishedTopic) return { totalDays: 0, totalHours: 0 }

        const allDates = new Set<string>()
        let totalHours = 0

        finishedTopic.timeSlots.forEach(slot => {
            slot.dates.forEach(date => allDates.add(date))
            totalHours += slot.duration * slot.dates.length
        })

        return {
            totalDays: allDates.size,
            totalHours: Math.round(totalHours * 10) / 10
        }
    }

    const handleFinishTopic = () => {
        if (topicTitle.trim() && timeSlots.length > 0) {
            const newSessions: WorkshopSession[] = []

            timeSlots.forEach(slot => {
                slot.dates.forEach(date => {
                    newSessions.push({
                        title: topicTitle,
                        description: topicDescription,
                        date: date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        duration: slot.duration
                    })
                })
            })

            onSessionsChange([...sessions, ...newSessions])

            setFinishedTopic(null)
            setShowSummary(false)
            setTopicTitle("")
            setTopicDescription("")
            setTimeSlots([])
            setSelectedDates(new Set())
            setEditingTime(false)
            setCurrentStartTime("10:00")
            setCurrentEndTime("12:00")
            setIsEditingExistingTopic(false)
            setOriginalSessionsBackup([])
        }
    }

    const handleEditTopic = () => {
        setShowSummary(false)
    }

    const handleDeleteTopic = () => {
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = () => {
        setFinishedTopic(null)
        setShowSummary(false)
        setShowDeleteConfirm(false)
    }

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false)
    }

    const getGroupedSessions = () => {
        const grouped = new Map<string, {
            title: string
            description: string
            sessions: WorkshopSession[]
            totalHours: number
            allDates: string[]
        }>()

        sessions.forEach(session => {
            const key = session.title || 'Sin título'
            if (!grouped.has(key)) {
                grouped.set(key, {
                    title: session.title || 'Sin título',
                    description: session.description || '',
                    sessions: [],
                    totalHours: 0,
                    allDates: []
                })
            }

            const group = grouped.get(key)!
            group.sessions.push(session)
            group.totalHours += session.duration

            if (!group.allDates.includes(session.date)) {
                group.allDates.push(session.date)
            }
        })

        return Array.from(grouped.values())
    }

    const handleDeleteGroupedTopic = (topicTitle: string) => {
        const newSessions = sessions.filter(session => session.title !== topicTitle)
        onSessionsChange(newSessions)
    }

    const handleEditGroupedTopic = (topicTitle: string) => {
        const topicSessions = sessions.filter(session => session.title === topicTitle)
        if (topicSessions.length === 0) return

        setOriginalSessionsBackup([...sessions])
        setIsEditingExistingTopic(true)

        const firstSession = topicSessions[0]
        setTopicTitle(firstSession.title || '')
        setTopicDescription(firstSession.description || '')

        const otherSessions = sessions.filter(session => session.title !== topicTitle)
        onSessionsChange(otherSessions)

        const allSlots = new Map<string, TimeSlot>()

        topicSessions.forEach(session => {
            const slotKey = `${session.startTime}-${session.endTime}`
            if (allSlots.has(slotKey)) {
                allSlots.get(slotKey)!.dates.push(session.date)
            } else {
                allSlots.set(slotKey, {
                    id: Date.now().toString() + Math.random(),
                    dates: [session.date],
                    startTime: session.startTime,
                    endTime: session.endTime,
                    duration: session.duration
                })
            }
        })

        const timeSlotsArray = Array.from(allSlots.values()).map(slot => ({
            ...slot,
            dates: slot.dates.sort()
        }))

        setTimeSlots(timeSlotsArray)
        setSelectedDates(new Set())
        setEditingTime(true)
        setCurrentStartTime("10:00")
        setCurrentEndTime("12:00")
        setShowSummary(false)
        setFinishedTopic(null)
    }

    const handleCancelEdit = () => {
        onSessionsChange(originalSessionsBackup)
        setTopicTitle("")
        setTopicDescription("")
        setTimeSlots([])
        setSelectedDates(new Set())
        setEditingTime(true)
        setCurrentStartTime("10:00")
        setCurrentEndTime("12:00")
        setShowSummary(false)
        setFinishedTopic(null)
        setIsEditingExistingTopic(false)
        setOriginalSessionsBackup([])
    }

    return {
        currentMonth,
        setCurrentMonth,
        selectedDates,
        setSelectedDates,
        topicTitle,
        setTopicTitle,
        topicDescription,
        setTopicDescription,
        timeSlots,
        setTimeSlots,
        currentStartTime,
        setCurrentStartTime,
        currentEndTime,
        setCurrentEndTime,
        editingTime,
        setEditingTime,
        showSummary,
        setShowSummary,
        showDeleteConfirm,
        setShowDeleteConfirm,
        finishedTopic,
        isEditingExistingTopic,
        isInEditorMode,
        getDaysInMonth,
        handleDateClick,
        navigateMonth,
        handleAddTimeSlot,
        handleRemoveTimeSlotDate,
        formatDateShort,
        isPastDate,
        getTopicSummary,
        handleFinishTopic,
        handleEditTopic,
        handleDeleteTopic,
        handleConfirmDelete,
        handleCancelDelete,
        getGroupedSessions,
        handleDeleteGroupedTopic,
        handleEditGroupedTopic,
        handleCancelEdit
    }
}
