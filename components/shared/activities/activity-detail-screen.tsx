"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, MessageCircle, Flame, CheckCircle } from "lucide-react"
import { VimeoEmbed } from "./vimeo-embed"
import Image from "next/image"

interface ActivityDetailScreenProps {
  activityId: string
  dayId: string
  weekId: string
  onBack: () => void
  onToggleComplete: (sectionId: string) => void
  onNext: () => void
}

interface ExerciseData {
  id: number
  nombre_actividad: string
  descripción: string
  duracion: number
  calorias_consumidas: number
  tipo_ejercicio: string
  repeticiones: string
  intervalos_secs: string
  descanso: string
  peso: string
  nivel_intensidad: string
  equipo_necesario: string
  video: string
  nota_cliente: string
  completed: boolean
  series?: any[]
}

const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({
  activityId,
  dayId,
  weekId,
  onBack,
  onToggleComplete,
  onNext,
}) => {
  const [exercise, setExercise] = useState<ExerciseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadExercise = async () => {
      try {
        setLoading(true)
        setError(null)


        // El activityId en realidad es el ID del ejercicio individual
        const exerciseId = Number(activityId)
        
        // Buscar el ejercicio específico por ID - NUEVO ESQUEMA MODULAR
        const supabase = createClient()
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("ejercicios_detalles")
          .select("*")
          .eq("id", exerciseId)
          .single()

        if (exerciseError) {
          console.error("❌ Error fetching exercise:", exerciseError)
          console.error("❌ Detalles del error:", {
            message: exerciseError.message,
            details: exerciseError.details,
            hint: exerciseError.hint,
            code: exerciseError.code
          })
          throw new Error("Error al cargar el ejercicio")
        }

        if (!exerciseData) {
          throw new Error("Ejercicio no encontrado")
        }


        
        // Crear un objeto compatible con la interfaz ExerciseData - NUEVO ESQUEMA
        const processedExercise = {
          id: exerciseData.id,
          nombre_actividad: exerciseData.nombre_ejercicio,
          descripción: exerciseData.descripcion,
          duracion: exerciseData.duracion_min || 0,
          calorias_consumidas: 0, // No disponible en el nuevo esquema
          tipo_ejercicio: exerciseData.tipo || "Fuerza",
          repeticiones: "10", // Valor por defecto
          intervalos_secs: "3", // Valor por defecto
          descanso: "60", // Valor por defecto
          peso: "0", // Valor por defecto
          nivel_intensidad: "Moderado", // Valor por defecto
          equipo_necesario: "Ninguno", // Valor por defecto
          video: exerciseData.video_url || "",
          nota_cliente: "", // Se maneja en ejecuciones_ejercicio
          completed: false, // Se maneja en ejecuciones_ejercicio
          series: []
        }
        
        setExercise(processedExercise)
        setIsCompleted(false) // Se maneja en ejecuciones_ejercicio

      } catch (error: any) {
        console.error("❌ Error cargando ejercicio:", error)
        setError(error.message || "Error al cargar el ejercicio")
      } finally {
        setLoading(false)
      }
    }

    loadExercise()
  }, [activityId]) // Solo recargar cuando cambie el activityId

  const handleToggleComplete = async () => {
    if (!exercise) return

    const newCompletedState = !isCompleted
    setIsCompleted(newCompletedState)

    toast({
      title: newCompletedState ? "¡Ejercicio completado!" : "Ejercicio marcado como pendiente",
      description: newCompletedState ? "¡Excelente trabajo!" : "Puedes completarlo más tarde",
    })

    onToggleComplete(activityId)
  }

  const extractVimeoId = (videoUrl: string) => {
    const match = videoUrl.match(/vimeo\.com\/video\/(\d+)/)
    return match ? match[1] : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="space-y-6 p-4">
          <Skeleton className="h-10 w-10 rounded-full bg-gray-800" />
          <Skeleton className="h-80 w-full rounded-2xl bg-gray-800" />
          <Skeleton className="h-12 w-48 bg-gray-800" />
          <Skeleton className="h-32 w-full bg-gray-800" />
        </div>
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-center text-white">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-gray-400 mb-6">{error || "Ejercicio no encontrado"}</p>
          <Button onClick={onBack} variant="outline" className="text-white border-gray-600 bg-transparent">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const vimeoId = exercise.video ? extractVimeoId(exercise.video) : null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-6 left-6 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 rounded-full w-12 h-12"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress Header */}
      <div className="pt-20 pb-4 text-center">
        <h2 className="text-2xl font-bold">
          <span className="text-orange-500">Semana {weekId}</span>
          <span className="text-white"> - Día {dayId}</span>
        </h2>
      </div>

      {/* Video Section */}
      <div className="relative px-4 mb-6">
        <div className="relative h-[45vh] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
          {exercise.video ? (
            <div className="relative h-full w-full">
              <VimeoEmbed
                videoContent={exercise.video}
                title={exercise.nombre_actividad}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="relative h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center rounded-3xl">
              <div className="relative z-10 text-center">
                <div className="bg-orange-500/20 backdrop-blur-sm rounded-full p-8 mb-4 inline-block">
                  <div className="h-20 w-20 text-orange-500 flex items-center justify-center text-6xl">▶</div>
                </div>
                <p className="text-white/80 text-xl">Video no disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Button */}
      <div className="flex justify-center py-6">
        <Button
          onClick={handleToggleComplete}
          className={`flex items-center gap-4 px-12 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg ${
            isCompleted
              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-2 border-green-400/50"
              : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-2 border-orange-400/50"
          }`}
        >
          <Flame className="h-7 w-7" />
          {isCompleted ? "¡Completado!" : "Marcar como completado"}
          {isCompleted && <CheckCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Exercise Info */}
      <div className="px-8 pb-20">
        {/* Calories and Duration */}
        <div className="flex justify-between mb-8 max-w-4xl mx-auto">
          <div className="text-left">
            <span className="text-white text-2xl font-medium">{exercise.calorias_consumidas || "0"} cals</span>
          </div>
          <div className="text-right">
            <span className="text-orange-500 text-2xl font-medium">{exercise.duracion || "0"} mins</span>
          </div>
        </div>

        {/* Exercise Type */}
        <div className="flex justify-center mb-8">
          <span className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full text-orange-500 text-base font-medium">
            {exercise.tipo_ejercicio || "Ejercicio"} - {exercise.nivel_intensidad || "Moderado"}
          </span>
        </div>

        {/* Exercise Title and Description */}
        <div className="mb-12 max-w-2xl mx-auto">
          <h1 className="text-white text-5xl font-bold text-center mb-6">
            {exercise.nombre_actividad}
          </h1>
          <p className="text-gray-300 text-center text-xl mb-8 leading-relaxed">
            {exercise.descripción || "Descripción del ejercicio no disponible."}
          </p>
        </div>

        {/* Exercise Stats */}
        <div className="mb-12 max-w-2xl mx-auto">
          <h3 className="text-white text-2xl font-semibold mb-6 text-center">Variables del Ejercicio</h3>
          
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-gray-400 text-lg mb-3">Repeticiones</div>
              <div className="text-orange-500 text-4xl font-bold">
                {exercise.repeticiones || "0"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-lg mb-3">Descanso</div>
              <div className="text-white text-4xl font-bold">
                {exercise.descanso || "30"}s
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-lg mb-3">Series</div>
              <div className="text-orange-500 text-4xl font-bold">
                {exercise.intervalos_secs || "3"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-lg mb-3">Peso</div>
              <div className="text-orange-500 text-4xl font-bold">
                {exercise.peso || "0"}kg
              </div>
            </div>
          </div>
        </div>

        {/* Equipment */}
        {exercise.equipo_necesario && (
          <div className="mb-12 max-w-2xl mx-auto">
            <h3 className="text-white text-xl font-semibold mb-4 text-center">Equipo Necesario</h3>
            <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 text-center">
              <span className="text-white text-lg">{exercise.equipo_necesario}</span>
            </div>
          </div>
        )}

        {/* Coach Note */}
        {exercise.nota_cliente && (
          <div className="mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-between bg-gray-900/30 rounded-xl p-6 border border-gray-800">
              <span className="text-white text-xl">{exercise.nota_cliente}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-lg">@coach</span>
                <MessageCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Completion Status */}
        {isCompleted && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div className="text-center">
                <p className="text-green-400 font-semibold text-xl">✓ Completado</p>
                <p className="text-green-300/70 text-base mt-1">
                  {new Date().toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityDetailScreen
