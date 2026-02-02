import { ExerciseExecution, DayData } from '../types'

export const formatMinutesCompact = (totalMinutes: number | null | undefined): string => {
    const mins = Number(totalMinutes || 0)
    if (!Number.isFinite(mins) || mins <= 0) return ''
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
}

export const getExerciseMinutes = (ex: ExerciseExecution): number => {
    const minsFromFitness = Number(ex.duracion ?? 0) || 0
    const minsFromNutri = Number(ex.nutricion_macros?.minutos ?? 0) || 0
    const mins = Math.max(minsFromFitness, minsFromNutri)
    return mins > 0 ? mins : 0
}

export const getMonthRange = (currentDate: Date) => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const monthStartStr = monthStart.toISOString().split('T')[0]
    const monthEndStr = monthEnd.toISOString().split('T')[0]
    return { monthStart, monthEnd, monthStartStr, monthEndStr }
}

export const calculateLastWorkoutDate = (data: { [key: string]: DayData }): string | null => {
    const dates = Object.keys(data).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    for (const date of dates) {
        const dayData = data[date]
        if (dayData.completedCount > 0) {
            const dateObj = new Date(date)
            return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
        }
    }
    return null
}

export const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: '2-digit',
        month: 'short',
        day: 'numeric'
    })
}

export const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
}

export const getDayNamePlural = (dayOfWeek: number) => {
    const days = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados']
    return days[dayOfWeek]
}

export const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
