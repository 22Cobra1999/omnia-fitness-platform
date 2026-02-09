
export interface Client {
    id: string
    name: string
    email: string
    avatar_url?: string
    progress: number
    status: 'active' | 'inactive' | 'pending'
    lastActive: string
    totalExercises: number
    completedExercises: number
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
}
