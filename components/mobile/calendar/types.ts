export interface DayData {
    date: string
    day: number
    kcal: number
    minutes: number
    exercises: number
    kcalTarget: number
    minutesTarget: number
    exercisesTarget: number
}

// ... other types related to the calendar props
export interface ActivityCalendarProps {
    userId?: string
}
