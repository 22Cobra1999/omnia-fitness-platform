import { Enrollment } from "@/types/activity"

export function getCategoryFromType(type: string | null): string {
    if (!type) return "otros"
    const t = type.toLowerCase()
    if (t.includes("nutri")) return "nutricion"
    if (t.includes("fitness") || t.includes("entrena")) return "fitness"
    if (t.includes("yoga")) return "yoga"
    return "otros"
}

export function calculateEnrollmentStatus(enrollment: Enrollment, progress: number = 0): 'expirada' | 'finalizada' | 'activa' | 'pendiente' {
    if (enrollment.status === 'cancelled') return 'expirada'

    const now = new Date()
    now.setHours(0, 0, 0, 0) // Normalize today

    // 1. Check for Document Completion (100% progress)
    const isDocument = enrollment.activity.type?.toLowerCase().includes('document') ||
        enrollment.activity.type?.toLowerCase().includes('documento');

    if (isDocument && progress >= 100) {
        return 'finalizada';
    }

    // 2. Expiration (Absolute Access End)
    if (enrollment.expiration_date) {
        const expirationDate = new Date(enrollment.expiration_date)
        expirationDate.setHours(0, 0, 0, 0)
        if (now > expirationDate) return 'expirada'
    }

    // 3. Program Completion (Content End)
    if (enrollment.program_end_date) {
        const endDate = new Date(enrollment.program_end_date)
        endDate.setHours(0, 0, 0, 0)
        // If today is AFTER end date, it's finished. 
        if (now > endDate) return 'finalizada'
    }

    // 4. Start Date (Pending vs Active)
    if (enrollment.start_date) {
        const startDate = new Date(enrollment.start_date)
        startDate.setHours(0, 0, 0, 0)

        // Future start date
        if (startDate > now) return 'pendiente'
    } else {
        // No start date = hasn't started
        return 'pendiente'
    }

    // Default
    return 'activa'
}

export function filterEnrollments(
    enrollments: Enrollment[],
    statusTab: "en-curso" | "por-empezar" | "finalizadas",
    searchTerm: string,
    categoryTab: string = "all",
    enrollmentProgresses: Record<string, number> = {}
): Enrollment[] {
    return enrollments.filter(enrollment => {
        // 1. Calculate Real Status
        const progress = enrollmentProgresses[enrollment.id] || 0
        const realStatus = calculateEnrollmentStatus(enrollment, progress)

        // 2. Filter by Tab
        let matchesTab = false
        if (statusTab === 'en-curso') {
            matchesTab = realStatus === 'activa'
        } else if (statusTab === 'por-empezar') {
            matchesTab = realStatus === 'pendiente'
        } else if (statusTab === 'finalizadas') {
            matchesTab = realStatus === 'finalizada' || realStatus === 'expirada'
        }

        if (!matchesTab) return false

        // 3. Filter by Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const activity = enrollment.activity as any
            const title = activity?.title?.toLowerCase() || ""
            const coach = activity?.coaches?.full_name?.toLowerCase() || ""
            if (!title.includes(term) && !coach.includes(term)) {
                return false
            }
        }

        // 4. Filter by Category (if implemented)
        if (categoryTab !== 'all') {
            // Logic for category filtering if needed
        }

        return true
    })
}
