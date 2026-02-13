import { bodyPartsOptions, bodyPartSynonyms, equipmentOptions, NONE_VALUES } from '../constants'

export const normalizeCatalogText = (value: string) => (
    value
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
)

export const parseCatalogEntries = (raw: any): string[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String)
    return raw
        .toString()
        .split(/;|,|\n/)
        .map((entry: string) => entry.trim())
        .filter(Boolean)
}

export const extractBunnyVideoIdFromUrl = (url: string): string | null => {
    try {
        const match = String(url || '').match(/\/([a-f0-9-]{8,})\/(?:playlist\.m3u8|thumbnail\.jpg)(?:\?|$)/i)
        return match?.[1] || null
    } catch {
        return null
    }
}

// Lookup Map Generators
export const createBodyPartsLookup = () => {
    const map = new Map<string, string>()

    const addEntry = (rawValue: string, canonical: string) => {
        const normalized = normalizeCatalogText(rawValue)
        if (!normalized) return
        if (!map.has(normalized)) {
            map.set(normalized, canonical)
        }
    }

    bodyPartsOptions.forEach(part => {
        addEntry(part, part)

        const normalized = normalizeCatalogText(part)
        const singular = normalized.replace(/(es|s)$/, '')
        if (singular && singular !== normalized) {
            addEntry(singular, part)
        }

        const synonyms = bodyPartSynonyms[part] || []
        synonyms.forEach(syn => {
            addEntry(syn, part)
            const synNormalized = normalizeCatalogText(syn)
            const synSingular = synNormalized.replace(/(es|s)$/, '')
            if (synSingular && synSingular !== synNormalized) {
                addEntry(synSingular, part)
            }
        })
    })

    return map
}

export const createEquipmentLookup = () => {
    const map = new Map<string, string>()
    equipmentOptions.forEach(item => {
        map.set(normalizeCatalogText(item), item)
    })
    return map
}

const bodyPartsLookup = createBodyPartsLookup()
const equipmentLookup = createEquipmentLookup()

export const normalizeIntensityValue = (raw: any) => {
    const original = raw?.toString?.().trim() ?? ''
    if (!original) {
        return { value: '', issue: null }
    }
    const normalized = normalizeCatalogText(original)
    if (NONE_VALUES.has(normalized)) {
        return { value: '', issue: null }
    }

    const altoValues = ['alto', 'alta', 'high', 'intenso', 'intensa', 'intensidad alta']
    const medioValues = ['medio', 'media', 'moderado', 'moderada', 'medium', 'intermedio', 'intermedia']
    const bajoValues = ['bajo', 'baja', 'low', 'suave', 'leve']

    if (altoValues.includes(normalized)) return { value: 'Alto', issue: null }
    if (medioValues.includes(normalized)) return { value: 'Medio', issue: null }
    if (bajoValues.includes(normalized)) return { value: 'Bajo', issue: null }

    return { value: original, issue: `Intensidad no permitida: "${original}"` }
}

export const normalizeBodyParts = (raw: any) => {
    const entries = parseCatalogEntries(raw)
    const valid: string[] = []
    const invalid: string[] = []

    entries.forEach(entry => {
        const normalized = normalizeCatalogText(entry)
        if (!normalized || NONE_VALUES.has(normalized)) {
            return
        }
        let match = bodyPartsLookup.get(normalized)
        if (!match) {
            const singularCandidate = normalized.replace(/(es|s)$/, '')
            if (singularCandidate && singularCandidate !== normalized) {
                match = bodyPartsLookup.get(singularCandidate)
            }
        }
        if (match) {
            if (!valid.includes(match)) {
                valid.push(match)
            }
        } else {
            invalid.push(entry)
        }
    })

    return { valid, invalid }
}

export const normalizeEquipment = (raw: any) => {
    const entries = parseCatalogEntries(raw)
    const valid: string[] = []
    const invalid: string[] = []

    entries.forEach(entry => {
        const normalized = normalizeCatalogText(entry)
        if (!normalized || NONE_VALUES.has(normalized)) {
            return
        }
        const match = equipmentLookup.get(normalized)
        if (match) {
            if (!valid.includes(match)) {
                valid.push(match)
            }
        } else {
            // If not in official catalog but has content, accept as custom equipment
            if (!valid.includes(entry)) {
                valid.push(entry)
            }
        }
    })

    return { valid, invalid }
}

export const normalizeExerciseType = (rawType: string, allowedTypes: string[] = []): string => {
    const base = (rawType || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

    if (!base) return allowedTypes[0] || 'fuerza'

    if (allowedTypes.includes(base)) return base

    if (base.includes('strength') || base.includes('fuerz')) return 'fuerza'
    if (base.includes('cardio') || base.includes('resistencia')) return 'cardio'
    if (base.includes('hiit') || base.includes('interval')) return 'hiit'
    if (base.includes('movil') || base.includes('mobility')) return 'movilidad'
    if (base.includes('flex') || base.includes('stretch')) return 'flexibilidad'
    if (base.includes('equilibr') || base.includes('balance')) return 'equilibrio'
    if (base.includes('funcion') || base.includes('functional')) return 'funcional'

    return allowedTypes[0] || 'fuerza'
}

export const getNumberValue = (value: any): number => {
    if (value !== undefined && value !== null && value !== '' && value !== 'null') {
        const num = Number(value)
        return isNaN(num) ? 0 : num
    }
    return 0
}

export const getStringValue = (value: any): string => {
    if (value !== undefined && value !== null && value !== '' && value !== 'null') {
        return String(value)
    }
    return ''
}

export const getValue = (value: any, defaultValue: any = ''): any => {
    if (value !== undefined && value !== null && value !== '') {
        return value
    }
    return defaultValue
}

export const normalizeName = (name: string): string => {
    if (!name) return ''
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim()
}

export const getExerciseName = (item: any): string => {
    if (!item) return ''
    return item['Nombre de la Actividad']
        || item.nombre_ejercicio
        || item.Nombre
        || item.nombre
        || item.nombre_actividad
        || item.name
        || item.nombre_plato
        || ''
}

export const getRowIdentifier = (item: any, index?: number): string => {
    if (!item) return ''
    if (item.id) return `id_${item.id}`
    if (item.csvRowId) return `csvRow_${item.csvRowId}`
    if (item.tempRowId) return `temp_${item.tempRowId}`
    if (item.csvFileTimestamp) {
        const suffix = item.csvRowId || index !== undefined ? `${item.csvFileTimestamp}_${index ?? 0}` : `${item.csvFileTimestamp}`
        return `csv_${suffix}`
    }
    const name = normalizeName(getExerciseName(item))
    const desc = (item['Descripción'] || item.descripcion || '').toString().toLowerCase().trim()
    const duration = (item['Duración (min)'] || item.duracion_min || '').toString().trim().toLowerCase()
    const calories = (item['Calorías'] || item.calorias || '').toString().trim().toLowerCase()
    return `row_${name}_${desc}_${duration}_${calories}`
}

export const getVideoDisplayName = (
    fileName?: string,
    url?: string,
    bunnyVideoId?: string | null,
    bunnyVideoTitles: Record<string, string> = {}
): string => {
    const extractBunnyGuidFromUrl = (raw?: string): string | null => {
        if (!raw || typeof raw !== 'string') return null
        try {
            const guidMatch = raw.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
            return guidMatch?.[1] || null
        } catch {
            return null
        }
    }

    const bunnyIdRaw = typeof bunnyVideoId === 'string' ? bunnyVideoId.trim() : ''
    const bunnyIdFromUrl = extractBunnyGuidFromUrl(url)
    const bunnyId = bunnyIdRaw || bunnyIdFromUrl || ''

    if (bunnyId && bunnyVideoTitles[bunnyId]) {
        return bunnyVideoTitles[bunnyId]
    }

    const cleanedFileName = typeof fileName === 'string' ? fileName.trim() : ''
    const looksSynthetic =
        cleanedFileName.startsWith('video-') ||
        /^\d{10,}_.+/.test(cleanedFileName) ||
        cleanedFileName.startsWith('manual-')

    if (cleanedFileName && !looksSynthetic) return cleanedFileName
    if (!url) return ''

    try {
        const urlParts = url.split('/')
        const lastPart = urlParts[urlParts.length - 1]
        if (lastPart) {
            const clean = lastPart.split('?')[0]
            return clean || 'Video'
        }
    } catch {
        // ignore
    }

    return 'Video'
}

export const getExerciseTypeColor = (type: string): string => {
    const normalized = normalizeExerciseType(type)
    const colors: { [key: string]: string } = {
        fuerza: 'bg-orange-200',
        cardio: 'bg-orange-300',
        hiit: 'bg-orange-400',
        movilidad: 'bg-rose-300',
        flexibilidad: 'bg-pink-300',
        equilibrio: 'bg-pink-200',
        funcional: 'bg-rose-200',
        general: 'bg-orange-300'
    }
    return colors[normalized] || colors.general
}

export const getExerciseTypeLabel = (type: string): string => {
    const normalized = normalizeExerciseType(type)
    const labels: { [key: string]: string } = {
        fuerza: 'Fuerza',
        cardio: 'Cardio',
        hiit: 'HIIT',
        movilidad: 'Movilidad',
        flexibilidad: 'Flexibilidad',
        equilibrio: 'Equilibrio',
        funcional: 'Funcional',
        general: 'General'
    }
    return labels[normalized] || (type || '').toString()
}

export const getNutritionTypeColor = (rawType: string): string => {
    const type = (rawType || '').toString().toLowerCase().trim()
    if (type.includes('desayuno')) return 'bg-orange-200'
    if (type.includes('snack') || type.includes('colación') || type.includes('colacion')) return 'bg-orange-300'
    if (type.includes('almuerzo')) return 'bg-orange-400'
    if (type.includes('cena')) return 'bg-rose-300'
    return 'bg-orange-300'
}
