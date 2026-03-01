
export interface Client {
    id: string
    name: string
    email: string
    avatar_url?: string
    progress: number
    status: 'active' | 'inactive' | 'pending'
    lastActive: string
    totalRevenue: number
    activitiesCount: number
    itemsPending?: number
    todoCount?: number
    description?: string
    activities: Array<{
        id: number
        title: string
        type: string
        amountPaid: number
    }>
    hasAlert?: boolean
    alertLevel?: number
    alertLabel?: string
    age?: number
    absentDays?: number
    failedExercises?: number
    completedExercises?: number
    totalExercises?: number
    daysCompleted?: number
    daysTotal?: number
    streak?: number
    fitStats?: { completed: number; total: number; absent: number }
    nutriStats?: { completed: number; total: number; absent: number }
}
