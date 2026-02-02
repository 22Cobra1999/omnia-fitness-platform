import { useState, useCallback } from 'react'

export function useCalendarNavigation() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [showMonthPicker, setShowMonthPicker] = useState(false)
    const [monthPickerYear, setMonthPickerYear] = useState<number>(() => new Date().getFullYear())

    const goToPreviousMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }, [])

    const goToNextMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }, [])

    const toggleMonthPicker = useCallback(() => {
        setMonthPickerYear(currentDate.getFullYear())
        setShowMonthPicker(prev => !prev)
    }, [currentDate])

    const handleSelectMonth = useCallback((monthIndex: number) => {
        setCurrentDate(new Date(monthPickerYear, monthIndex, 1))
        setShowMonthPicker(false)
    }, [monthPickerYear])

    const generateCalendarDays = useCallback(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())

        const days = []
        const currentDay = new Date(startDate)

        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDay))
            currentDay.setDate(currentDay.getDate() + 1)
        }

        return days
    }, [currentDate])

    return {
        currentDate,
        setCurrentDate,
        showMonthPicker,
        setShowMonthPicker,
        monthPickerYear,
        setMonthPickerYear,
        goToPreviousMonth,
        goToNextMonth,
        toggleMonthPicker,
        handleSelectMonth,
        generateCalendarDays
    }
}
