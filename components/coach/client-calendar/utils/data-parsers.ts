export const parseMaybeJson = (value: any): any => {
    if (!value) return null
    if (typeof value === 'string') {
        try {
            return JSON.parse(value)
        } catch {
            return null
        }
    }
    return value
}

export const normalizeKeyList = (raw: any): string[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((x: any) => String(x))
    if (typeof raw === 'object') return Object.keys(raw).map(k => String(k))
    return []
}

export const inferMetaFromKey = (key: string): { ejercicio_id: number; orden: number; bloque: number } => {
    const [baseStr, suffixStr] = String(key).split('_')
    const ejercicio_id = Number(baseStr)
    const orden = suffixStr !== undefined ? Number(suffixStr) : 1
    return {
        ejercicio_id: Number.isFinite(ejercicio_id) ? ejercicio_id : 0,
        orden: Number.isFinite(orden) ? orden : 1,
        bloque: 1
    }
}

export const normalizeNutritionContainerToObject = (raw: any): Record<string, any> => {
    if (!raw) return {}
    if (Array.isArray(raw)) {
        const obj: Record<string, any> = {}
        raw.map((x: any) => String(x)).forEach((k, idx) => {
            obj[k] = { ...inferMetaFromKey(k), orden: idx + 1 }
        })
        return obj
    }
    if (typeof raw === 'object') {
        const obj: Record<string, any> = { ...raw }
        Object.keys(obj).forEach((k) => {
            const v = obj[k]
            if (v === true) {
                obj[k] = inferMetaFromKey(k)
            } else if (v && typeof v === 'object') {
                const inferred = inferMetaFromKey(k)
                obj[k] = {
                    ...inferred,
                    ...v,
                    ejercicio_id:
                        v.ejercicio_id !== undefined && v.ejercicio_id !== null
                            ? Number(v.ejercicio_id)
                            : inferred.ejercicio_id,
                    orden:
                        v.orden !== undefined && v.orden !== null
                            ? Number(v.orden)
                            : inferred.orden,
                    bloque:
                        v.bloque !== undefined && v.bloque !== null
                            ? Number(v.bloque)
                            : inferred.bloque
                }
            } else {
                obj[k] = inferMetaFromKey(k)
            }
        })
        return obj
    }
    return {}
}

export const updateKeyContainer = (raw: any, oldKey: string, newKey?: string): any => {
    if (!raw) {
        if (!newKey) return raw
        return [newKey]
    }
    if (Array.isArray(raw)) {
        const list = raw.map((x: any) => String(x)).filter((k: string) => k !== oldKey)
        if (newKey) list.push(newKey)
        return list
    }
    if (typeof raw === 'object') {
        const obj: any = { ...raw }
        delete obj[oldKey]
        if (newKey) {
            const inferred = inferMetaFromKey(newKey)
            obj[newKey] = obj[newKey] && typeof obj[newKey] === 'object' ? { ...inferred, ...obj[newKey] } : inferred
        }
        return obj
    }
    return raw
}

export const buildNewNutritionPayload = (plate: any) => {
    return {
        nombre: plate?.nombre_plato || plate?.nombre || '',
        ingredientes: plate?.ingredientes ?? null,
        macros: {
            proteinas: plate?.proteinas ?? 0,
            carbohidratos: plate?.carbohidratos ?? 0,
            grasas: plate?.grasas ?? 0,
            calorias: plate?.calorias ?? 0,
            minutos: plate?.minutos ?? 0
        }
    }
}

export const parseDetalleSeries = (detalleSeriesStr: string): any[] => {
    if (!detalleSeriesStr || typeof detalleSeriesStr !== 'string') return []
    const matches = detalleSeriesStr.match(/\(([^)]+)\)/g)
    if (!matches) return []
    return matches.map(match => {
        const content = match.replace(/[()]/g, '')
        const parts = content.split('-')
        if (parts.length >= 3) {
            return {
                peso: parseFloat(parts[0]) || 0,
                repeticiones: parseInt(parts[1]) || 0,
                series: parseInt(parts[2]) || 0
            }
        }
        return null
    }).filter(Boolean)
}

export const getSeriesBlocks = (detalleSeries: any, duracion?: number, ejercicioId?: string, minutosJson?: any): Array<{ bloque: number, peso: number, reps: number, series: number, minutos?: number }> => {
    const blocks: Array<{ bloque: number, peso: number, reps: number, series: number, minutos?: number }> = []
    if (!detalleSeries) return blocks

    const getMinutosForBlock = (blockKey: string): number | undefined => {
        if (!minutosJson || !ejercicioId) return undefined
        let minutosData: any = minutosJson
        if (typeof minutosJson === 'string') {
            try {
                minutosData = JSON.parse(minutosJson)
            } catch (e) {
                return undefined
            }
        }
        if (!minutosData || typeof minutosData !== 'object') return undefined
        let minutos = minutosData[blockKey]
        if (minutos === undefined && ejercicioId) {
            const baseId = ejercicioId.split('_')[0]
            const matchingKey = Object.keys(minutosData).find(key => {
                const keyBaseId = key.split('_')[0]
                const keySuffix = key.split('_')[1]
                return keyBaseId === baseId && keySuffix === blockKey.split('_')[1]
            })
            if (matchingKey) minutos = minutosData[matchingKey]
        }
        return minutos !== undefined && minutos !== null ? Number(minutos) : undefined
    }

    if (typeof detalleSeries === 'string' && detalleSeries.includes('(')) {
        const parsed = parseDetalleSeries(detalleSeries)
        if (parsed.length > 0) {
            return parsed.map((serie, index) => {
                const blockKey = ejercicioId ? `${ejercicioId.split('_')[0]}_${index + 1}` : undefined
                const minutosBlock = blockKey ? getMinutosForBlock(blockKey) : undefined
                const minutos = minutosBlock !== undefined ? minutosBlock : (duracion ? Math.floor(duracion / parsed.length) : undefined)
                return {
                    bloque: index + 1,
                    peso: serie.peso,
                    reps: serie.repeticiones,
                    series: serie.series,
                    minutos: minutos
                }
            })
        }
    }

    if (typeof detalleSeries === 'object' && detalleSeries.series && detalleSeries.repeticiones) {
        const peso = detalleSeries.peso || detalleSeries.descanso || 0
        const blockKey = ejercicioId || '1'
        const minutos = getMinutosForBlock(blockKey) || duracion
        return [{
            bloque: 1,
            peso: peso,
            reps: detalleSeries.repeticiones,
            series: detalleSeries.series,
            minutos: minutos
        }]
    }

    if (Array.isArray(detalleSeries) && detalleSeries.length > 0) {
        return detalleSeries.map((serie, index) => {
            const blockKey = ejercicioId ? `${ejercicioId.split('_')[0]}_${index + 1}` : undefined
            const minutos = blockKey ? getMinutosForBlock(blockKey) : (duracion ? Math.floor(duracion / detalleSeries.length) : undefined)
            return {
                bloque: index + 1,
                peso: serie.peso || 0,
                reps: serie.repeticiones || 0,
                series: serie.series || 0,
                minutos: minutos
            }
        })
    }

    if (typeof detalleSeries === 'object' && detalleSeries.detalle_series) {
        if (typeof detalleSeries.detalle_series === 'string') {
            const parsed = parseDetalleSeries(detalleSeries.detalle_series)
            if (parsed.length > 0) {
                return parsed.map((serie, index) => {
                    const blockKey = ejercicioId ? `${ejercicioId.split('_')[0]}_${index + 1}` : undefined
                    const minutos = blockKey ? getMinutosForBlock(blockKey) : (duracion ? Math.floor(duracion / parsed.length) : undefined)
                    return {
                        bloque: index + 1,
                        peso: serie.peso,
                        reps: serie.repeticiones,
                        series: serie.series,
                        minutos: minutos
                    }
                })
            }
        }
    }
    return blocks
}

export const getCaloriasForBlock = (blockKey: string, ejercicioId?: string, caloriasJson?: any): number | undefined => {
    if (!caloriasJson || !ejercicioId) return undefined
    let caloriasData: any = caloriasJson
    if (typeof caloriasJson === 'string') {
        try {
            caloriasData = JSON.parse(caloriasJson)
        } catch {
            return undefined
        }
    }
    if (!caloriasData || typeof caloriasData !== 'object') return undefined
    let kcal = caloriasData[blockKey]
    if (kcal === undefined && ejercicioId) {
        const baseId = ejercicioId.split('_')[0]
        const matchingKey = Object.keys(caloriasData).find(key => {
            const keyBaseId = key.split('_')[0]
            const keySuffix = key.split('_')[1]
            return keyBaseId === baseId && keySuffix === blockKey.split('_')[1]
        })
        if (matchingKey) kcal = caloriasData[matchingKey]
    }
    return kcal !== undefined && kcal !== null ? Number(kcal) : undefined
}

export const formatSeries = (detalleSeries: any): string => {
    if (!detalleSeries) return 'Sin series'
    if (typeof detalleSeries === 'string' && detalleSeries.includes('(')) {
        const parsed = parseDetalleSeries(detalleSeries)
        if (parsed.length > 0) {
            return parsed.map((serie, index) => {
                const prefix = parsed.length > 1 ? `S${index + 1}: ` : ''
                return `${prefix}${serie.series}s × ${serie.repeticiones}r × ${serie.peso}kg`
            }).join(' | ')
        }
    }
    if (typeof detalleSeries === 'object' && detalleSeries.series && detalleSeries.repeticiones) {
        const peso = detalleSeries.peso || detalleSeries.descanso || 0
        return `${detalleSeries.series}s × ${detalleSeries.repeticiones}r × ${peso}kg`
    }
    if (Array.isArray(detalleSeries) && detalleSeries.length > 0) {
        return detalleSeries.map((serie, index) => {
            const peso = serie.peso || 0
            const prefix = detalleSeries.length > 1 ? `B${index + 1}: ` : ''
            return `${prefix}${serie.series || 0}s × ${serie.repeticiones || 0}r × ${peso}kg`
        }).join(' | ')
    }
    if (typeof detalleSeries === 'object' && detalleSeries.detalle_series) {
        if (typeof detalleSeries.detalle_series === 'string') {
            const parsed = parseDetalleSeries(detalleSeries.detalle_series)
            if (parsed.length > 0) {
                return parsed.map((serie, index) => {
                    const prefix = parsed.length > 1 ? `S${index + 1}: ` : ''
                    return `${prefix}${serie.series}s × ${serie.repeticiones}r × ${serie.peso}kg`
                }).join(' | ')
            }
        }
    }
    return 'Sin series'
}
