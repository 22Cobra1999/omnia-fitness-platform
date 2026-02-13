import { TimeBlock } from "../types"

export const generateDatesFromConfig = (block: Partial<TimeBlock>): Date[] => {
    if (!block.selectedWeekDays || block.selectedWeekDays.length === 0 || !block.startDate || !block.endDate) {
        return []
    }

    const dates: Date[] = []
    const startDate = new Date(block.startDate)
    const endDate = new Date(block.endDate)
    const currentDate = new Date(startDate)

    const dayMapping: { [key: string]: number } = {
        'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
    }

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()

        for (const dayKey of block.selectedWeekDays) {
            if (dayMapping[dayKey] === dayOfWeek) {
                dates.push(new Date(currentDate))
                break
            }
        }

        currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
}

export const getDayMapping = (dayKey: string): number => {
    const dayMapping: { [key: string]: number } = {
        'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
    }
    return dayMapping[dayKey]
}
