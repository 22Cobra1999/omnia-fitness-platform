import { useState, useEffect } from "react"
import { normalizeExerciseType, normalizeName } from "../utils/csv-helpers"

interface UseCatalogLoadingProps {
    mode: string
    productCategory: string
    coachId: string
}

export function useCatalogLoading({ mode, productCategory, coachId }: UseCatalogLoadingProps) {
    const [existingCatalog, setExistingCatalog] = useState<any[]>([])

    useEffect(() => {
        if (mode !== "existentes" || !coachId || coachId === "") {
            return
        }

        const loadCatalog = async () => {
            try {
                const response = await fetch(`/api/existing-exercises?category=${productCategory}`)
                const json = await response.json()

                if (!response.ok || json?.success === false) {
                    console.error("❌ Error cargando catálogo de existentes:", json?.error || response.statusText)
                    setExistingCatalog([])
                    return
                }

                const catalogItems = (json?.exercises || [])
                    .map((item: any) => {
                        if (productCategory === "nutricion") {
                            return {
                                ...item,
                                name: item?.name || item?.nombre || item?.nombre_plato || "",
                                descripcion: item?.descripcion ?? item?.receta ?? "",
                                receta: item?.receta ?? "",
                                calorias: item?.calorias ?? "",
                                proteinas: item?.proteinas ?? "",
                                carbohidratos: item?.carbohidratos ?? "",
                                grasas: item?.grasas ?? "",
                                ingredientes: item?.ingredientes ?? "",
                                porciones: item?.porciones ?? "",
                                minutos: item?.minutos ?? "",
                                video_url: item?.video_url ?? "",
                            }
                        }

                        const detalleSeries = (() => {
                            const raw = item?.detalle_series
                            if (!raw) return ""
                            if (typeof raw === "string") return raw
                            if (Array.isArray(raw)) {
                                return raw
                                    .map((serie: any) => `(${serie?.peso ?? ""}-${serie?.repeticiones ?? ""}-${serie?.series ?? ""})`)
                                    .join(";")
                            }
                            if (typeof raw === "object") {
                                try {
                                    const seriesArray = Array.isArray((raw as any).series) ? (raw as any).series : Object.values(raw as any)
                                    return Array.isArray(seriesArray)
                                        ? seriesArray
                                            .map((serie: any) => `(${serie?.peso ?? ""}-${serie?.repeticiones ?? ""}-${serie?.series ?? ""})`)
                                            .join(";")
                                        : ""
                                } catch {
                                    return ""
                                }
                            }
                            return ""
                        })()

                        const normalizedType = normalizeExerciseType(item?.tipo_ejercicio || item?.tipo || "")

                        return {
                            ...item,
                            name: item?.name || item?.nombre_ejercicio || "",
                            descripcion: item?.descripcion ?? "",
                            duracion_min: item?.duracion_min ?? "",
                            tipo_ejercicio: normalizedType,
                            nivel_intensidad: item?.nivel_intensidad ?? item?.intensidad ?? "",
                            equipo_necesario: item?.equipo_necesario ?? item?.equipo ?? "",
                            detalle_series: detalleSeries,
                            partes_cuerpo: item?.partes_cuerpo ?? item?.body_parts ?? "",
                            calorias: item?.calorias ?? "",
                            video_url: item?.video_url ?? "",
                        }
                    })
                    .filter((item: any) => !!normalizeName(item?.name))

                setExistingCatalog(catalogItems)
            } catch (error) {
                console.error("❌ Error cargando catálogo de existentes:", error)
                setExistingCatalog([])
            }
        }

        loadCatalog()
    }, [mode, productCategory, coachId])

    return { existingCatalog, setExistingCatalog }
}
