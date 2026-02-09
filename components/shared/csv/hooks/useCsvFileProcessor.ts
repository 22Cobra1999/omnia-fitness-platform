import { useCallback } from 'react'
import Papa from 'papaparse'
import { validateSimpleCSVHeaders } from '@/lib/data/csv-parser'
import {
    normalizeExerciseType,
    normalizeIntensityValue,
    normalizeBodyParts,
    normalizeEquipment,
    normalizeName,
    getExerciseName
} from '../utils/csv-helpers'

interface UseCsvFileProcessorProps {
    productCategory: 'fitness' | 'nutricion'
    coachId: string
    activityId: number
    existingData: any[]
    csvData: any[]
    planLimits: { activitiesLimit: number } | null
    setFile: (file: File | null) => void
    setLoading: (loading: boolean) => void
    updateErrorState: (msg: string | null, details?: string[]) => void
    setResult: (result: any) => void
    setLimitWarning: (warning: string | null) => void
    setUploadedFiles: (updater: (prev: any[]) => any[]) => void
    setCsvData: (updater: (prev: any[]) => any[]) => void
    parentSetCsvData?: (data: any[]) => void
    parentCsvData?: any[]
    fileInputRef: React.RefObject<HTMLInputElement | null>
    TEMPLATE_ERROR_MESSAGE: string
}

type ParsedResult = {
    data: any[]
    meta: { fields?: string[] }
    errors?: Array<{ message?: string }>
}

export function useCsvFileProcessor({
    productCategory,
    //   coachId,
    activityId,
    existingData,
    csvData,
    planLimits,
    setFile,
    setLoading,
    updateErrorState,
    setResult,
    setLimitWarning,
    setUploadedFiles,
    setCsvData,
    parentSetCsvData,
    parentCsvData,
    fileInputRef,
    TEMPLATE_ERROR_MESSAGE
}: UseCsvFileProcessorProps) {

    const evaluateAvailableSlots = useCallback((requested: number) => {
        const limit = planLimits?.activitiesLimit || 1000
        // Contar items que no son existentes (los que el usuario agregó o subió)
        // PERO ojo, en parentCsvData (o csvData) ya están los existentes.
        // La lógica original en CSVManagerEnhanced contaba el total actual y veía cuántos cabían.

        // Total actual (existentes + manuales + subidos previos)
        const currentTotal = csvData.length
        const available = Math.max(0, limit - currentTotal)

        const allowed = Math.min(requested, available)
        const blocked = requested > available ? requested - available : 0

        return { allowed, blocked }
    }, [planLimits, csvData.length])

    const clearLimitWarningIfNeeded = useCallback(() => {
        setLimitWarning(null)
    }, [setLimitWarning])

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputElement = e.target
        const resetInput = () => {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            inputElement.value = ''
        }

        const selectedFile = inputElement.files?.[0]
        if (!selectedFile) return

        const extension = selectedFile.name.split('.').pop()?.toLowerCase() || ''
        const isCSV = extension === 'csv'
        const isExcel = extension === 'xlsx' || extension === 'xls'

        if (!isCSV && !isExcel) {
            updateErrorState('Formato no soportado. Descargá la plantilla de ejemplo y sube un archivo .csv o .xlsx.')
            resetInput()
            return
        }

        setFile(selectedFile)
        updateErrorState(null)
        setResult(null)
        setLoading(true)

        const processParsedResults = (parsed: ParsedResult, source: 'csv' | 'excel') => {
            const errors = parsed.errors || []
            const rows = parsed.data || []
            const headers = parsed.meta?.fields || []

            if (errors.length > 0) {
                console.error('❌ Errores en el parsing:', errors)
                updateErrorState(TEMPLATE_ERROR_MESSAGE)
                resetInput()
                return
            }

            if (rows.length === 0) {
                updateErrorState('El archivo está vacío')
                resetInput()
                return
            }

            if (!validateSimpleCSVHeaders(headers, productCategory)) {
                updateErrorState(TEMPLATE_ERROR_MESSAGE)
                resetInput()
                return
            }

            const fileTimestamp = Date.now()
            const validationMessages: string[] = []

            const parsedData = rows.map((item, index) => {
                const normalizedType = normalizeExerciseType(item['Tipo de Ejercicio'] || item.tipo_ejercicio || item.tipo || '')
                const { value: normalizedIntensity, issue: intensityIssue } = normalizeIntensityValue(item['Nivel de Intensidad'] || item.nivel_intensidad || item.intensidad || '')
                const { valid: normalizedBodyParts, invalid: invalidBodyParts } = normalizeBodyParts(item['Partes del Cuerpo'] || item.partes_cuerpo || item.body_parts || '')
                const { valid: normalizedEquipment, invalid: invalidEquipment } = normalizeEquipment(item['Equipo Necesario'] || item.equipo_necesario || item.equipo || '')

                const rowIssues: string[] = []
                if (intensityIssue) rowIssues.push(intensityIssue)
                if (invalidBodyParts.length > 0) rowIssues.push(`Partes no permitidas: ${invalidBodyParts.join(', ')}`)
                if (invalidEquipment.length > 0) rowIssues.push(`Equipo no permitido: ${invalidEquipment.join(', ')}`)

                if (rowIssues.length > 0) {
                    validationMessages.push(`Fila ${index + 1}: ${rowIssues.join('; ')}`)
                }

                return {
                    ...item,
                    'Tipo de Ejercicio': normalizedType,
                    tipo_ejercicio: normalizedType,
                    'Nivel de Intensidad': normalizedIntensity,
                    nivel_intensidad: normalizedIntensity,
                    intensidad: normalizedIntensity,
                    'Partes del Cuerpo': normalizedBodyParts.join('; '),
                    partes_cuerpo: normalizedBodyParts.join('; '),
                    body_parts: normalizedBodyParts.join('; '),
                    'Equipo Necesario': normalizedEquipment.join('; '),
                    equipo_necesario: normalizedEquipment.join('; '),
                    isExisting: false,
                    csvFileTimestamp: fileTimestamp,
                    csvFileName: selectedFile.name,
                    csvRowId: `${fileTimestamp}-${index}`,
                    __validationErrors: rowIssues
                }
            })

            const { allowed, blocked } = evaluateAvailableSlots(parsedData.length)

            if (allowed === 0) {
                setLimitWarning(`Límite de ejercicios (${planLimits?.activitiesLimit}) alcanzado. No se agregaron filas del archivo "${selectedFile.name}".`)
                resetInput()
                return
            }

            if (blocked > 0) {
                setLimitWarning(`Se agregaron ${allowed} ejercicios de "${selectedFile.name}" pero ${blocked} exceden el límite (${planLimits?.activitiesLimit}) y no se cargaron.`)
            } else {
                clearLimitWarningIfNeeded()
            }

            const newData = parsedData.slice(0, allowed)
            const allCurrentData = [...existingData, ...csvData.filter(item => !item.isExisting)]
            const duplicateNamesInNewData: string[] = []
            const nameMap = new Map<string, number>()

            allCurrentData.forEach(item => {
                const name = getExerciseName(item)
                const normalized = normalizeName(name)
                if (normalized) {
                    nameMap.set(normalized, (nameMap.get(normalized) || 0) + 1)
                }
            })

            newData.forEach(item => {
                const name = getExerciseName(item)
                const normalized = normalizeName(name)
                if (normalized) {
                    const currentCount = nameMap.get(normalized) || 0
                    if (currentCount >= 1 && !duplicateNamesInNewData.includes(name)) {
                        duplicateNamesInNewData.push(name)
                    }
                    nameMap.set(normalized, currentCount + 1)
                }
            })

            const errorMessages: string[] = []
            const invalidEntryMessages: string[] = []

            if (duplicateNamesInNewData.length > 0) {
                const allDataForDuplicates = [...allCurrentData, ...newData]
                const duplicateIndices: number[] = []

                duplicateNamesInNewData.forEach(dupName => {
                    allDataForDuplicates.forEach((item, idx) => {
                        const itemName = getExerciseName(item)
                        if (normalizeName(itemName) === normalizeName(dupName)) {
                            duplicateIndices.push(idx + 1)
                        }
                    })
                })

                const sortedIndices = [...new Set(duplicateIndices)].sort((a, b) => a - b)
                const firstIndex = sortedIndices[0]
                const lastIndex = sortedIndices[sortedIndices.length - 1]
                const indicesText = sortedIndices.length === 2
                    ? `${firstIndex}-${lastIndex}`
                    : sortedIndices.length > 2
                        ? `${firstIndex}-${lastIndex}`
                        : `${firstIndex}`

                const duplicateMessage = `fila nro ${indicesText} mismo nombre`
                errorMessages.push(duplicateMessage)
                invalidEntryMessages.push(`Fila ${indicesText}: nombre duplicado`)
            }

            if (validationMessages.length > 0) {
                const issuesSummary = validationMessages.length > 3
                    ? `${validationMessages.slice(0, 3).join(' | ')} | ...`
                    : validationMessages.join(' | ')
                errorMessages.push(`Validación: ${issuesSummary}`)
                invalidEntryMessages.push(...validationMessages)
            }

            if (errorMessages.length > 0) {
                updateErrorState(errorMessages.join(' | '), invalidEntryMessages)
            } else {
                updateErrorState(null)
            }

            setUploadedFiles(prev => [...prev, { name: selectedFile.name, timestamp: fileTimestamp }])

            setCsvData(prev => {
                const prevNonExisting = prev.filter(item => !item.isExisting)
                return [...existingData, ...prevNonExisting, ...newData]
            })

            if (parentSetCsvData) {
                const currentParentData = parentCsvData || []
                const existingInParent = currentParentData.filter((item: any) => item.isExisting)
                const nonExistingInParent = currentParentData.filter((item: any) => !item.isExisting)
                parentSetCsvData([...existingInParent, ...nonExistingInParent, ...newData])
            }

            resetInput()
        }

        if (isCSV) {
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results: any) => {
                    setLoading(false)
                    processParsedResults(results as ParsedResult, 'csv')
                },
                error: (error: any) => {
                    setLoading(false)
                    updateErrorState(`Error al leer el archivo: ${error.message}`)
                    resetInput()
                }
            })
            return
        }

        try {
            // @ts-ignore - import dinámico
            const XLSX = await import('xlsx')
            const arrayBuffer = await selectedFile.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer, { type: 'array' })
            const sheet = workbook.Sheets['Plantilla'] || workbook.Sheets[workbook.SheetNames[0]]

            if (!sheet) {
                throw new Error('El archivo no contiene la hoja "Plantilla".')
            }

            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
            const fields = Object.keys(jsonData[0] || {})
            setLoading(false)
            processParsedResults({ data: jsonData, meta: { fields }, errors: [] }, 'excel')
        } catch (error: any) {
            console.error('❌ Error leyendo Excel:', error)
            setLoading(false)
            updateErrorState(error instanceof Error ? error.message : 'Error al leer el archivo Excel')
            resetInput()
        }
    }, [
        activityId,
        existingData,
        csvData,
        planLimits,
        productCategory,
        setFile,
        setLoading,
        updateErrorState,
        setResult,
        setLimitWarning,
        setUploadedFiles,
        setCsvData,
        parentSetCsvData,
        parentCsvData,
        fileInputRef,
        TEMPLATE_ERROR_MESSAGE,
        evaluateAvailableSlots,
        clearLimitWarningIfNeeded
    ])

    return {
        handleFileChange,
        evaluateAvailableSlots,
        clearLimitWarningIfNeeded
    }
}
