// Parser CSV simple y directo
// NUEVO Formato esperado (sin Mes/Semana/Día):
// Nombre de la Actividad, Descripción, Duración (min), Tipo de Ejercicio, Nivel de Intensidad,
// Equipo Necesario, Detalle de Series (peso-repeticiones-series), Partes del Cuerpo, Calorías

export interface SimpleExerciseData {
  nombre?: string
  descripcion?: string
  duracion_min?: number
  tipo_ejercicio?: string
  nivel_intensidad?: string
  equipo_necesario?: string
  detalle_series?: string
  partes_cuerpo?: string
  calorias?: number
  // También aceptamos objetos con claves originales del CSV (entre corchetes)
  [key: string]: any
}

/**
 * Parsea una fila del CSV de manera simple y directa
 */
export function parseSimpleCSVRow(row: any): SimpleExerciseData | null {
  try {
    // console.log('🔄 Parseando fila simple:', row)
    
    // Extraer datos directamente por nombre de columna (nuevo formato)
    const nombre = row['Nombre de la Actividad'] || row.nombre || ''
    const descripcion = row['Descripción'] || row.descripcion || ''
    const duracion_min = parseInt(row['Duración (min)'] || row.duracion_min) || 0
    const tipo_ejercicio = row['Tipo de Ejercicio'] || row.tipo_ejercicio || ''
    const nivel_intensidad = row['Nivel de Intensidad'] || row.nivel_intensidad || ''
    const equipo_necesario = row['Equipo Necesario'] || row.equipo_necesario || ''
    const detalle_series = row['Detalle de Series (peso-repeticiones-series)'] || row.detalle_series || ''
    const partes_cuerpo = row['Partes del Cuerpo'] || row.partes_cuerpo || row.body_parts || ''
    const calorias = row['Calorías'] ? parseInt(row['Calorías']) : (row.calorias ? parseInt(row.calorias) : undefined)
    

    // Validar campos mínimos
    if (!nombre) {
      console.warn('❌ Fila incompleta:', { nombre })
      return null
    }

    const result = {
      nombre,
      descripcion,
      duracion_min,
      tipo_ejercicio,
      nivel_intensidad,
      equipo_necesario,
      detalle_series,
      partes_cuerpo,
      calorias
    }

    // console.log('✅ Fila parseada:', result)
    return result
  } catch (error) {
    console.error('❌ Error parsing CSV row:', error)
    return null
  }
}

/**
 * Valida que el CSV tenga las columnas básicas
 */
export function validateSimpleCSVHeaders(headers: string[]): boolean {
  // console.log('🔍 Validando headers:', headers)
  
  const requiredHeaders = [
    'Nombre de la Actividad',
    'Descripción',
    'Duración (min)',
    'Tipo de Ejercicio',
    'Nivel de Intensidad',
    'Equipo Necesario',
    'Detalle de Series (peso-repeticiones-series)',
    'Partes del Cuerpo',
    'Calorías'
  ]

  const foundHeaders = requiredHeaders.filter(required => 
    headers.some(header => header === required)
  )

  // console.log('✅ Headers encontrados:', foundHeaders.length, 'de', requiredHeaders.length)
  return foundHeaders.length >= 6 // Al menos 6 de los headers requeridos
}
