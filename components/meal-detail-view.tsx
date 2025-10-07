"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase-browser'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"

interface MealDetailProps {
  mealId: string
  dayId: string
  activityId: string
  onBack: () => void
}

interface MealDetail {
  id: string
  title: string
  type: string
  description: string
  ingredients: string
  recipe: string
  calories: number
  protein: number
  carbs: number
  fats: number
  weight: number
  image_url: string
  coach_notes?: string
}

export default function MealDetailView({ mealId, dayId, activityId, onBack }: MealDetailProps) {
  const [meal, setMeal] = useState<MealDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // En un caso real, aquí obtendrías los detalles del plato desde Supabase
        // Simulamos la respuesta para este ejemplo
        const mockMeal: MealDetail = {
          id: mealId,
          title: "Chicken Salad",
          type: "lunch",
          description: "A nutritious salad with grilled chicken breast",
          ingredients: "Chicken breast, lettuce, tomato, carrot, etc.",
          recipe: "1. Cook the chicken breast.\n2. Mix the ingredients.\n3. Serve and enjoy.",
          calories: 300,
          protein: 20,
          carbs: 40,
          fats: 10,
          weight: 250,
          image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-uB363OW3QMVp2TH3W91aZReCCNaI9o.png",
          coach_notes: "This salad is excellent for maintaining energy.",
        }

        // Simular tiempo de carga
        setTimeout(() => {
          setMeal(mockMeal)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching meal details:", error)
        setError("No se pudo cargar los detalles del plato. Por favor, intenta de nuevo más tarde.")
        setLoading(false)
      }
    }

    fetchMealDetails()
  }, [mealId, supabase])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  if (error || !meal) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-500 mb-4">{error || "No se pudo cargar los detalles del plato"}</p>
        <Button onClick={onBack}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Imagen del plato con título superpuesto */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-t-xl">
        <Image src={meal.image_url || "/placeholder.svg"} alt={meal.title} fill className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <h1 className="text-4xl font-bold text-white">{meal.title}</h1>
        </div>
      </div>

      {/* Información nutricional */}
      <div className="grid grid-cols-4 divide-x divide-gray-200 bg-white">
        <div className="p-4 text-center">
          <div className="text-3xl font-bold">{meal.calories}</div>
          <div className="text-sm text-gray-500">kcal</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-bold">{meal.protein}g</div>
          <div className="text-sm text-gray-500">Protein</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-bold">{meal.carbs}g</div>
          <div className="text-sm text-gray-500">Carbs</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl font-bold">{meal.fats}g</div>
          <div className="text-sm text-gray-500">Fats</div>
        </div>
      </div>

      {/* Peso del plato */}
      <div className="p-4 bg-white border-t border-gray-200">
        <p className="text-xl font-medium text-center">Dish weight: {meal.weight}g</p>
      </div>

      {/* Contenido principal */}
      <div className="p-6 space-y-8 bg-white">
        {/* Notas del coach */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Coach Notes</h2>
          <p className="text-gray-700">{meal.coach_notes || "No hay notas del coach para este plato."}</p>
        </div>

        {/* Ingredientes */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Ingredients</h2>
          <p className="text-gray-700">{meal.ingredients}</p>
        </div>

        {/* Receta */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Recipe</h2>
          {meal.recipe.split("\n").map((step, index) => (
            <p key={index} className="text-gray-700 mb-2">
              {step}
            </p>
          ))}
        </div>

        {/* Botón para volver */}
        <Button onClick={onBack} variant="outline" className="w-full mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver al plan
        </Button>
      </div>
    </div>
  )
}
