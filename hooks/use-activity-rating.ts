"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

interface ActivityRating {
  total_likes: number
  total_dislikes: number
  user_rating: "like" | "dislike" | null
  rating_percentage: number
}

export function useActivityRating(activityId: string) {
  const [rating, setRating] = useState<ActivityRating>({
    total_likes: 0,
    total_dislikes: 0,
    user_rating: null,
    rating_percentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyRating, setSurveyRating] = useState<"like" | "dislike" | null>(null)
  const { toast } = useToast()

  // Cargar rating inicial
  useEffect(() => {
    const fetchRating = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/activities/${activityId}/rating`)
        const result = await response.json()

        if (result.success) {
          setRating(result.data)
        } else {
          console.error("Error fetching rating:", result.error)
        }
      } catch (error) {
        console.error("Error fetching rating:", error)
      } finally {
        setLoading(false)
      }
    }

    if (activityId) {
      fetchRating()
    }
  }, [activityId])

  // Función para actualizar rating
  const updateRating = async (newRating: "like" | "dislike" | null) => {
    try {
      setUpdating(true)

      // Optimistic update
      const previousRating = rating.user_rating
      const optimisticRating = { ...rating }

      // Calcular cambios optimistas
      if (previousRating === "like") {
        optimisticRating.total_likes -= 1
      } else if (previousRating === "dislike") {
        optimisticRating.total_dislikes -= 1
      }

      if (newRating === "like") {
        optimisticRating.total_likes += 1
      } else if (newRating === "dislike") {
        optimisticRating.total_dislikes += 1
      }

      optimisticRating.user_rating = newRating
      optimisticRating.rating_percentage =
        optimisticRating.total_likes + optimisticRating.total_dislikes > 0
          ? Math.round(
              (optimisticRating.total_likes / (optimisticRating.total_likes + optimisticRating.total_dislikes)) * 100,
            )
          : 0

      setRating(optimisticRating)

      // Hacer la petición real
      const response = await fetch(`/api/activities/${activityId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: newRating }),
      })

      const result = await response.json()

      if (result.success) {
        // Actualizar con datos reales del servidor
        setRating(result.data)

        // Mostrar encuesta solo si es un nuevo rating (no null)
        if (newRating && previousRating !== newRating) {
          setSurveyRating(newRating)
          setShowSurvey(true)
        }

        toast({
          title: newRating ? "Rating actualizado" : "Rating eliminado",
          description: result.message,
        })
      } else {
        // Revertir cambio optimista
        setRating(rating)
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el rating",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revertir cambio optimista
      setRating(rating)
      console.error("Error updating rating:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el rating",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const closeSurvey = () => {
    setShowSurvey(false)
    setSurveyRating(null)
  }

  return {
    rating,
    loading,
    updating,
    updateRating,
    showSurvey,
    surveyRating,
    closeSurvey,
  }
}
