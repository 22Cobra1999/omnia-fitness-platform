// Funciones para parsear CSV de fitness

export interface FitnessSeries {
  peso: number
  repeticiones: number
  series: number
}

export interface FitnessExerciseData {
  semana: number
  dia: string
  nombre: string
  descripcion: string
  duracion_min: number
  tipo_ejercicio: string
  nivel_intensidad: string
  equipo_necesario: string
  one_rm?: number
  detalle_series: FitnessSeries[]
  video_url?: string
}

// Interfaz para insertar en fitness_exercises
export interface FitnessExerciseInsert {
  activity_id: number
  coach_id: string // Agregado coach_id requerido
  semana: number
  día: number // Convertido a número usando dayToNumber
  nombre_actividad: string
  descripción: string
  duracion_min?: number // Made optional
  tipo_ejercicio: string
  nivel_intensidad: string
  equipo_necesario: string
  one_rm?: number
  detalle_series?: string // Formato original del CSV, made optional
  video_url?: string
}

/**
 * Parsea el formato de series: [(33-10-3);(80-8-2);(32-11-1)]
 * Retorna un array de objetos con peso, repeticiones y series
 */
export function parseSeriesString(seriesString: string): FitnessSeries[] {
  if (!seriesString || seriesString.trim() === '') {
    return []
  }

  try {
    // Remover corchetes externos y dividir por punto y coma
    const cleanString = seriesString.replace(/^\[|\]$/g, '')
    const seriesBlocks = cleanString.split(';').map(block => block.trim())
    
    return seriesBlocks.map((block, index) => {
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
    }).filter(series => series.peso > 0 || series.repeticiones > 0) // Filtrar series válidas
  } catch (error) {
    console.error('Error parsing series string:', seriesString, error)
    return []
  }
}

/**
 * Convierte el día de la semana a número
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
 * Parsea una fila del CSV de fitness
 */
export function parseFitnessCSVRow(row: any): FitnessExerciseData | null {
  try {
    // console.log('🔄 Parseando fila CSV:', row)
    
    // Validar que tengamos los campos mínimos
    if (!row['Semana'] || !row['Día'] || !row['Nombre de la Actividad']) {
      console.warn('❌ Fila CSV incompleta - campos mínimos faltantes:', {
        semana: row['Semana'],
        dia: row['Día'],
        nombre: row['Nombre de la Actividad']
      })
      return null
    }

    const semana = parseInt(row['Semana']) || 1
    const dia = dayToNumber(row['Día'])
    const nombre = row['Nombre de la Actividad'].trim()
    const descripcion = row['Descripción']?.trim() || ''
    const duracion_min = parseInt(row['Duración (min)']) || 0
    const tipo_ejercicio = row['Tipo de Ejercicio']?.trim() || ''
    const nivel_intensidad = row['Nivel de Intensidad']?.trim() || ''
    const equipo_necesario = row['Equipo Necesario']?.trim() || ''
    const one_rm = row['1RM'] && row['1RM'].trim() !== '' ? parseFloat(row['1RM']) : undefined
    const detalle_series = parseSeriesString(row['Detalle de Series (peso-repeticiones-series)'] || '')
    
    // Procesar video_url - puede venir de 'video_url' o 'Video_File'
    let video_url = row['video_url']?.trim() || ''
    if (!video_url) {
      video_url = row['Video_File']?.trim() || ''
    }

    const result = {
      semana,
      dia: row['Día'], // Mantener el string original
      nombre,
      descripcion,
      duracion_min,
      tipo_ejercicio,
      nivel_intensidad,
      equipo_necesario,
      one_rm,
      detalle_series,
      video_url
    }

    // console.log('✅ Fila parseada exitosamente:', {
      nombre: result.nombre,
      semana: result.semana,
      dia: result.dia,
      duracion: result.duracion_min,
      series_count: result.detalle_series.length
    })

    return result
  } catch (error) {
    console.error('❌ Error parsing fitness CSV row:', row, error)
    return null
  }
}

/**
 * Convierte FitnessExerciseData a FitnessExerciseInsert para la base de datos
 */
export function convertToFitnessExerciseInsert(data: FitnessExerciseData, activityId: number, coachId: string): FitnessExerciseInsert {
  return {
    activity_id: activityId,
    coach_id: coachId,
    semana: data.semana,
    día: dayToNumber(data.dia),
    nombre_actividad: data.nombre,
    descripción: data.descripcion,
    duracion_min: data.duracion_min,
    tipo_ejercicio: data.tipo_ejercicio,
    nivel_intensidad: data.nivel_intensidad,
    equipo_necesario: data.equipo_necesario,
    one_rm: data.one_rm,
    detalle_series: data.detalle_series.length > 0 
      ? data.detalle_series.map(s => `(${s.peso}-${s.repeticiones}-${s.series})`).join(';')
      : '',
    video_url: data.video_url
  }
}

/**
 * Valida que el CSV tenga las columnas requeridas
 */
export function validateFitnessCSVHeaders(headers: string[]): boolean {
  // console.log('🔍 Validando headers del CSV:', headers)
  
  const requiredHeaders = [
    'Semana',
    'Día', 
    'Nombre de la Actividad',
    'Descripción',
    'Duración (min)',
    'Tipo de Ejercicio',
    'Nivel de Intensidad',
    'Equipo Necesario',
    '1RM',
    'Detalle de Series (peso-repeticiones-series)',
    'video_url',
    'Video_File'
  ]

  // Verificar que al menos 8 de los headers requeridos estén presentes
  const foundHeaders = requiredHeaders.filter(requiredHeader => 
    headers.some(header => 
      header.trim().toLowerCase() === requiredHeader.toLowerCase() ||
      header.trim().toLowerCase().includes(requiredHeader.toLowerCase().replace(/\s+/g, ''))
    )
  )

  // console.log('✅ Headers encontrados:', foundHeaders)
  // // console.log('📊 Total encontrados:', foundHeaders.length, 'de', requiredHeaders.length)

  // Si encontramos al menos 8 headers, consideramos válido
  if (foundHeaders.length >= 8) {
    // console.log('✅ CSV válido para fitness')
    return true
  }

  const missingHeaders = requiredHeaders.filter(header => 
    !headers.some(h => 
      h.trim().toLowerCase() === header.toLowerCase() ||
      h.trim().toLowerCase().includes(header.toLowerCase().replace(/\s+/g, ''))
    )
  )

  console.error('❌ Headers faltantes en CSV de fitness:', missingHeaders)
  console.error('📋 Headers disponibles:', headers)
  return false
}

/**
 * Formatea las series para mostrar en la UI
 */
export function formatSeriesForDisplay(series: FitnessSeries[]): string {
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
export function calculateTotalReps(series: FitnessSeries[]): number {
  return series.reduce((total, s) => total + (s.repeticiones * s.series), 0)
}

/**
 * Calcula el peso promedio de todas las series
 */
export function calculateAverageWeight(series: FitnessSeries[]): number {
  if (!series || series.length === 0) return 0
  
  const totalWeight = series.reduce((total, s) => total + s.peso, 0)
  return Math.round(totalWeight / series.length)
}




