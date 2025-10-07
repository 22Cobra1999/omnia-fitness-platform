import { useState, useCallback } from 'react'

export interface CSVValidation {
  isValid: boolean
  errors: Array<{
    row: number
    column: number
    message: string
  }>
}

export interface UseCSVManagementReturn {
  csvData: string[][]
  setCsvData: (data: string[][]) => void
  csvValidation: CSVValidation | null
  setCsvValidation: (validation: CSVValidation | null) => void
  selectedRows: Set<number>
  setSelectedRows: (rows: Set<number>) => void
  csvFileName: string
  setCsvFileName: (name: string) => void
  csvLoadedFromFile: boolean
  setCsvLoadedFromFile: (loaded: boolean) => void
  normalizeDayName: (dayInput: string) => string
  addCSVRow: () => void
  removeCSVRow: (rowIndex: number) => void
  updateCSVCell: (rowIndex: number, colIndex: number, value: string) => void
  updateCSVValidation: (data: string[][]) => void
  handleRowSelection: (rowIndex: number) => void
}

export function useCSVManagement(productCategory: 'fitness' | 'nutricion'): UseCSVManagementReturn {
  // Datos de ejemplo para fitness
  const getDefaultFitnessData = (): string[][] => {
    const headers = [
      'Semana', 'Día', 'Nombre de la Actividad', 'Descripción', 
      'Duración (min)', 'Tipo de Ejercicio', 'Nivel de Intensidad', 
      'Equipo Necesario', '1RM', 'Detalle de Series (peso-repeticiones-series)', 'Partes del Cuerpo', 'Calorías', 'video_url'
    ]
    
    const exampleRows = [
      ['1', 'Lunes', 'Press de Banca', 'Ejercicio principal para pecho', '45', 'Fuerza', 'Alto', 'Barra, Banco', '100', '(80-8-4);(85-6-3);(90-4-2)', 'Pecho;Hombros;Tríceps', '350', ''],
      ['2', 'Lunes', 'Sentadillas', 'Ejercicio fundamental para piernas', '60', 'Fuerza', 'Alto', 'Barra, Rack', '120', '(100-6-4);(110-5-3);(120-3-2)', 'Piernas;Glúteos', '420', ''],
      ['3', 'Lunes', 'Remo con Barra', 'Ejercicio para espalda', '50', 'Fuerza', 'Medio', 'Barra, Discos', '90', '(70-8-4);(75-6-3);(80-5-2)', 'Espalda;Bíceps', '280', ''],
      ['4', 'Lunes', 'Press Militar', 'Ejercicio para hombros', '40', 'Fuerza', 'Medio', 'Barra, Rack', '80', '(60-6-4);(65-5-3);(70-4-2)', 'Hombros;Tríceps', '200', '']
    ]
    
    return [headers, ...exampleRows]
  }

  // Datos de ejemplo para nutrición
  const getDefaultNutritionData = (): string[][] => {
    const headers = [
      'Día', 'Comida', 'Descripción', 'Horario', 'Calorías', 
      'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Fibra (g)', 'Partes del Cuerpo', 'video_url'
    ]
    
    const exampleRows = [
      ['Lunes', 'Desayuno', 'Avena con frutas y proteína', '08:00', '450', '25', '60', '12', '8', 'Sistema digestivo', ''],
      ['Lunes', 'Almuerzo', 'Pollo con arroz y vegetales', '13:00', '550', '35', '45', '15', '6', 'Sistema muscular', ''],
      ['Lunes', 'Cena', 'Salmón con quinoa y espinacas', '19:00', '480', '30', '40', '18', '7', 'Sistema cardiovascular', ''],
      ['Martes', 'Desayuno', 'Smoothie de proteína y frutas', '08:30', '380', '28', '45', '10', '5', 'Sistema digestivo', '']
    ]
    
    return [headers, ...exampleRows]
  }

  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvValidation, setCsvValidation] = useState<CSVValidation | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [csvFileName, setCsvFileName] = useState<string>('')
  const [csvLoadedFromFile, setCsvLoadedFromFile] = useState(false)

  // Función para limpiar y normalizar nombres de días
  const normalizeDayName = useCallback((dayInput: string): string => {
    const dayMap: { [key: string]: string } = {
      // Números
      '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '7': 'Domingo',
      // Nombres con tildes y variaciones
      'lunes': 'Lunes', 'martes': 'Martes', 'miercoles': 'Miércoles', 'miércoles': 'Miércoles',
      'jueves': 'Jueves', 'viernes': 'Viernes', 'sabado': 'Sábado', 'sábado': 'Sábado', 'domingo': 'Domingo',
      // Abreviaciones
      'lun': 'Lunes', 'mar': 'Martes', 'mie': 'Miércoles', 'jue': 'Jueves', 'vie': 'Viernes', 'sab': 'Sábado', 'dom': 'Domingo',
      // Inglés
      'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles', 'thursday': 'Jueves', 
      'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo',
      'mon': 'Lunes', 'tue': 'Martes', 'wed': 'Miércoles', 'thu': 'Jueves', 'fri': 'Viernes', 'sat': 'Sábado', 'sun': 'Domingo'
    }
    
    const normalized = dayInput.toLowerCase().trim()
    return dayMap[normalized] || dayInput
  }, [])

  // Función para agregar fila al CSV
  const addCSVRow = useCallback(() => {
    if (csvData.length === 0) {
      // Si no hay datos CSV, crear una nueva fila con las columnas correctas según el tipo
      let headers: string[] = []
      if (productCategory === 'fitness') {
        headers = [
          'Semana', 'Día', 'Nombre de la Actividad', 'Descripción', 
          'Duración (min)', 'Tipo de Ejercicio', 'Nivel de Intensidad', 
          'Equipo Necesario', '1RM', 'Detalle de Series (peso-repeticiones-series)', 'Partes del Cuerpo', 'Calorías', 'video_url'
        ]
      } else if (productCategory === 'nutricion') {
        headers = [
          'Día', 'Comida', 'Descripción', 'Horario', 'Calorías', 
          'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Fibra (g)', 'Partes del Cuerpo', 'video_url'
        ]
      }
      
      if (headers.length > 0) {
        const newData = [headers, headers.map(() => '')] // Header + fila vacía
        setCsvData(newData)
        setCsvFileName(`programa_${productCategory}.csv`)
        setCsvLoadedFromFile(false) // Marcar que NO fue cargado desde archivo
        updateCSVValidation(newData)
      }
      return
    }

    const headers = csvData[0]
    const newRow = headers.map(() => '') // Fila vacía con el mismo número de columnas
    const newData = [...csvData, newRow]
    setCsvData(newData)
    
    // Actualizar validación
    updateCSVValidation(newData)
  }, [csvData, productCategory])

  // Función para eliminar fila del CSV
  const removeCSVRow = useCallback((rowIndex: number) => {
    if (csvData.length <= 1) return // No eliminar si solo queda el header

    const newData = csvData.filter((_, index) => index !== rowIndex)
    setCsvData(newData)
    
    // Actualizar validación
    updateCSVValidation(newData)
  }, [csvData])

  // Función para actualizar celda del CSV
  const updateCSVCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    const newData = [...csvData]
    
    // Si es la columna de "Día", normalizar el nombre del día
    if (rowIndex > 0 && csvData[0] && csvData[0][colIndex] === 'Día') {
      newData[rowIndex][colIndex] = normalizeDayName(value)
    } else {
      newData[rowIndex][colIndex] = value
    }
    
    setCsvData(newData)
    
    // Actualizar validación
    updateCSVValidation(newData)
  }, [csvData, normalizeDayName])

  // Función para actualizar validación después de cambios
  const updateCSVValidation = useCallback((data: string[][]) => {
    if (data.length === 0) {
      setCsvValidation(null)
      return
    }

    const errors: Array<{ row: number; column: number; message: string }> = []
    
    // Validar cada fila (excepto header)
    data.slice(1).forEach((row, rowIndex) => {
      const actualRowIndex = rowIndex + 1
      
      row.forEach((cell, colIndex) => {
        const header = data[0]?.[colIndex]
        
        // Validaciones específicas por columna
        if (header === 'Día' && cell.trim()) {
          const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
          if (!validDays.includes(cell)) {
            errors.push({
              row: actualRowIndex,
              column: colIndex,
              message: `Día inválido: ${cell}. Use: Lunes, Martes, etc.`
            })
          }
        }
        
        if (header === 'Duración (min)' && cell.trim()) {
          const duration = parseInt(cell)
          if (isNaN(duration) || duration <= 0) {
            errors.push({
              row: actualRowIndex,
              column: colIndex,
              message: 'Duración debe ser un número positivo'
            })
          }
        }
        
        if (header === 'Calorías' && cell.trim()) {
          const calories = parseInt(cell)
          if (isNaN(calories) || calories <= 0) {
            errors.push({
              row: actualRowIndex,
              column: colIndex,
              message: 'Calorías debe ser un número positivo'
            })
          }
        }
      })
    })
    
    setCsvValidation({
      isValid: errors.length === 0,
      errors
    })
  }, [])

  // Función para manejar selección de filas
  const handleRowSelection = useCallback((rowIndex: number) => {
    const newSelectedRows = new Set(selectedRows)
    if (newSelectedRows.has(rowIndex)) {
      newSelectedRows.delete(rowIndex)
    } else {
      newSelectedRows.add(rowIndex)
    }
    setSelectedRows(newSelectedRows)
  }, [selectedRows])

  return {
    csvData,
    setCsvData,
    csvValidation,
    setCsvValidation,
    selectedRows,
    setSelectedRows,
    csvFileName,
    setCsvFileName,
    csvLoadedFromFile,
    setCsvLoadedFromFile,
    normalizeDayName,
    addCSVRow,
    removeCSVRow,
    updateCSVCell,
    updateCSVValidation,
    handleRowSelection
  }
}
