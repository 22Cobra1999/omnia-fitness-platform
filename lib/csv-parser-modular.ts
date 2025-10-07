// Parser CSV para el nuevo esquema modular
// Formato esperado: Mes, Semana, Día, Nombre de la Actividad, Descripción, Duración (min), Tipo de Ejercicio, Nivel de Intensidad, Equipo Necesario, Detalle de Series (peso-repeticiones-series), Partes del Cuerpo, Calorías, video_url

export interface ModularExerciseData {
  mes?: number
  semana: number
  dia: string
  nombre: string
  descripcion: string
  duracion_min: number
  tipo_ejercicio: string
  nivel_intensidad: string
  equipo_necesario: string
  detalle_series: ParsedSeries[] // Array de series parseadas
  partes_cuerpo: string
  calorias?: number
  video_url?: string
}

export interface ParsedSeries {
  peso: number
  repeticiones: number
  series: number
}

/**
 * Parsea el formato de series: (80-8-4);(85-6-3);(90-4-2)
 * Retorna un array de objetos con peso, repeticiones y series
 */
export function parseSeriesString(seriesString: string): ParsedSeries[] {
  if (!seriesString || seriesString.trim() === '') {
    return []
  }

  try {
    // Dividir por punto y coma
    const seriesBlocks = seriesString.split(';').map(block => block.trim())
    
    return seriesBlocks.map((block) => {
      // Remover paréntesis y dividir por guión
      const cleanBlock = block.replace(/^\(|\)$/g, '')
      const [peso, repeticiones, series] = cleanBlock.split('-').map(val => {
        const num = parseFloat(val.trim())
        return isNaN(num) ? 0 : num
      })
      
      return {
        peso: peso || 0,
        repeticiones: repeticiones || 0,
        series: series || 1
      }
    }).filter(series => series.peso > 0 || series.repeticiones > 0)
  } catch (error) {
    console.error('Error parsing series string:', seriesString, error)
    return []
  }
}

/**
 * Convierte el día de la semana a número (1-7)
 */
export function dayToNumber(day: string): number {
  const dayMap: { [key: string]: number } = {
    'lunes': 1,
    'martes': 2,
    'miércoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6,
    'sabado': 6,
    'domingo': 7
  }
  
  return dayMap[day.toLowerCase()] || 1
}

/**
 * Función auxiliar para obtener valor de columna con múltiples variantes
 */
function getColumnValue(row: any, possibleNames: string[]): string {
  // console.log(`🔍 Buscando columna con nombres:`, possibleNames)
  // console.log(`🔍 Claves disponibles en la fila:`, Object.keys(row))
  
  // Primero intentar coincidencias exactas
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      // console.log(`✅ Mapeo exacto encontrado: "${name}" → "${row[name]}"`)
      return String(row[name]).trim()
    }
  }
  
  // Luego intentar coincidencias flexibles (ignorando espacios y case)
  const rowKeys = Object.keys(row)
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '')
    const foundKey = rowKeys.find(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '')
      return normalizedKey === normalizedName || 
             normalizedKey.includes(normalizedName) ||
             normalizedName.includes(normalizedKey)
    })
    
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      // console.log(`✅ Mapeo flexible encontrado: "${foundKey}" → "${name}"`)
      return String(row[foundKey]).trim()
    }
  }
  
  console.log(`❌ No se encontró columna para:`, possibleNames)
  return ''
}

/**
 * Parsea una fila del CSV con el nuevo formato
 */
export function parseModularCSVRow(row: any): ModularExerciseData | null {
  try {
    // console.log('🔄 Parseando fila CSV modular:', row)
    // console.log('🔍 Headers disponibles:', Object.keys(row))
    // console.log('🔍 Valores de la fila:', Object.values(row))
    
    // Validar campos mínimos con múltiples variantes
    const mes = parseInt(getColumnValue(row, ['Mes', 'mes', 'Mes '])) || 1
    const semana = parseInt(getColumnValue(row, ['Semana', 'semana', 'Semana '])) || 1
    const dia = getColumnValue(row, ['Día', 'día', 'Dia', 'dia', 'Día '])
    const nombre = getColumnValue(row, ['Nombre de la Actividad', 'nombre de la actividad', 'Nombre de la Actividad '])
    
    // console.log('🔍 Valores extraídos:', { mes, semana, dia, nombre })
    
    if (!semana || !dia || !nombre) {
      console.warn('❌ Fila CSV incompleta - campos mínimos faltantes:', {
        semana,
        dia,
        nombre,
        availableKeys: Object.keys(row)
      })
      return null
    }

    const descripcion = getColumnValue(row, ['Descripción', 'descripcion', 'Descripción '])
    const duracion_min = parseInt(getColumnValue(row, ['Duración (min)', 'duracion (min)', 'Duración (min) '])) || 0
    const tipo_ejercicio = getColumnValue(row, ['Tipo de Ejercicio', 'tipo de ejercicio', 'Tipo de Ejercicio '])
    const nivel_intensidad = getColumnValue(row, ['Nivel de Intensidad', 'nivel de intensidad', 'Nivel de Intensidad '])
    const equipo_necesario = getColumnValue(row, ['Equipo Necesario', 'equipo necesario', 'Equipo Necesario '])
    const detalle_series_str = getColumnValue(row, ['Detalle de Series (peso-repeticiones-series)', 'detalle de series (peso-repeticiones-series)', 'Detalle de Series (peso-repeticiones-series) '])
    const partes_cuerpo = getColumnValue(row, ['Partes del Cuerpo', 'partes del cuerpo', 'Partes del Cuerpo '])
    const calorias_str = getColumnValue(row, ['Calorías', 'calorias', 'Calorías '])
    const calorias = calorias_str ? parseInt(calorias_str) : undefined
    const video_url = getColumnValue(row, ['video_url', 'Video_url', 'video_url '])

    const result = {
      mes,
      semana,
      dia,
      nombre,
      descripcion,
      duracion_min,
      tipo_ejercicio,
      nivel_intensidad,
      equipo_necesario,
      detalle_series: parseSeriesString(detalle_series_str),
      partes_cuerpo,
      calorias,
      video_url
    }

    // console.log('✅ Fila parseada exitosamente:', {
      mes: result.mes,
      nombre: result.nombre,
      semana: result.semana,
      dia: result.dia,
      duracion: result.duracion_min,
      series_count: result.detalle_series.length,
      series: result.detalle_series
    })

    return result
  } catch (error) {
    console.error('❌ Error parsing modular CSV row:', row, error)
    return null
  }
}

/**
 * Valida que el CSV tenga las columnas requeridas para el formato modular
 */
export function validateModularCSVHeaders(headers: string[]): boolean {
  // console.log('🔍 Validando headers del CSV modular:', headers)
  
  const requiredHeaders = [
    'Mes',
    'Semana',
    'Día', 
    'Nombre de la Actividad',
    'Descripción',
    'Duración (min)',
    'Tipo de Ejercicio',
    'Nivel de Intensidad',
    'Equipo Necesario',
    'Detalle de Series (peso-repeticiones-series)',
    'Partes del Cuerpo',
    'Calorías',
    'video_url'
  ]

  // Función para normalizar headers
  const normalizeHeader = (header: string) => 
    header.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '')

  // Verificar que al menos 8 de los headers requeridos estén presentes (más flexible)
  const foundHeaders = requiredHeaders.filter(requiredHeader => {
    const normalizedRequired = normalizeHeader(requiredHeader)
    return headers.some(header => {
      const normalizedHeader = normalizeHeader(header)
      return normalizedHeader === normalizedRequired || 
             normalizedHeader.includes(normalizedRequired) ||
             normalizedRequired.includes(normalizedHeader)
    })
  })

  // console.log('✅ Headers encontrados:', foundHeaders)
  // // console.log('📊 Total encontrados:', foundHeaders.length, 'de', requiredHeaders.length)

  // Si encontramos al menos 8 headers, consideramos válido (más flexible)
  if (foundHeaders.length >= 8) {
    // console.log('✅ CSV válido para esquema modular')
    return true
  }

  const missingHeaders = requiredHeaders.filter(header => {
    const normalizedRequired = normalizeHeader(header)
    return !headers.some(h => {
      const normalizedHeader = normalizeHeader(h)
      return normalizedHeader === normalizedRequired || 
             normalizedHeader.includes(normalizedRequired) ||
             normalizedRequired.includes(normalizedHeader)
    })
  })

  console.error('❌ Headers faltantes en CSV modular:', missingHeaders)
  console.error('📋 Headers disponibles:', headers)
  return false
}

/**
 * Formatea las series para mostrar en la UI
 */
export function formatSeriesForDisplay(series: ParsedSeries[]): string {
  if (!series || series.length === 0) {
    return 'Sin series definidas'
  }

  return series.map(s => 
    `${s.peso}kg × ${s.repeticiones} reps × ${s.series} series`
  ).join(' | ')
}

/**
 * Calcula el total de repeticiones de todas las series
 */
export function calculateTotalReps(series: ParsedSeries[]): number {
  if (!series || series.length === 0) return 0
  return series.reduce((total, s) => total + (s.repeticiones * s.series), 0)
}

/**
 * Calcula el peso promedio de todas las series
 */
export function calculateAverageWeight(series: ParsedSeries[]): number {
  if (!series || series.length === 0) return 0
  
  const totalWeight = series.reduce((total, s) => total + s.peso, 0)
  return Math.round(totalWeight / series.length)
}
