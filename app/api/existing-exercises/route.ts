import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'
import { hasActivity } from '@/lib/utils/exercise-activity-map'

const normalizeName = (value?: string | null) =>
  (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const scoreFitnessExercise = (exercise: any): number => {
  let score = 0
  if (exercise.video_url) score += 4
  if (exercise.detalle_series) score += 3
  if (exercise.nivel_intensidad) score += 2
  if (exercise.equipo_necesario) score += 1
  if (exercise.partes_cuerpo) score += 1
  if (exercise.calorias) score += 1
  return score
}

const scoreNutritionDish = (dish: any): number => {
  let score = 0
  if (dish.video_url) score += 3
  if (dish.receta) score += 2
  if (dish.ingredientes) score += 2
  if (dish.proteinas) score += 1
  if (dish.carbohidratos) score += 1
  if (dish.grasas) score += 1
  return score
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario sea un coach
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!coach) {
      return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
    }

    const url = new URL(request.url)
    const categoryParam = url.searchParams.get('category')
    const category = categoryParam === 'nutricion' ? 'nutricion' : 'fitness'
    const categoryAliases = category === 'nutricion'
      ? ['nutricion', 'nutrition']
      : ['fitness', 'program_fitness', 'entrenamiento', 'training', null]

    const isNutritionCategory = category === 'nutricion'

    // Primero obtener todas las actividades del coach
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, type, categoria')
      .eq('coach_id', coach.id)

    if (activitiesError) {
      console.error('Error obteniendo actividades del coach:', activitiesError)
      return NextResponse.json({
        success: true,
        exercises: [],
        warning: activitiesError.message
      })
    }

    const relevantActivities = (activities || []).filter((activity: any) => {
      const type = (activity?.type ?? '').toString().toLowerCase()
      const categoria = (activity?.categoria ?? '').toString().toLowerCase()
      const isProgram = type.includes('program')
      if (!isProgram) return false

      if (isNutritionCategory) {
        return categoryAliases.includes(categoria)
      }

      // Fitness: excluir nutrición explícita
      if (categoria === 'nutricion' || categoria === 'nutrition') {
        return false
      }

      return true
    })

    const activityIds = relevantActivities.map((activity: any) => activity.id).filter(Boolean)

    if (activityIds.length === 0) {
      return NextResponse.json({
        success: true,
        exercises: []
      })
    }

    if (isNutritionCategory) {
      // 📌 Catálogo de platos de nutrición:
      // Usamos todos los platos del coach en `nutrition_program_details`
      // como base para "Agregar existentes" (independiente del programa concreto).
      const { data: dishes, error: dishesError } = await supabase
        .from('nutrition_program_details')
        .select('id, coach_id, nombre, receta_id, calorias, proteinas, carbohidratos, grasas, ingredientes, porciones, minutos, video_url, recetas(id, receta)')
        .eq('coach_id', coach.id)

      if (dishesError) {
        console.error('Error obteniendo platos existentes:', dishesError)
        return NextResponse.json({
          success: true,
          exercises: [],
          warning: dishesError.message
        })
      }

      const uniqueDishesMap = new Map<string, any>()

      dishes?.forEach((dish: any) => {
        const name = dish?.nombre || ''
        const key = normalizeName(name)
        if (!key) return

        const candidate = {
          id: dish.id,
          name,
          descripcion: dish.descripcion ?? '',
          receta: Array.isArray(dish.recetas) ? (dish.recetas[0]?.receta ?? '') : (dish.recetas?.receta ?? ''),
          calorias: dish.calorias ?? '',
          proteinas: dish.proteinas ?? '',
          carbohidratos: dish.carbohidratos ?? '',
          grasas: dish.grasas ?? '',
          ingredientes: dish.ingredientes ?? '',
          porciones: dish.porciones ?? '',
          minutos: dish.minutos ?? '',
          video_url: dish.video_url ?? ''
        }

        const existing = uniqueDishesMap.get(key)
        if (!existing) {
          uniqueDishesMap.set(key, candidate)
          return
        }

        if (scoreNutritionDish(candidate) > scoreNutritionDish(existing)) {
          uniqueDishesMap.set(key, candidate)
        }
      })

      return NextResponse.json({
        success: true,
        exercises: Array.from(uniqueDishesMap.values())
      })
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from('ejercicios_detalles')
      .select('id, activity_id, coach_id, nombre_ejercicio, tipo, descripcion, calorias, intensidad, equipo, body_parts, detalle_series, duracion_min, video_url')
      .eq('coach_id', coach.id)

    if (exercisesError) {
      console.error('Error obteniendo ejercicios existentes:', exercisesError)
      return NextResponse.json({
        success: true,
        exercises: [],
        warning: exercisesError.message
      })
    }

    const uniqueExercisesMap = new Map<string, any>()

    exercises
      ?.filter((exercise: any) => activityIds.some(id => hasActivity(exercise.activity_id, id)))
      .forEach((exercise: any) => {
        const name = exercise?.nombre_ejercicio || ''
        const key = normalizeName(name)
        if (!key) return

        const candidate = {
          id: exercise.id,
          name,
          descripcion: exercise.descripcion ?? '',
          duracion_min: exercise.duracion_min ?? '',
          tipo_ejercicio: exercise.tipo ?? '',
          nivel_intensidad: exercise.intensidad ?? '',
          equipo_necesario: exercise.equipo ?? '',
          detalle_series: exercise.detalle_series ?? '',
          partes_cuerpo: exercise.body_parts ?? '',
          calorias: exercise.calorias ?? '',
          video_url: exercise.video_url ?? ''
        }

        const existing = uniqueExercisesMap.get(key)
        if (!existing) {
          uniqueExercisesMap.set(key, candidate)
          return
        }

        if (scoreFitnessExercise(candidate) > scoreFitnessExercise(existing)) {
          uniqueExercisesMap.set(key, candidate)
        }
      })

    return NextResponse.json({
      success: true,
      exercises: Array.from(uniqueExercisesMap.values())
    })
  } catch (error: any) {
    console.error('Error en /api/existing-exercises:', error)
    return NextResponse.json({
      success: true,
      exercises: [],
      warning: error.message
    })
  }
}

