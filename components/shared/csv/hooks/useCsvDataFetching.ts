
import { useCallback, useRef } from 'react'
import { normalizeActivityMap } from '@/lib/utils/exercise-activity-map'
import {
    normalizeExerciseType,
    getNumberValue,
    getStringValue,
    getValue
} from '../utils/csv-helpers'
import { allowedExerciseTypes } from '../constants'

interface UseCsvDataFetchingProps {
    activityId: number
    coachId: string
    productCategory: 'fitness' | 'nutricion'
    parentCsvData?: any[]
    parentSetCsvData?: (data: any[]) => void
    setLoadingExisting: (loading: boolean) => void
    setCsvData: (data: any[]) => void
    setExistingData: (data: any[]) => void
    setExerciseUsage: (usage: any) => void
    setActivityNamesMap: (map: Record<number, string>) => void
    setActivityImagesMap: (map: Record<number, string | null>) => void
    setRulesCount: (count: number) => void
    updateErrorState: (message: string | null, rows?: string[]) => void
}

export function useCsvDataFetching({
    activityId,
    coachId,
    productCategory,
    parentCsvData,
    parentSetCsvData,
    setLoadingExisting,
    setCsvData,
    setExistingData,
    setExerciseUsage,
    setActivityNamesMap,
    setActivityImagesMap,
    setRulesCount,
    updateErrorState
}: UseCsvDataFetchingProps) {
    const isLoadingDataRef = useRef(false)

    const loadExistingData = useCallback(async () => {
        // Prevenir llamadas múltiples simultáneas
        if (isLoadingDataRef.current) {
            return
        }
        isLoadingDataRef.current = true

        // Modo genérico: activityId = 0 significa cargar todos los ejercicios/platos del coach
        if (activityId === 0) {
            setLoadingExisting(true)
            try {
                // Primero cargar las actividades del coach para tener el mapa de nombres
                try {
                    const activitiesResponse = await fetch(`/api/coach/activities?coachId=${coachId}`)
                    if (activitiesResponse.ok) {
                        const activitiesData = await activitiesResponse.json()
                        if (Array.isArray(activitiesData)) {
                            const namesMap: Record<number, string> = {}
                            const imagesMap: Record<number, string | null> = {}
                            activitiesData.forEach((activity: any) => {
                                if (activity.id && activity.title) {
                                    namesMap[activity.id] = activity.title
                                    let imageUrl: string | null = null

                                    if (activity.media?.image_url) {
                                        imageUrl = activity.media.image_url
                                    }
                                    else if (activity.activity_media && Array.isArray(activity.activity_media) && activity.activity_media.length > 0) {
                                        imageUrl = activity.activity_media[0]?.image_url || null
                                    }

                                    imagesMap[activity.id] = imageUrl
                                }
                            })
                            setActivityNamesMap(namesMap)
                            setActivityImagesMap(imagesMap)
                        }
                    }
                } catch (err) {
                    console.warn('⚠️ Error cargando actividades del coach:', err)
                }

                const category = productCategory === 'nutricion' ? 'nutricion' : 'fitness'
                const activeParam = productCategory === 'nutricion' ? '' : '&active=true'
                const catalogResponse = await fetch(`/api/coach/exercises?category=${category}${activeParam}`)

                if (!catalogResponse.ok) {
                    setLoadingExisting(false)
                    isLoadingDataRef.current = false
                    return
                }

                const catalogJson = await catalogResponse.json().catch(() => null)

                if (catalogJson && catalogJson.success && Array.isArray(catalogJson.data)) {
                    const items = catalogJson.data

                    const transformed = category === 'nutricion'
                        ? items.map((item: any) => {
                            let ingredientesValue = ''
                            const rawIngredientes = item.ingredientes || item.ingredients || item['Ingredientes']

                            if (rawIngredientes !== undefined && rawIngredientes !== null && rawIngredientes !== '') {
                                if (Array.isArray(rawIngredientes)) {
                                    ingredientesValue = rawIngredientes.join('; ')
                                } else if (typeof rawIngredientes === 'string' && rawIngredientes.trim().startsWith('[')) {
                                    try {
                                        const parsed = JSON.parse(rawIngredientes)
                                        if (Array.isArray(parsed)) {
                                            ingredientesValue = parsed.map((ing: any) => String(ing)).join('; ')
                                        } else {
                                            ingredientesValue = rawIngredientes
                                        }
                                    } catch {
                                        ingredientesValue = rawIngredientes
                                    }
                                } else {
                                    ingredientesValue = String(rawIngredientes)
                                }
                            }

                            return {
                                ...item,
                                'Nombre': item.nombre || item.nombre_plato || '',
                                'Nombre de la Actividad': item.nombre || item.nombre_plato || '',
                                tipo: item.tipo || '',
                                'Receta': getStringValue(item.receta || item.descripcion),
                                'Calorías': getNumberValue(item.calorias || item.calories || item.kcal || item['Calorías'] || item.calorías),
                                'Proteínas (g)': getNumberValue(item.proteinas || item.protein || item.proteins || item['Proteínas'] || item['Proteínas (g)']),
                                'Carbohidratos (g)': getNumberValue(item.carbohidratos || item.carbs || item.carbohydrates || item['Carbohidratos'] || item['Carbohidratos (g)']),
                                'Grasas (g)': getNumberValue(item.grasas || item.fat || item.fats || item['Grasas'] || item['Grasas (g)']),
                                'Ingredientes': ingredientesValue,
                                'Porciones': getStringValue(item.porciones || item.portions),
                                'Minutos': getStringValue(item.minutos || item.minutes || item.duration),
                                'Descripción': getStringValue(item.descripcion || item.receta),
                                isExisting: true,
                                is_active: item.is_active !== false,
                                activo: item.is_active !== false,
                                activity_id_new: item.activity_id_new || item.activity_id || null,
                                activity_id: item.activity_id || null,
                                nombre: item.nombre || item.nombre_plato || '',
                                receta: getStringValue(item.receta || item.descripcion),
                                calorias: getNumberValue(item.calorias || item.calories || item.kcal || item['Calorías'] || item.calorías),
                                proteinas: getNumberValue(item.proteinas || item.protein || item.proteins || item['Proteínas'] || item['Proteínas (g)']),
                                carbohidratos: getNumberValue(item.carbohidratos || item.carbs || item.carbohydrates || item['Carbohidratos'] || item['Carbohidratos (g)']),
                                grasas: getNumberValue(item.grasas || item.fat || item.fats || item['Grasas'] || item['Grasas (g)']),
                                ingredientes: ingredientesValue,
                                porciones: getStringValue(item.porciones || item.portions),
                                minutos: getStringValue(item.minutos || item.minutes || item.duration),
                                dificultad: getValue(item.dificultad || item.difficulty || item.level, 'Principiante'),
                                video_url: item.video_url || item.video || '',
                                video_file_name: item.video_file_name || null,
                                'Dificultad': getValue(item.dificultad || item.difficulty || item.level, 'Principiante'),
                                'Video': item.video_url || item.video || ''
                            }
                        })
                        : items.map((item: any) => ({
                            ...item,
                            'Nombre': item.nombre || item.nombre_ejercicio || item.nombre_plato || '',
                            'Nombre de la Actividad': item.nombre || item.nombre_ejercicio || item.nombre_plato || '',
                            tipo: item.tipo || '',
                            'Receta': item.receta || item.descripcion || '',
                            'Calorías': item.calorias || 0,
                            'Proteínas (g)': item.proteinas || 0,
                            'Carbohidratos (g)': item.carbohidratos || 0,
                            'Grasas (g)': item.grasas || 0,
                            'Ingredientes': item.ingredientes || '',
                            'Porciones': item.porciones || '',
                            'Minutos': item.minutos || 0,
                            'Descripción': item.descripcion || item.receta || '',
                            'Duración (min)': item.duracion_min || 0,
                            'Tipo de Ejercicio': item.tipo || '',
                            'Equipo Necesario': item.equipo || '',
                            'Detalle de Series (peso-repeticiones-series)': item.detalle_series || '',
                            'Partes del Cuerpo': item.body_parts || '',
                            'Nivel de Intensidad': item.intensidad || '',
                            isExisting: true,
                            is_active: item.is_active !== false,
                            activo: item.is_active !== false,
                            activity_id_new: item.activity_id_new || item.activity_id || null,
                            activity_id: item.activity_id || null
                        }))

                    setExistingData(transformed)
                    setCsvData(transformed)
                    if (parentSetCsvData) {
                        parentSetCsvData(transformed)
                    }

                    setTimeout(() => {
                        const itemsWithIds = transformed.filter((item: any) => item.id && typeof item.id === 'number')
                        const itemsToLoad = itemsWithIds.slice(0, 50)

                        if (itemsToLoad.length === 0) return

                        const batchSize = 10
                        const loadBatch = async (batch: Array<any>) => {
                            const batchPromises = batch.map(async (item: any) => {
                                try {
                                    const usageResponse = await fetch(`/api/coach/exercises/usage?exerciseId=${item.id}&category=${category}`)
                                    if (usageResponse.ok) {
                                        const usageData = await usageResponse.json()
                                        if (usageData.success) {
                                            return { exerciseId: item.id, usage: usageData }
                                        }
                                    }
                                } catch (error) { }
                                return null
                            })

                            const results = await Promise.all(batchPromises)
                            const usageMap: Record<number, { activities: Array<{ id: number; name: string }> }> = {}
                            results.forEach((result) => {
                                if (result) {
                                    usageMap[result.exerciseId] = {
                                        activities: result.usage.activities || []
                                    }
                                }
                            })

                            setExerciseUsage((prev: any) => ({ ...prev, ...usageMap }))
                        }

                        for (let i = 0; i < itemsToLoad.length; i += batchSize) {
                            const batch = itemsToLoad.slice(i, i + batchSize)
                            loadBatch(batch).catch(() => { })
                        }
                    }, 500)
                } else {
                    const errorMessage = catalogJson?.error || `Error ${catalogResponse.status}`
                    updateErrorState(`Error al cargar ${category === 'nutricion' ? 'platos' : 'ejercicios'}: ${errorMessage}`)
                }
            } catch (error) {
                console.error('❌ Error cargando datos modo genérico:', error)
            } finally {
                setLoadingExisting(false)
                isLoadingDataRef.current = false
            }
            return
        }

        if (!activityId || activityId <= 0) {
            isLoadingDataRef.current = false
            return
        }

        if (parentCsvData && parentCsvData.length > 0) {
            isLoadingDataRef.current = false
            return
        }

        setLoadingExisting(true)
        try {
            const endpoint = productCategory === 'nutricion'
                ? `/api/activity-nutrition/${activityId}`
                : `/api/activity-exercises/${activityId}`
            const response = await fetch(endpoint)
            const result = await response.json().catch(() => null)

            if (response.ok && result && result.success) {
                if (activityId > 0) {
                    try {
                        const savedRules = sessionStorage.getItem(`conditional_rules_${activityId}`)
                        if (savedRules) {
                            const parsed = JSON.parse(savedRules)
                            setRulesCount(parsed.length)
                        }
                    } catch (err) {
                        console.error('Error loading rules from session:', err)
                    }
                }

                let transformedExistingData = result.data.map((item: any) => {
                    const activityAssignments = normalizeActivityMap(
                        item.activity_assignments ?? item.activity_map ?? item.activity_id_new ?? item.activity_id
                    )

                    if (productCategory === 'nutricion') {
                        let ingredientesValue = ''
                        if (item.ingredientes !== undefined && item.ingredientes !== null && item.ingredientes !== '') {
                            if (Array.isArray(item.ingredientes)) {
                                ingredientesValue = item.ingredientes.join('; ')
                            } else if (typeof item.ingredientes === 'object') {
                                ingredientesValue = JSON.stringify(item.ingredientes)
                            } else {
                                const strValue = String(item.ingredientes).trim()
                                if (strValue.startsWith('[') && strValue.endsWith(']')) {
                                    try {
                                        const parsed = JSON.parse(strValue)
                                        if (Array.isArray(parsed)) {
                                            ingredientesValue = parsed.map((ing: any) => String(ing)).join('; ')
                                        } else {
                                            ingredientesValue = strValue
                                        }
                                    } catch {
                                        ingredientesValue = strValue
                                    }
                                } else {
                                    ingredientesValue = strValue
                                }
                            }
                        }

                        return {
                            ...item,
                            'Nombre': item.nombre_plato || item['Nombre'] || item.nombre || '',
                            tipo: item.tipo || item['Tipo'] || 'otro',
                            'Receta': getValue(item.receta || item['Receta'] || item.descripcion || item['Descripción'] || item.Descripción, ''),
                            'Calorías': getNumberValue(item.calorias || item.calories || item.kcal || item['Calorías'] || item.calorías),
                            'Proteínas (g)': getNumberValue(item.proteinas || item.protein || item.proteins || item['Proteínas'] || item['Proteínas (g)']),
                            'Carbohidratos (g)': getNumberValue(item.carbohidratos || item.carbs || item.carbohydrates || item['Carbohidratos'] || item['Carbohidratos (g)']),
                            'Grasas (g)': getNumberValue(item.grasas || item.fat || item.fats || item['Grasas'] || item['Grasas (g)']),
                            'Dificultad': getValue(item.dificultad || item['Dificultad'], 'Principiante'),
                            'Ingredientes': ingredientesValue || item['Ingredientes'] || '',
                            'Porciones': getValue(item.porciones || item['Porciones'], ''),
                            'Minutos': getValue(item.minutos || item['Minutos'], ''),
                            isExisting: true,
                            is_active: item.is_active !== false && item.activo !== false,
                            activo: item.is_active !== false && item.activo !== false,
                            activity_assignments: activityAssignments,
                            video_file_name: item.video_file_name || item['video_file_name'] || null,
                            video_url: item.video_url || '',
                            nombre_plato: item.nombre_plato || item.nombre || '',
                            nombre: item.nombre || item.nombre_plato || '',
                            ingredientes: ingredientesValue || '',
                            receta: getValue(item.receta || item['Receta'] || item.descripcion || item['Descripción'] || item.Descripción, ''),
                            calorias: getNumberValue(item.calorias || item.calories || item.kcal || item['Calorías'] || item.calorías),
                            proteinas: getNumberValue(item.proteinas || item.protein || item.proteins || item['Proteínas'] || item['Proteínas (g)']),
                            carbohidratos: getNumberValue(item.carbohidratos || item.carbs || item.carbohydrates || item['Carbohidratos'] || item['Carbohidratos (g)']),
                            grasas: getNumberValue(item.grasas || item.fat || item.fats || item['Grasas'] || item['Grasas (g)']),
                            dificultad: getValue(item.dificultad || item['Dificultad'], 'Principiante'),
                            porciones: getValue(item.porciones, ''),
                            minutos: getValue(item.minutos, '')
                        }
                    } else {
                        const normalizedType = normalizeExerciseType(item.tipo || item['Tipo de Ejercicio'] || '', allowedExerciseTypes)
                        return {
                            ...item,
                            'Nombre de la Actividad': item.nombre_ejercicio || item['Nombre de la Actividad'] || item.nombre || '',
                            'Descripción': item.descripcion || item['Descripción'] || '',
                            'Duración (min)': item.duracion_min || item['Duración (min)'] || '',
                            'Tipo de Ejercicio': normalizedType,
                            'Nivel de Intensidad': item.intensidad || item['Nivel de Intensidad'] || '',
                            'Equipo Necesario': item.equipo || item['Equipo Necesario'] || '',
                            'Detalle de Series (peso-repeticiones-series)': item.detalle_series || item['Detalle de Series (peso-repeticiones-series)'] || '',
                            'Partes del Cuerpo': item.body_parts || item['Partes del Cuerpo'] || '',
                            'Calorías': item.calorias || item['Calorías'] || '',
                            isExisting: true,
                            is_active: item.is_active !== false,
                            activo: item.is_active !== false,
                            tipo_ejercicio: normalizedType,
                            activity_assignments: activityAssignments,
                            video_file_name: item.video_file_name || item['video_file_name'] || null
                        }
                    }
                })

                if (activityId > 0) {
                    const activityKey = String(activityId)
                    transformedExistingData = transformedExistingData.filter((item: any) => {
                        const assignments = item?.activity_assignments || {}
                        const activityIdNew = item?.activity_id_new || {}
                        const activityIdValue = item?.activity_id

                        if (assignments && typeof assignments === 'object' && activityKey in assignments) {
                            return true
                        }
                        if (activityIdNew && typeof activityIdNew === 'object' && activityKey in activityIdNew) {
                            return true
                        }
                        if (activityIdValue) {
                            if (typeof activityIdValue === 'number' && activityIdValue === Number(activityKey)) {
                                return true
                            }
                            if (typeof activityIdValue === 'object' && activityKey in activityIdValue) {
                                return true
                            }
                        }
                        return false
                    })
                }

                setExistingData(transformedExistingData)
                setCsvData(transformedExistingData)

                if (parentSetCsvData) {
                    const hasPersistentVideos = parentCsvData && parentCsvData.some((row: any) => row.video_url)
                    const hasCsvData = parentCsvData && parentCsvData.length > 1

                    if (hasPersistentVideos || hasCsvData) {
                        const latestExistingMap = new Map(
                            transformedExistingData.map((item: any) => [String(item.id), item])
                        )
                        const updatedParent = (parentCsvData || []).map((item: any) => {
                            const key = item && item.id !== undefined ? String(item.id) : null
                            if (item && item.isExisting && key && latestExistingMap.has(key)) {
                                const latest = latestExistingMap.get(key) as any
                                return {
                                    ...item,
                                    is_active: latest.is_active,
                                    activo: latest.activo,
                                    video_url: latest.video_url ?? item.video_url ?? '',
                                    bunny_video_id: latest.bunny_video_id ?? item.bunny_video_id ?? '',
                                    bunny_library_id: latest.bunny_library_id ?? item.bunny_library_id ?? '',
                                    video_thumbnail_url: latest.video_thumbnail_url ?? item.video_thumbnail_url ?? '',
                                    video_file_name: latest.video_file_name ?? item.video_file_name ?? ''
                                }
                            }
                            return item
                        })
                        const existingIds = new Set(
                            updatedParent
                                .filter((item: any) => item.isExisting && item.id !== undefined)
                                .map((item: any) => String(item.id))
                        )
                        const newExistingData = transformedExistingData.filter((item: any) => !existingIds.has(String(item.id)))
                        if (newExistingData.length > 0) {
                            const combinedData = [...updatedParent, ...newExistingData]
                            parentSetCsvData(combinedData)
                        } else {
                            parentSetCsvData(updatedParent)
                        }
                    } else {
                        parentSetCsvData(transformedExistingData)
                        setCsvData(transformedExistingData)
                    }
                }
            } else if (result?.error) {
                updateErrorState(`No se pudieron cargar los ${productCategory === 'nutricion' ? 'platos' : 'ejercicios'} existentes (${response.status}): ${result.error}`)
            }
        } catch (error) {
            console.error('❌ Error cargando datos existentes:', error)
            updateErrorState(`Error obteniendo ${productCategory === 'nutricion' ? 'platos' : 'ejercicios'} existentes: ${(error as any)?.message ?? 'Error desconocido'}`)
        } finally {
            setLoadingExisting(false)
            isLoadingDataRef.current = false
        }
    }, [
        activityId,
        coachId,
        productCategory,
        parentCsvData,
        parentSetCsvData,
        setLoadingExisting,
        setCsvData,
        setExistingData,
        setExerciseUsage,
        setActivityNamesMap,
        setActivityImagesMap,
        setRulesCount,
        updateErrorState
    ])

    return { loadExistingData }
}
