"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createClient } from '@/lib/supabase-browser'
import type { RecentActivity } from "@/components/recent-activities"

interface Activity {
  activity_id: string
  title: string
  coach_name: string
  category: string
  subcategory: string | null
  description: string | null
  level: string | null
  duration_minutes: number | null
  format: string | null
  price: number
  date: string | null
  time_start: string | null
  language: string | null
  visibility: string
  coach_id: string
  image_url: string | null
  video_url: string | null
  total_likes: number | null
  total_dislikes: number | null
  // Otros campos que puedan ser necesarios
}

interface ActivitiesState {
  activities: Activity[]
  recentActivities: RecentActivity[]
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  fetchActivities: (forceRefresh?: boolean) => Promise<void>
  fetchRecentActivities: () => Promise<void>
  addActivity: (activity: Activity) => void
  addRecentActivity: (activity: RecentActivity) => Promise<void>
  updateActivity: (id: string, activity: Partial<RecentActivity>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  clearActivities: () => void
}

// Tiempo de caché en milisegundos (15 minutos)
const CACHE_TIME = 15 * 60 * 1000

// Datos de actividades de fallback para mostrar mientras se cargan los datos reales
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

export const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      recentActivities: [],
      isLoading: true,
      error: null,
      lastFetched: null,

      fetchActivities: async (forceRefresh = false) => {
        const currentTime = Date.now()
        const lastFetched = get().lastFetched

        // Si los datos están en caché y son recientes, no volver a cargar
        // a menos que se fuerce la actualización
        if (!forceRefresh && lastFetched && currentTime - lastFetched < CACHE_TIME && get().activities.length > 0) {
          console.log("Usando datos en caché para actividades")
          return
        }

        // Si estamos forzando la actualización pero tenemos datos, no mostrar el estado de carga
        // para evitar parpadeos en la UI
        if (forceRefresh && get().activities.length > 0) {
          // No establecer isLoading a true
        } else {
          set({ isLoading: true })
        }

        try {
          const supabase = createClient()

          // Consulta más eficiente sin joins complejos
          const { data, error } = await supabase
            .from("activities")
            .select(`
              activity_id,
              title,
              description,
              category,
              level,
              format,
              price,
              date,
              time_start,
              duration_minutes,
              visibility,
              coach_id,
              image_url,
              video_url,
              total_likes,
              total_dislikes
            `)
            .eq("visibility", "Public")
            .order("created_at", { ascending: false })
            .limit(10) // Paginación inicial

          if (error) {
            console.error("Error fetching activities:", error)
            return
          }

          // Obtener nombres de coaches en una consulta separada para los IDs únicos
          const coachIds = [...new Set(data.map((a) => a.coach_id).filter(Boolean))]
          let coachNames = {}

          if (coachIds.length > 0) {
            const { data: coaches, error: coachError } = await supabase
              .from("profiles")
              .select("id, name")
              .in("id", coachIds)

            if (!coachError && coaches) {
              coachNames = coaches.reduce((acc, coach) => {
                acc[coach.id] = coach.name
                return acc
              }, {})
            }
          }

          // Combinar datos
          const activitiesWithCoachName = data.map((activity) => ({
            ...activity,
            coach_name: coachNames[activity.coach_id] || "Coach",
          }))

          set({
            activities: activitiesWithCoachName,
            isLoading: false,
            lastFetched: Date.now(),
          })
        } catch (error) {
          console.error("Error in fetchActivities:", error)
          set({ isLoading: false })
        }
      },

      fetchRecentActivities: async () => {
        // Intentar cargar desde caché primero y usar si es válido
        try {
          const cachedActivities = sessionStorage.getItem("recent_activities_cache")
          const cacheTimestamp = Number.parseInt(sessionStorage.getItem("recent_activities_timestamp") || "0")

          // Usar caché si tiene menos de 10 minutos
          if (cachedActivities && Date.now() - cacheTimestamp < 10 * 60 * 1000) {
            const parsedActivities = JSON.parse(cachedActivities)
            if (parsedActivities && parsedActivities.length > 0) {
              console.log("Usando actividades en caché")
              set({ recentActivities: parsedActivities, isLoading: false })
              return // No actualizar en background
            }
          }
        } catch (e) {
          console.error("Error al leer caché de actividades:", e)
        }

        set({ isLoading: true, error: null })

        try {
          // Intentar cargar datos en caché mientras se espera la respuesta del servidor
          try {
            const cachedActivities = sessionStorage.getItem("recent_activities_cache")
            const cacheTimestamp = Number.parseInt(sessionStorage.getItem("recent_activities_timestamp") || "0")

            // Usar caché solo si existe y tiene menos de 2 minutos
            if (cachedActivities && Date.now() - cacheTimestamp < 2 * 60 * 1000) {
              const parsedActivities = JSON.parse(cachedActivities)
              if (parsedActivities && parsedActivities.length > 0) {
                console.log("Usando actividades en caché mientras se cargan nuevas")
                set({ recentActivities: parsedActivities, isLoading: false })
                // Seguimos cargando para actualizar los datos
              }
            }
          } catch (e) {
            console.error("Error al cargar caché de actividades:", e)
          }

          // Añadir un timestamp para evitar caché del navegador
          const timestamp = Date.now()
          const response = await fetch(`/api/recent-activities?t=${timestamp}`, {
            headers: {
              "Cache-Control": "no-cache",
            },
          })

          if (!response.ok) {
            throw new Error(`Error: ${response.status}`)
          }

          const data = await response.json()

          // Verificar que data es un array
          if (!Array.isArray(data)) {
            console.error("La respuesta no es un array:", data)
            // Si no es un array pero tiene una propiedad 'activities' que es un array, usar eso
            if (data && Array.isArray(data.activities)) {
              set({ recentActivities: data.activities, isLoading: false })
            } else {
              // Si no hay datos válidos, usar datos de fallback
              set({ recentActivities: FALLBACK_ACTIVITIES, isLoading: false })
            }
          } else {
            set({ recentActivities: data, isLoading: false })
          }

          // Guardar en caché para futuras cargas rápidas
          try {
            sessionStorage.setItem(
              "recent_activities_cache",
              JSON.stringify(Array.isArray(data) ? data : FALLBACK_ACTIVITIES),
            )
            sessionStorage.setItem("recent_activities_timestamp", Date.now().toString())
          } catch (e) {
            console.error("Error al guardar caché de actividades:", e)
          }
        } catch (error) {
          console.error("Error fetching activities:", error)
          set({
            error: "No se pudieron cargar las actividades recientes",
            isLoading: false,
            recentActivities: FALLBACK_ACTIVITIES,
          })
        }
      },

      addActivity: async (activity: RecentActivity) => {
        try {
          const response = await fetch("/api/recent-activities", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(activity),
          })

          if (!response.ok) {
            throw new Error("Error al crear la actividad")
          }

          const data = await response.json()
          set((state) => ({
            recentActivities: [data.activity, ...state.recentActivities],
          }))
        } catch (error) {
          console.error("Error adding activity:", error)
          set({ error: "No se pudo añadir la actividad" })
        }
      },

      updateActivity: async (id: string, activityUpdate: Partial<RecentActivity>) => {
        try {
          const response = await fetch(`/api/recent-activities/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(activityUpdate),
          })

          if (!response.ok) {
            throw new Error("Error al actualizar la actividad")
          }

          const data = await response.json()
          set((state) => ({
            recentActivities: state.recentActivities.map((a) => (a.id === id ? { ...a, ...data.activity } : a)),
          }))
        } catch (error) {
          console.error("Error updating activity:", error)
          set({ error: "No se pudo actualizar la actividad" })
        }
      },

      deleteActivity: async (id: string) => {
        try {
          const response = await fetch(`/api/recent-activities/${id}`, {
            method: "DELETE",
          })

          if (!response.ok) {
            throw new Error("Error al eliminar la actividad")
          }

          set((state) => ({
            recentActivities: state.recentActivities.filter((a) => a.id !== id),
          }))
        } catch (error) {
          console.error("Error deleting activity:", error)
          set({ error: "No se pudo eliminar la actividad" })
        }
      },

      clearActivities: () => {
        set({ activities: [], recentActivities: [], lastFetched: null })
      },
    }),
    {
      name: "activities-storage", // Nombre para localStorage
      partialize: (state) => ({
        activities: state.activities,
        recentActivities: state.recentActivities,
        lastFetched: state.lastFetched,
      }), // Solo persistir estos campos
    },
  ),
)
