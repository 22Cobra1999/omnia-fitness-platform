export interface TimeBlock {
    id: string
    name: string
    startTime: string
    endTime: string
    startDate: string
    endDate: string
    color: string
    selectedDates: Date[]
    repeatType: 'days' | 'weeks' | 'months'
    repeatValues: number[] | string[]
    selectedWeekDays: string[]
    selectedWeeks: number[]
    selectedMonths: string[]
}

export interface WorkshopScheduleManagerProps {
    onScheduleChange: (blocks: TimeBlock[]) => void
    initialBlocks?: TimeBlock[]
    existingActivities?: TimeBlock[]
}

export const blockColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500'
]

export const weekDays = [
    { key: 'Lun', label: 'Lunes' },
    { key: 'Mar', label: 'Martes' },
    { key: 'Mié', label: 'Miércoles' },
    { key: 'Jue', label: 'Jueves' },
    { key: 'Vie', label: 'Viernes' },
    { key: 'Sáb', label: 'Sábado' },
    { key: 'Dom', label: 'Domingo' }
]
