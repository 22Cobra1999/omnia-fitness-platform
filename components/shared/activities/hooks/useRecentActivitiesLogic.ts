import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

export interface RecentActivity {
    id: string
    name: string
    category: "fitness" | "nutrition" | "other"
    value: number
    unit: string
    timestamp: string
    color?: string
    km?: number | null
    mins?: number | null
    kg?: number | null
    reps?: number | null
    sets?: number | null
    kcal?: number | null
    distance?: number | null
    duration?: number | null
    weight?: number | null
    user_id?: string
}

const FALLBACK_ACTIVITIES: RecentActivity[] = [
    {
        id: "fallback-1",
        name: "Entrenamiento de fuerza",
        category: "fitness",
        value: 45,
        unit: "mins",
        timestamp: new Date().toISOString(),
        color: "#FF7939",
    },
    {
        id: "fallback-2",
        name: "Desayuno saludable",
        category: "nutrition",
        value: 450,
        unit: "kcal",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        color: "#4ADE80",
    },
    {
        id: "fallback-3",
        name: "Meditación",
        category: "other",
        value: 15,
        unit: "mins",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        color: "#60A5FA",
    },
]

export function useRecentActivitiesLogic(userId?: string) {
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    // Modal / Form state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentActivity, setCurrentActivity] = useState<RecentActivity>({
        id: "",
        name: "",
        category: "fitness",
        value: 0,
        unit: "mins",
        timestamp: new Date().toISOString(),
    })
    const [isSaving, setIsSaving] = useState(false)

    // Cache logic
    useEffect(() => {
        try {
            const cacheKey = `recent_activities_${userId || "guest"}`
            const cachedActivities = sessionStorage.getItem(cacheKey)
            const cacheTimestamp = Number.parseInt(sessionStorage.getItem(`${cacheKey}_timestamp`) || "0")

            if (cachedActivities && Date.now() - cacheTimestamp < 2 * 60 * 1000) {
                const parsedActivities = JSON.parse(cachedActivities)
                if (parsedActivities && parsedActivities.length > 0) {
                    setActivities(parsedActivities)
                }
            }
        } catch (e) {
            console.error("Error al cargar caché de actividades:", e)
        }
    }, [userId])

    const fetchActivities = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            setActivities(FALLBACK_ACTIVITIES)
            return
        }

        try {
            const timestamp = Date.now()
            const response = await fetch(`/api/recent-activities?t=${timestamp}`, {
                headers: { "Cache-Control": "no-cache" },
            })

            if (!response.ok) throw new Error(`Error: ${response.status}`)

            const data = await response.json()
            const finalActivities = Array.isArray(data) ? data : (data?.activities || FALLBACK_ACTIVITIES)

            setActivities(finalActivities)

            try {
                const cacheKey = `recent_activities_${userId}`
                sessionStorage.setItem(cacheKey, JSON.stringify(finalActivities))
                sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())
            } catch (e) {
                console.error("Error al guardar caché de actividades:", e)
            }
        } catch (error) {
            console.error("Error fetching activities:", error)
            setError("No se pudieron cargar las actividades recientes")
            setActivities(FALLBACK_ACTIVITIES)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    const handleAddActivity = () => {
        setCurrentActivity({
            id: "",
            name: "",
            category: "fitness",
            value: 0,
            unit: "mins",
            timestamp: new Date().toISOString(),
        })
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const handleEditActivity = (id: string) => {
        const activity = activities.find((a) => a.id === id)
        if (activity) {
            setCurrentActivity({ ...activity })
            setIsEditing(true)
            setIsModalOpen(true)
        }
    }

    const handleSaveActivity = async () => {
        if (!userId) {
            toast({
                title: "Error",
                description: "Debes iniciar sesión para guardar actividades",
                variant: "destructive",
            })
            return
        }

        setIsSaving(true)

        try {
            if (isEditing) {
                const response = await fetch(`/api/recent-activities/${currentActivity.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(currentActivity),
                })

                if (!response.ok) throw new Error("Error al actualizar la actividad")

                setActivities((prev) => prev.map((a) => (a.id === currentActivity.id ? { ...currentActivity } : a)))
                toast({ title: "Éxito", description: "Actividad actualizada correctamente" })
            } else {
                const activityToCreate = { ...currentActivity, user_id: userId }

                const response = await fetch("/api/recent-activities", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(activityToCreate),
                })

                if (!response.ok) throw new Error("Error al crear la actividad")

                const data = await response.json()
                setActivities((prev) => [data.activity, ...prev])
                toast({ title: "Éxito", description: "Actividad creada correctamente" })
            }
            setIsModalOpen(false)
        } catch (error) {
            console.error("Error al guardar la actividad:", error)
            toast({ title: "Error", description: "No se pudo guardar la actividad", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteActivity = async (id: string) => {
        if (!userId) {
            toast({ title: "Error", description: "Debes iniciar sesión para eliminar actividades", variant: "destructive" })
            return
        }

        if (!confirm("¿Estás seguro de que deseas eliminar esta actividad?")) return

        try {
            const response = await fetch(`/api/recent-activities/${id}`, { method: "DELETE" })
            if (!response.ok) throw new Error("Error al eliminar la actividad")

            setActivities((prev) => prev.filter((a) => a.id !== id))
            toast({ title: "Éxito", description: "Actividad eliminada correctamente" })
        } catch (error) {
            console.error("Error al eliminar la actividad:", error)
            toast({ title: "Error", description: "No se pudo eliminar la actividad", variant: "destructive" })
        }
    }

    return {
        activities,
        isLoading,
        error,
        isModalOpen,
        setIsModalOpen,
        isEditing,
        currentActivity,
        setCurrentActivity,
        isSaving,
        handleAddActivity,
        handleEditActivity,
        handleSaveActivity,
        handleDeleteActivity,
        fetchActivities,
    }
}
