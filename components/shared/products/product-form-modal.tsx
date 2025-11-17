"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Info,
  Upload,
  MessageSquare,
  Video,
  Clock,
  Calendar,
  Moon,
  Sunrise,
  Users,
  ChevronDown,
  Database,
  ChevronUp,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Papa from "papaparse"
import { TiptapEditor } from "../components/tiptap-editor"
import { formatFileSize } from "../utils/format-file-size"
import { Separator } from "@/components/ui/separator"
import { getSupabaseClient } from '@/lib/supabase/supabase-client'

import type { ActivityData } from "../utils/activity-service"
import type { CoachAvailability } from "@/types/availability"
import { processAndSaveProgramCSV } from "../utils/program-data-service"

// Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Activity {
  id?: number
  title: string
  description: string
  rich_description?: string | null
  type: string
  difficulty: string
  duration: number | null
  calories?: number | null
  price: number | string // Permitir string para el input
  image_url: string | null
  video_url: string | null
  vimeo_id?: string | null
  pdf_url?: string | null
  is_public: boolean
  availability_type?: string
  session_type?: string
  available_slots?: number | null
  available_times?: Array<{ date: string; start_time: string; end_time: string }> | null
  program_data?: {
    fitness?: any[]
    nutrition?: any[]
  }
  program_duration?: string | null
  // Fields for activity-specific consultation details (stored on the activity itself)
  consultation_type?: string[] | null
  videocall_duration?: number | null
  available_days?: string[] | null
  available_hours?: string[] | null
}

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (activity: Activity) => void
  activity: Activity | null
}

export function ProductFormModal({ isOpen, onClose, onSuccess, activity }: ProductFormModalProps) {
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseClient()

  const initialFormData = useRef<Activity | null>(null) // To store the initial state for comparison

  const [formData, setFormData] = useState<Activity>({
    title: "",
    description: "",
    rich_description: null,
    type: "program",
    difficulty: "beginner",
    duration: 30,
    calories: null,
    price: "0" as any, // Cambiar a string para evitar problemas de input controlado
    image_url: null,
    video_url: null,
    vimeo_id: null,
    pdf_url: null,
    is_public: false,
    availability_type: "immediate_purchase",
    session_type: "individual",
    available_slots: 10,
    available_times: [{ date: "", start_time: "", end_time: "" }],
    program_data: {
      fitness: [],
      nutrition: [],
    },
    program_duration: null,
    consultation_type: ["message"], // Default for activity-specific consultation
    videocall_duration: 30, // Default for activity-specific consultation
    available_days: ["lun", "mar", "mié", "jue", "vie"], // Default for activity-specific consultation
    available_hours: ["mañana", "tarde"], // Default for activity-specific consultation
  })

  const [sessionsCount, setSessionsCount] = useState<number>(1)
  const [durationValue, setDurationValue] = useState<string>("1")
  const [durationUnit, setDurationUnit] = useState<string>("week")
  const [durationEnabled, setDurationEnabled] = useState(false)

  const [existingProgramData, setExistingProgramData] = useState<{
    fitness: any[]
    nutrition: any[]
  } | null>(null)
  const [loadingExistingData, setLoadingExistingData] = useState(false)
  const [showUploadOptions, setShowUploadOptions] = useState(false)
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("replace")

  // States for coach general availability preferences (these will be sent to coach_availability table)
  const [generalSelectedDays, setGeneralSelectedDays] = useState<string[]>(["lun", "mar", "mié", "jue", "vie"])
  const [generalSelectedHours, setGeneralSelectedHours] = useState<string[]>(["mañana", "tarde"])
  const [generalSelectedConsultationTypes, setGeneralSelectedConsultationTypes] = useState<string[]>(["message"])
  const [generalVideocallDuration, setGeneralVideocallDuration] = useState<number>(30)
  const [generalAvailabilityId, setGeneralAvailabilityId] = useState<number | null>(null) // To store the ID of the general preference entry

  const [includeConsultations, setIncludeConsultations] = useState(false)
  const [consultationNote, setConsultationNote] = useState<string>("")

  const [pendingOperations, setPendingOperations] = useState<{
    deleteOperations: { type: "fitness" | "nutrition"; activityId: number }[]
    uploadOperations: {
      type: "fitness" | "nutrition"
      file: File
      mode: "replace" | "append"
      processedData?: any[]
      validationReport?: { totalRows: number; validRows: number; invalidRows: number; errors: string[]; warnings: string[] }
    }[]
  }>({
    deleteOperations: [],
    uploadOperations: [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileProcessing, setFileProcessing] = useState(false)
  const [fileProcessed, setFileProcessed] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [programType, setProgramType] = useState<"fitness" | "nutrition">("fitness")
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [columnPage, setColumnPage] = useState(0)
  const columnsPerPage = 5

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [processingTooLong, setProcessingTooLong] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<string>("")
  const [backgroundOperationsInProgress, setBackgroundOperationsInProgress] = useState(false)

  const [expandedSections, setExpandedSections] = useState({
    generalInfo: true, // Keep open by default for better UX on first load
    database: false,
    consultations: false,
  })

  // State to track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Estados para el manejo mejorado de CSV
  const [csvProcessingState, setCsvProcessingState] = useState<{
    stage: 'idle' | 'processing' | 'validating' | 'saving' | 'complete' | 'error'
    progress: number
    message: string
  }>({
    stage: 'idle',
    progress: 0,
    message: ''
  })

  const [validationReport, setValidationReport] = useState<{
    totalRows: number
    validRows: number
    invalidRows: number
    errors: string[]
    warnings: string[]
  } | null>(null)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (fileProcessing) {
      timeoutId = setTimeout(() => {
        setProcessingTooLong(true)
      }, 5000)
    } else {
      setProcessingTooLong(false)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fileProcessing])

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Error no manejado:", event.reason)
      if (isSubmitting) {
        setIsSubmitting(false)
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [isSubmitting, toast])

  useEffect(() => {
    if (!isAuthenticated && (fileProcessing || isSubmitting)) {
      setFileProcessing(false)
      setIsSubmitting(false)
      setFileError("Debes iniciar sesión para subir archivos")
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para subir archivos",
        variant: "destructive",
      })
    }
  }, [isAuthenticated, fileProcessing, isSubmitting, toast])

  const weekDays = [
    { id: "lun", label: "Lunes" },
    { id: "mar", label: "Martes" },
    { id: "mié", label: "Miércoles" },
    { id: "jue", label: "Jueves" },
    { id: "vie", label: "Viernes" },
    { id: "sáb", label: "Sábado" },
    { id: "dom", label: "Domingo" },
  ]

  const timeSlots = [
    { id: "madrugada", label: "Madrugada (02:00 - 08:00)", icon: <Sunrise className="h-4 w-4 mr-2" /> },
    { id: "mañana", label: "Mañana (08:00 - 12:00)", icon: <Sunrise className="h-4 w-4 mr-2" /> },
    { id: "tarde", label: "Tarde (12:00 - 18:00)", icon: <Clock className="h-4 w-4 mr-2" /> },
    { id: "noche", label: "Noche (18:00 - 22:00)", icon: <Moon className="h-4 w-4 mr-2" /> },
    { id: "trasnoche", label: "Trasnoche (22:00 - 02:00)", icon: <Moon className="h-4 w-4 mr-2" /> },
  ]

  const consultationTypes = [
    { id: "message", label: "Mensaje", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { id: "videocall", label: "Videollamada", icon: <Video className="h-4 w-4 mr-2" /> },
  ]

  const REQUIRED_COLUMNS = {
    fitness: ["semana", "día", "nombre de la actividad", "descripción", "duración (min)", "tipo de ejercicio"],
    nutrition: ["nombre", "descripción", "calorías", "proteínas (g)", "carbohidratos (g)", "grasas (g)"],
  }

  const OPTIONAL_COLUMNS = {
    fitness: [
      "nivel de intensidad",
      "equipo necesario",
      "1rm",
      "detalle de series",
      "video_url",
      "video",
      "notas"
    ],
    nutrition: [
      "video_url", 
      "video",
      "notas"
    ],
  }

  const [columnValidation, setColumnValidation] = useState<{
    valid: boolean
    missingRequired: string[]
    extraColumns: string[]
    matchingColumns: string[]
  } | null>(null)

  // Estados para detección automática y preview mejorado
  const [detectedFileType, setDetectedFileType] = useState<"fitness" | "nutrition" | null>(null)
  const [filePreview, setFilePreview] = useState<{
    totalRows: number
    previewRows: any[]
    errorPreviewRows?: any[]
    allColumns: string[]
  } | null>(null)

  const [previewMode, setPreviewMode] = useState<'valid' | 'error'>('valid')

  // Función para detectar automáticamente el tipo de archivo
  const detectFileType = (columns: string[]): "fitness" | "nutrition" => {
    const normalizedColumns = columns.map(col => 
      col.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
    
    // Definir columnas específicas para cada tipo (basado en las tablas reales)
    const fitnessColumns = [
      "semana", "dia", "nombre_actividad", "descripcion", "duracion", 
      "tipo_ejercicio", "repeticiones", "series", "descanso", "peso",
      "nivel_intensidad", "equipo_necesario", "rm", "video", "calorias_consumidas"
    ]
    
    const nutritionColumns = [
      "semana", "dia", "comida", "nombre", "calorias", "proteinas", 
      "carbohidratos", "peso", "receta", "video"
    ]

    // Contar coincidencias exactas y parciales
    const fitnessMatches = fitnessColumns.filter(required =>
      normalizedColumns.some(col => 
        col === required || 
        col.includes(required.replace(/[_-]/g, '')) ||
        required.includes(col.replace(/[_-]/g, ''))
      )
    ).length

    const nutritionMatches = nutritionColumns.filter(required =>
      normalizedColumns.some(col => 
        col === required || 
        col.includes(required.replace(/[_-]/g, '')) ||
        required.includes(col.replace(/[_-]/g, ''))
      )
    ).length

      columns: normalizedColumns,
      fitnessMatches,
      nutritionMatches,
      fitnessFound: fitnessColumns.filter(required =>
        normalizedColumns.some(col => col.includes(required.replace(/[_-]/g, '')))
      ),
      nutritionFound: nutritionColumns.filter(required =>
        normalizedColumns.some(col => col.includes(required.replace(/[_-]/g, '')))
      )
    })

    // Decidir basado en coincidencias
    if (fitnessMatches > nutritionMatches) return "fitness"
    if (nutritionMatches > fitnessMatches) return "nutrition"

    // Heurísticas adicionales
    const fitnessKeywords = ["ejercicio", "actividad", "intensidad", "equipo", "repeticiones"]
    const nutritionKeywords = ["comida", "receta", "proteina", "carbohidrato", "calorias"]

    const hasFitnessKeywords = normalizedColumns.some(col =>
      fitnessKeywords.some(keyword => col.includes(keyword))
    )
    const hasNutritionKeywords = normalizedColumns.some(col =>
      nutritionKeywords.some(keyword => col.includes(keyword))
    )

    if (hasFitnessKeywords && !hasNutritionKeywords) return "fitness"
    if (hasNutritionKeywords && !hasFitnessKeywords) return "nutrition"

    // Por defecto, fitness
    return "fitness"
  }

  // Función para validar y procesar el formato de Detalle de Series
  const validateSeriesFormat = (detalleSeries: string): { valid: boolean; error?: string; parsed?: any[] } => {
    if (!detalleSeries || detalleSeries.trim() === "") {
      return { valid: true, parsed: [] } // Campo opcional
    }

    const trimmed = detalleSeries.trim()
    
    // Debe empezar con [ y terminar con ]
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
      return { 
        valid: false, 
        error: "El formato debe estar entre corchetes: [(peso-reps-series);...]" 
      }
    }

    const content = trimmed.slice(1, -1) // Quitar corchetes
    if (content.trim() === "") {
      return { valid: true, parsed: [] } // Corchetes vacíos son válidos
    }

    const series = content.split(";")
    const parsedSeries = []

    for (let i = 0; i < series.length; i++) {
      const serie = series[i].trim()
      
      // Cada serie debe estar entre paréntesis
      if (!serie.startsWith("(") || !serie.endsWith(")")) {
        return { 
          valid: false, 
          error: `Serie ${i + 1}: debe estar entre paréntesis (peso-reps-series)` 
        }
      }

      const serieContent = serie.slice(1, -1) // Quitar paréntesis
      const parts = serieContent.split("-")

      if (parts.length !== 3) {
        return { 
          valid: false, 
          error: `Serie ${i + 1}: debe tener formato (peso-reps-series) con exactamente 3 valores` 
        }
      }

      const [pesoStr, repsStr, seriesStr] = parts
      const peso = parseFloat(pesoStr.trim())
      const reps = parseInt(repsStr.trim())
      const seriesCount = parseInt(seriesStr.trim())

      // Validar que son números válidos
      if (isNaN(peso) || peso < 0) {
        return { 
          valid: false, 
          error: `Serie ${i + 1}: peso "${pesoStr}" no es un número válido` 
        }
      }

      if (isNaN(reps) || reps <= 0) {
        return { 
          valid: false, 
          error: `Serie ${i + 1}: repeticiones "${repsStr}" debe ser un número positivo` 
        }
      }

      if (isNaN(seriesCount) || seriesCount <= 0) {
        return { 
          valid: false, 
          error: `Serie ${i + 1}: series "${seriesStr}" debe ser un número positivo` 
        }
      }

      parsedSeries.push({
        peso,
        repeticiones: reps,
        series: seriesCount
      })
    }

    return { valid: true, parsed: parsedSeries }
  }

  // Función para validar una fila completa del CSV
  const validateCSVRow = (row: any, rowIndex: number, fileType: "fitness" | "nutrition"): { valid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validaciones comunes (semana y día)
    const semana = parseInt(row.semana || row.Semana || "")
    if (isNaN(semana) || semana < 1 || semana > 52) {
      errors.push(`Fila ${rowIndex}: Semana debe ser un número entre 1 y 52`)
    }

    const dia = row.dia || row.Día || row["día"] || ""
    const diasValidos = ["lunes", "martes", "miercoles", "miércoles", "jueves", "viernes", "sabado", "sábado", "domingo"]
    if (!dia || !diasValidos.some(d => d.toLowerCase() === dia.toLowerCase().trim())) {
      errors.push(`Fila ${rowIndex}: Día debe ser uno de: ${diasValidos.slice(0, 7).join(", ")}`)
    }

    if (fileType === "fitness") {
      // Validaciones específicas de FITNESS (basado en fitness_program_details)
      const nombre = row.nombre_actividad || row["Nombre de la Actividad"] || row.nombre || ""
      if (!nombre || nombre.trim() === "") {
        errors.push(`Fila ${rowIndex}: "Nombre de la Actividad" es obligatorio`)
      }

      const descripcion = row.descripcion || row.Descripción || row["descripción"] || ""
      if (!descripcion || descripcion.trim() === "") {
        warnings.push(`Fila ${rowIndex}: "Descripción" recomendada pero no obligatoria`)
      }

      const duracion = parseInt(row.duracion || row["duración"] || row["Duración (min)"] || "")
      if (isNaN(duracion) || duracion <= 0) {
        warnings.push(`Fila ${rowIndex}: "Duración" debe ser un número positivo`)
      }

      const tipoEjercicio = row.tipo_ejercicio || row["Tipo de Ejercicio"] || ""
      if (!tipoEjercicio || tipoEjercicio.trim() === "") {
        warnings.push(`Fila ${rowIndex}: "Tipo de Ejercicio" recomendado`)
      }

      // Validar Detalle de Series si existe
      const detalleSeries = row["detalle de series"] || row["Detalle de Series"] || ""
      if (detalleSeries && detalleSeries.trim() !== "") {
        const seriesValidation = validateSeriesFormat(detalleSeries)
        if (!seriesValidation.valid) {
          errors.push(`Fila ${rowIndex}: ${seriesValidation.error}`)
        }
      }

    } else if (fileType === "nutrition") {
      // Validaciones específicas de NUTRICIÓN (basado en nutrition_program_details)
      const comida = row.comida || row.Comida || ""
      if (!comida || comida.trim() === "") {
        errors.push(`Fila ${rowIndex}: "Comida" es obligatorio`)
      }

      const nombre = row.nombre || row.Nombre || ""
      if (!nombre || nombre.trim() === "") {
        errors.push(`Fila ${rowIndex}: "Nombre" es obligatorio`)
      }

      const calorias = parseFloat(row.calorias || row.calorías || row.Calorías || "")
      if (isNaN(calorias) || calorias < 0) {
        warnings.push(`Fila ${rowIndex}: "Calorías" debe ser un número positivo`)
      }

      const proteinas = parseFloat(row.proteinas || row.proteínas || row.Proteínas || "")
      if (!isNaN(proteinas) && proteinas < 0) {
        warnings.push(`Fila ${rowIndex}: "Proteínas" no puede ser negativo`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  const extractConsultationInfo = (description: string) => {
    const includesConsultations = description?.includes("[CONSULTAS_INCLUIDAS]") || false
     const noteMatch = description?.match(/\[NOTA_CONSULTA\]([\s\S]*?)\[\/NOTA_CONSULTA\]/)
    const note = noteMatch ? noteMatch[1].trim() : ""
     const sessionsMatch = description?.match(/\[SESSIONS_COUNT\](\d+)\[\/SESSIONS_COUNT\]/)
    const sessions = sessionsMatch ? Number.parseInt(sessionsMatch[1], 10) : 1
    return { includesConsultations, note, sessions }
  }

  useEffect(() => {
    if (activity) {
      // Store initial activity data for comparison
      initialFormData.current = { ...activity }

      const { includesConsultations, note, sessions } = extractConsultationInfo(activity.description || "")

      const durationMatch = activity.description?.match(/\[DURATION\]([\s\S]*?)\[\/DURATION\]/)
      let extractedDurationValue = "1"
      let extractedDurationUnit = "week"

      if (durationMatch) {
        const durationText = durationMatch[1]
        const valueMatch = durationText.match(/Duración: (\d+)/)
        if (valueMatch) {
          extractedDurationValue = valueMatch[1]
        }

        if (durationText.includes("semana")) {
          extractedDurationUnit = "week"
        } else if (durationText.includes("mes")) {
          extractedDurationUnit = "month"
        } else if (durationText.includes("año")) {
          extractedDurationUnit = "year"
        }
      }

      setDurationValue(extractedDurationValue)
      setDurationUnit(extractedDurationUnit)
      setDurationEnabled(!!durationMatch)

      setFormData({
        ...activity,
        price: activity.price?.toString() || "0", // Convertir a string para evitar problemas de input controlado
        rich_description: activity.rich_description || null,
        duration: activity.duration || 30,
        calories: activity.calories || null,
        availability_type: activity.availability_type || "immediate_purchase",
        vimeo_id: activity.vimeo_id || null,
        pdf_url: activity.pdf_url || null,
        session_type: activity.session_type || "individual",
        available_slots: activity.available_slots || 10,
        available_times: activity.available_times || [{ date: "", start_time: "", end_time: "" }],
        program_data: activity.program_data || { fitness: [], nutrition: [] },
        consultation_type: activity.consultation_type || ["message"],
        videocall_duration: activity.videocall_duration || 30,
        available_days: activity.available_days || ["lun", "mar", "mié", "jue", "vie"],
        available_hours: activity.available_hours || ["mañana", "tarde"],
      })

      const loadCoachConsultationPreferences = async () => {
        if (!user?.id) return
        try {
          // Fetch the general preference entry for this coach
          const response = await fetch(`/api/coach/availability?coach_id=${user.id}&is_general_preference=true`)
          if (response.ok) {
            const data: CoachAvailability[] = await response.json()
            const generalPreferenceSlot = data[0] // Assuming only one general preference entry per coach
            if (generalPreferenceSlot) {
              setGeneralAvailabilityId(generalPreferenceSlot.id)
              setGeneralSelectedDays(generalPreferenceSlot.available_days || ["lun", "mar", "mié", "jue", "vie"])
              setGeneralSelectedHours(generalPreferenceSlot.available_hours || ["mañana", "tarde"])
              setGeneralVideocallDuration(generalPreferenceSlot.videocall_duration || 30)
              setGeneralSelectedConsultationTypes(generalPreferenceSlot.consultation_type || ["message"])
            }
          }
        } catch (error) {
          console.error("Failed to load coach consultation preferences:", error)
        }
      }
      loadCoachConsultationPreferences()

      setIncludeConsultations(includesConsultations)
      setConsultationNote(note)
      setSessionsCount(sessions)

      if (activity.program_data) {
        const fitnessArr = Array.isArray(activity.program_data?.fitness) ? activity.program_data!.fitness : []
        const nutritionArr = Array.isArray(activity.program_data?.nutrition) ? activity.program_data!.nutrition : []
        const hasFitness = fitnessArr.length > 0
        const hasNutrition = nutritionArr.length > 0

        if (hasFitness) {
          setProgramType("fitness")
          setPreviewData(fitnessArr.slice(0, 3))
        } else if (hasNutrition) {
          setProgramType("nutrition")
          setPreviewData(nutritionArr.slice(0, 3))
        }

        if (hasFitness || hasNutrition) {
          setFileProcessed(true)
        }
      }

      if (activity.id) {
        loadExistingProgramData(activity.id)
      }
    } else {
      resetForm()
    }
    setHasChanges(false) // Reset hasChanges when activity prop changes or modal opens
  }, [activity, isOpen, user?.id])

  useEffect(() => {
    if (linkCopied) {
      const timer = setTimeout(() => {
        setLinkCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [linkCopied])

  useEffect(() => {
    if (!isOpen && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [isOpen])

  useEffect(() => {
    setColumnPage(0)
  }, [previewData])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      rich_description: null,
      type: "program",
      difficulty: "beginner",
      duration: 30,
      calories: null,
      price: "0" as any, // Cambiar a string para evitar problemas de input controlado
      image_url: null,
      video_url: null,
      vimeo_id: null,
      pdf_url: null,
      is_public: false,
      availability_type: "immediate_purchase",
      session_type: "individual",
      available_slots: 10,
      available_times: [{ date: "", start_time: "", end_time: "" }],
      program_data: {
        fitness: [],
        nutrition: [],
      },
      program_duration: null,
      consultation_type: ["message"],
      videocall_duration: 30,
      available_days: ["lun", "mar", "mié", "jue", "vie"],
      available_hours: ["mañana", "tarde"],
    })

    setGeneralSelectedDays(["lun", "mar", "mié", "jue", "vie"])
    setGeneralSelectedHours(["mañana", "tarde"])
    setGeneralSelectedConsultationTypes(["message"])
    setGeneralVideocallDuration(30)
    setGeneralAvailabilityId(null)
    setConsultationNote("")
    setIncludeConsultations(false)
    setSessionsCount(1)
    setDurationValue("1")
    setDurationUnit("week")
    setDurationEnabled(false)

    setUploadedFile(null)
    setFileProcessed(false)
    setFileError(null)
    setPreviewData(null)
    setProgramType("fitness")
    setColumnPage(0)
    setColumnValidation(null)
    setPendingOperations({ deleteOperations: [], uploadOperations: [] }) // Reset pending operations

    // Limpiar nuevos estados
    setDetectedFileType(null)
    setFilePreview(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setHasChanges(false) // Reset hasChanges on form reset
  }

  const loadExistingProgramData = async (activityId: number) => {
    if (!isAuthenticated) return

    setLoadingExistingData(true)
    try {
      console.log(`Cargando datos existentes para actividad ${activityId}`)
      const response = await fetch(`/api/program-data/${activityId}`)

      if (response.ok) {
        const result = await response.json()
        console.log("Datos existentes cargados:", result)

        if (result.success && result.data) {
          setExistingProgramData(result.data)
          console.log("Datos de fitness:", result.data.fitness?.length || 0)
          console.log("Datos de nutrición:", result.data.nutrition?.length || 0)
        }
      } else {
        console.error("Error al cargar datos existentes:", response.status)
      }
    } catch (error) {
      console.error("Error loading existing program data:", error)
    } finally {
      setLoadingExistingData(false)
    }
  }

  const markDataForDeletion = (activityId: number, type: "fitness" | "nutrition") => {
    setPendingOperations((prev) => ({
      ...prev,
      deleteOperations: [
        ...prev.deleteOperations.filter((op) => !(op.activityId === activityId && op.type === type)),
        { type, activityId },
      ],
    }))

    setExistingProgramData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [type]: [],
      }
    })
    setHasChanges(true) // Mark changes
    toast({
      title: "Datos marcados para eliminación",
      description: `Los datos de ${type === "fitness" ? "fitness" : "nutrición"} se eliminarán al guardar los cambios`,
    })
  }

  const handleFormChange = (updater: (prev: Activity) => Activity) => {
    setFormData(updater)
    setHasChanges(true) // Mark changes on any form data update
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]>,
  ) => {
    const { name, value } = e.target as HTMLInputElement
    handleFormChange((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Para campos numéricos, mantener como string en el estado del formulario
    // pero convertir a número solo cuando sea necesario para la base de datos
    handleFormChange((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    handleFormChange((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    handleFormChange((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDayToggle = (day: string) => {
    handleFormChange((prev) => {
      const currentDays = prev.available_days || []
      const newDays = currentDays.includes(day) ? currentDays.filter((d) => d !== day) : [...currentDays, day]
      return { ...prev, available_days: newDays }
    })
  }

  const handleTimeSlotToggle = (slot: string) => {
    handleFormChange((prev) => {
      const currentHours = prev.available_hours || []
      const newHours = currentHours.includes(slot) ? currentHours.filter((s) => s !== slot) : [...currentHours, slot]
      return { ...prev, available_hours: newHours }
    })
  }

  const handleConsultationTypeToggle = (type: string) => {
    handleFormChange((prev) => {
      const currentTypes = prev.consultation_type || []
      const newTypes = currentTypes.includes(type) ? currentTypes.filter((t) => t !== type) : [...currentTypes, type]
      return { ...prev, consultation_type: newTypes }
    })
  }

  const handleTimeSlotChange = (index: number, field: string, value: string) => {
    if (!formData.available_times) return
    const updatedTimes = [...formData.available_times]
    updatedTimes[index] = { ...updatedTimes[index], [field]: value }
    handleFormChange((prev) => ({ ...prev, available_times: updatedTimes }))
  }

  const addTimeSlot = () => {
    handleFormChange((prev) => {
      if (!prev.available_times) {
        return { ...prev, available_times: [{ date: "", start_time: "", end_time: "" }] }
      } else {
        return {
          ...prev,
          available_times: [...prev.available_times!, { date: "", start_time: "", end_time: "" }],
        }
      }
    })
  }

  const removeTimeSlot = (index: number) => {
    handleFormChange((prev) => {
      if (!prev.available_times) return prev
      const updatedTimes = [...prev.available_times]
      updatedTimes.splice(index, 1)
      return { ...prev, available_times: updatedTimes }
    })
  }

  const copyTemplateLink = () => {
    const templateUrl = "https://docs.google.com/spreadsheets/d/1SrRzJ9HAzKoIw3R7Ey9rbWGT6GGmlSnk/edit?gid=1907186274#gid=1907186274"
    navigator.clipboard.writeText(templateUrl).then(
      () => {
    toast({
      title: "Enlace copiado",
          description: "El enlace de la plantilla se ha copiado al portapapeles.",
        })
      },
      (err) => {
        console.error("Error al copiar al portapapeles:", err)
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace. Cópialo manualmente del campo de texto.",
          variant: "destructive",
        })
      },
    )
  }

  const triggerFileInput = () => {
    if (!isAuthenticated) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para subir archivos",
        variant: "destructive",
      })
      return
    }

    console.log("fileInputRef.current:", fileInputRef.current)

    if (fileInputRef.current) {
      // Limpiar el valor anterior
      fileInputRef.current.value = ""
      
      // Forzar el click en el input
      try {
      fileInputRef.current.click()
      } catch (error) {
        console.error("❌ Error al hacer click en input:", error)
        toast({
          title: "Error",
          description: "No se pudo abrir el selector de archivos",
          variant: "destructive",
        })
      }
    } else {
      console.error("❌ fileInputRef.current es null")
      toast({
        title: "Error",
        description: "No se pudo abrir el selector de archivos",
        variant: "destructive",
      })
    }
  }

  const processCSV = (file: File) => {
    return new Promise<any[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          if (results.data && results.data.length > 0) {
            resolve(results.data)
          } else {
            reject(new Error("El archivo CSV no contiene datos válidos"))
          }
        },
        error: (error: any) => {
          reject(error)
        },
      })
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      console.log("No se seleccionó ningún archivo")
      return
    }

    if (!isAuthenticated) {
      setFileError("Debes iniciar sesión para subir archivos")
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para subir archivos",
        variant: "destructive",
      })
      return
    }

    const file = files[0]
    console.log("Archivo seleccionado:", file.name, "tamaño:", formatFileSize(file.size))

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Solo se permiten archivos CSV")
      toast({
        title: "Error",
        description: "Solo se permiten archivos CSV",
        variant: "destructive",
      })
      return
    }

    if (file.size === 0) {
      setFileError("El archivo está vacío")
      toast({
        title: "Error",
        description: "El archivo seleccionado está vacío",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    setFileProcessing(true)
    setFileProcessed(false)
    setFileError(null)
    setHasChanges(true) // Mark changes

    try {
      processFile(file)
    } catch (error) {
      console.error("Error al iniciar el procesamiento del archivo:", error)
      setFileProcessing(false)
      setFileError("Error al procesar el archivo: " + (error instanceof Error ? error.message : "Error desconocido"))
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo",
        variant: "destructive",
      })
    }
  }

  const validateColumns = (csvColumns: string[], programType: "fitness" | "nutrition") => {
    const requiredColumns = REQUIRED_COLUMNS[programType]
    const optionalColumns = OPTIONAL_COLUMNS[programType]
    const allValidColumns = [...requiredColumns, ...optionalColumns]

    const normalizedCsvColumns = csvColumns.map((col) =>
      col
        .toLowerCase()
        .trim()
        .replace(/\s*$$[^)]*$$/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " "),
    )

    const normalizedRequired = requiredColumns.map((col) =>
      col
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    )

    const normalizedAllValid = allValidColumns.map((col) =>
      col
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    )

    const columnMappings: Record<string, string> = {
      dia: "día",
      day: "día",
      week: "semana",
      "nombre de la actividad": "nombre de la actividad",
      "activity name": "nombre de la actividad",
      "exercise name": "nombre de la actividad",
      actividad: "nombre de la actividad",
      ejercicio: "nombre de la actividad",
      descripcion: "descripción",
      description: "descripción",
      duracion: "duración",
      duration: "duración",
      tiempo: "duración",
      time: "duración",
      "tipo de ejercicio": "tipo de ejercicio",
      "exercise type": "tipo de ejercicio",
      tipo: "tipo de ejercicio",
      repeticiones: "repeticiones",
      reps: "repeticiones",
      rep: "repeticiones",
      serie: "serie",
      series: "serie",
      sets: "serie",
      set: "serie",
      intervalo: "intervalo",
      intervalos: "intervalo",
      interval: "intervalo",
      descanso: "descanso",
      rest: "descanso",
      peso: "peso",
      weight: "peso",
      "nivel de intensidad": "nivel de intensidad",
      "intensity level": "nivel de intensidad",
      intensidad: "nivel de intensidad",
      intensity: "nivel de intensidad",
      "equipo necesario": "equipo necesario",
      equipment: "equipo necesario",
      equipo: "equipo necesario",
      "equipment needed": "equipo necesario",
      "1rm": "1rm",
      rm: "1rm",
      video: "video",
      video_url: "video",
      vimeo: "video",
      meal: "comida",
      comida: "comida",
      name: "nombre",
      nombre: "nombre",
      "nombre del alimento": "nombre",
      "food name": "nombre",
      alimento: "nombre",
      food: "nombre",
      calories: "calorías",
      calorias: "calorías",
      kcal: "calorías",
      protein: "proteínas",
      proteinas: "proteínas",
      proteins: "proteínas",
      carbs: "carbohidratos",
      carbohidratos: "carbohidratos",
      carbohydrates: "carbohidratos",
      fats: "grasas",
      grasas: "grasas",
      lipidos: "grasas",
      cantidad: "cantidad",
      amount: "cantidad",
      porcion: "cantidad",
      portion: "cantidad",
    }

    const missingRequired = normalizedRequired.filter((req) => {
      return !normalizedCsvColumns.some((csv) => {
        if (csv === req || csv.includes(req) || req.includes(csv)) return true
        const mappedCsv = columnMappings[csv]
        if (mappedCsv && (mappedCsv === req || mappedCsv.includes(req) || req.includes(mappedCsv))) return true
        return false
      })
    })

    const matchingColumns = normalizedCsvColumns.filter((csv) => {
      return normalizedAllValid.some((valid) => {
        if (csv === valid || csv.includes(valid) || valid.includes(csv)) return true
        const mappedCsv = columnMappings[csv]
        return mappedCsv && (mappedCsv === valid || mappedCsv.includes(valid) || valid.includes(mappedCsv))
      })
    })

    const extraColumns = normalizedCsvColumns.filter((csv) => {
      return !normalizedAllValid.some((valid) => {
        if (csv === valid || csv.includes(valid) || valid.includes(csv)) return true
        const mappedCsv = columnMappings[csv]
        return mappedCsv && (mappedCsv === valid || mappedCsv.includes(valid) || valid.includes(mappedCsv))
      })
    })

    return {
      valid: missingRequired.length === 0,
      missingRequired,
      extraColumns,
      matchingColumns: matchingColumns,
    }
  }

  // Función mejorada para procesar el archivo CSV (preview rápida y validación en streaming)
  const processFile = async (file: File) => {
    try {
      setCsvProcessingState({
        stage: 'processing',
        progress: 5,
        message: 'Leyendo archivo (modo rápido)...'
      })

      let detectedType: 'fitness' | 'nutrition' | null = null
      let columnsInitialized = false
      let csvColumns: string[] = []
      let processedCount = 0
      let validRowsCount = 0
      let invalidRowsCount = 0
      const previewRows: any[] = []
      const errorPreviewRows: any[] = []
      const allErrors: string[] = []
      const allWarnings: string[] = []

      // Mostrar preview lo antes posible, limitar renders
      let lastUiUpdate = 0
      const maybeUpdateUi = () => {
        const now = Date.now()
        if (now - lastUiUpdate > 300) {
          lastUiUpdate = now
          if (detectedType && csvColumns.length > 0) {
            setDetectedFileType(detectedType)
            setProgramType(detectedType)
            setFilePreview({
              totalRows: validRowsCount,
              previewRows,
              errorPreviewRows,
              allColumns: csvColumns,
            })
            setValidationReport({
              totalRows: processedCount,
              validRows: validRowsCount,
              invalidRows: invalidRowsCount,
              errors: allErrors.slice(0, 10),
              warnings: allWarnings.slice(0, 10),
            })
            setCsvProcessingState({
              stage: 'processing',
              progress: Math.min(95, Math.max(10, Math.floor((processedCount % 1000) / 10))),
              message: `Procesando filas... (${processedCount})`
            })
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          worker: true,
          fastMode: true,
          step: (results: any, parser: any) => {
            const row = results?.data
            const fields = results?.meta?.fields as string[] | undefined
            processedCount++

            if (!columnsInitialized && Array.isArray(fields) && fields.length) {
              columnsInitialized = true
              csvColumns = fields
              detectedType = detectFileType(csvColumns)
              // Primer update temprano
              maybeUpdateUi()
            }

            if (!detectedType) return

            const validation = validateCSVRow(row, processedCount, detectedType)
            if (validation.valid) {
              validRowsCount++
              if (previewRows.length < 5) {
                previewRows.push({ ...row, _valid: true })
              }
            } else {
              invalidRowsCount++
              if (allErrors.length < 10) allErrors.push(...validation.errors)
              if (allWarnings.length < 10) allWarnings.push(...validation.warnings)
              if (errorPreviewRows.length < 5) errorPreviewRows.push({ ...row, _valid: false, _errors: validation.errors })
            }

            if (processedCount % 200 === 0) {
              maybeUpdateUi()
            }
          },
          complete: () => {
            // Finalizar y consolidar datos
            const finalType: 'fitness' | 'nutrition' = (detectedType || 'fitness')
 
            setDetectedFileType(finalType)
            setProgramType(finalType)

            setValidationReport({
              totalRows: processedCount,
              validRows: validRowsCount,
              invalidRows: invalidRowsCount,
              errors: allErrors.slice(0, 10),
              warnings: allWarnings.slice(0, 10),
            })

            setFilePreview({
              totalRows: validRowsCount,
              previewRows,
              errorPreviewRows,
              allColumns: csvColumns,
            })

            setCsvProcessingState({
              stage: 'complete',
              progress: 100,
              message: `Archivo procesado: ${validRowsCount} filas válidas de ${processedCount} total`
            })

            // Guardar operación pendiente sin mantener todos los datos en memoria
            setPendingOperations(prev => ({
              ...prev,
              uploadOperations: [
                ...prev.uploadOperations.filter(op => !(op.type === finalType)),
                {
                  type: finalType,
                  file: file,
                  mode: uploadMode,
                  processedData: undefined, // Se reprocesará al guardar
                  validationReport: {
                    totalRows: processedCount,
                    validRows: validRowsCount,
                    invalidRows: invalidRowsCount,
                    errors: allErrors.slice(0, 10),
                    warnings: allWarnings.slice(0, 10),
                  },
                },
              ],
            }))
            setHasChanges(true)
            setFileProcessed(true)
            setFileProcessing(false)
            resolve()
          },
          error: (error: any) => {
            reject(error)
          },
        })
      })

      // Toast final
      if (invalidRowsCount > 0) {
        toast({
          title: 'Archivo procesado con advertencias',
          description: `${validRowsCount} filas válidas, ${invalidRowsCount} filas con errores serán descartadas.`,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Archivo procesado exitosamente', description: `${validRowsCount} filas válidas detectadas.` })
      }

        toast({
        title: 'Tipo de archivo detectado',
        description: `Se detectó automáticamente como archivo de ${(detectedType || 'fitness') === 'fitness' ? 'fitness' : 'nutrición'}.`,
      })
    } catch (error) {
      console.error('Error procesando archivo:', error)
      setCsvProcessingState({
        stage: 'error',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      })
      setFileProcessing(false)
      toast({
        title: 'Error al procesar archivo',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  // Función para ejecutar la carga real de datos usando las APIs existentes
  const executeCSVUpload = async (operation: any): Promise<{ success: boolean; message?: string }> => {
    try {
        mode: operation.mode,
        dataLength: operation.processedData?.length || 0
      })

      setCsvProcessingState({
        stage: 'saving',
        progress: 0,
        message: `Guardando datos de ${operation.type}...`
      })

      // Si es modo replace, primero eliminar datos existentes
      if (operation.mode === "replace") {
        setCsvProcessingState({ stage: 'saving', progress: 20, message: `Eliminando datos existentes de ${operation.type}...` })
        const deleteResponse = await fetch("/api/program-data/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityId: activity?.id || formData.id,
            programType: operation.type,
            coachId: user?.id,
          }),
        })
        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json()
          throw new Error(`Error al eliminar datos existentes: ${errorData.error || 'Error desconocido'}`)
        }
      }

      // Asegurar datos procesados: si no existen, reprocesar el archivo en este paso
      let rowsForSave: any[] = operation.processedData
      if (!rowsForSave || rowsForSave.length === 0) {
        if (!operation.file) throw new Error('No hay datos procesados ni archivo disponible para reprocesar')
        setCsvProcessingState({ stage: 'saving', progress: 40, message: 'Preparando datos para guardar...' })
        // Reprocesar con parse completo (en worker) para esta fase
        rowsForSave = await new Promise<any[]>((resolve, reject) => {
          const rows: any[] = []
          Papa.parse(operation.file, {
            header: true,
            skipEmptyLines: true,
            worker: true,
            fastMode: true,
            step: (r: any) => rows.push(r.data),
            complete: () => resolve(rows),
            error: (err: any) => reject(err),
          })
        })
      }

      // Preparar datos para la API (mapear a estructura de BD)
      setCsvProcessingState({ stage: 'saving', progress: 50, message: `Insertando ${rowsForSave.length} registros...` })

      const mappedData = rowsForSave.map((row: any) => {
        if (operation.type === "fitness") {
          return {
            semana: parseInt(row.semana || row.Semana || "1"),
            día: convertDayToNumber(row.dia || row.Día || row["día"]) || 1,
            nombre_actividad: row.nombre_actividad || row["Nombre de la Actividad"] || row.nombre,
            descripción: row.descripcion || row.Descripción || row["descripción"],
            duración: parseInt(row.duracion || row["duración"] || row["Duración (min)"] || "0"),
            tipo_ejercicio: row.tipo_ejercicio || row["Tipo de Ejercicio"] || row.tipo,
            repeticiones: row.repeticiones || row.Repeticiones || "",
            series: row.series || row.Series || "",
            descanso: row.descanso || row.Descanso || "",
            peso: row.peso || row.Peso || "",
            nivel_intensidad: row.nivel_intensidad || row["Nivel de Intensidad"] || row.intensidad || "Moderado",
            equipo_necesario: row.equipo_necesario || row["Equipo Necesario"] || row.equipo,
            rm: row.rm || row["1RM"] || row.RM || "",
            video: row.video || row.Video || row.video_url || "",
            calorias_consumidas: parseInt(row.calorias_consumidas || row.calorias || row.Calorías || "0"),
            nota_cliente: row.nota_cliente || row.notas || row.Notas || "",
          }
      } else {
          return {
            semana: parseInt(row.semana || row.Semana || "1"),
            día: convertDayToNumber(row.dia || row.Día || row["día"]) || 1,
            comida: row.comida || row.Comida,
            nombre: row.nombre || row.Nombre,
            calorías: parseFloat(row.calorias || row.calorías || row.Calorías || "0"),
            proteínas: parseFloat(row.proteinas || row.proteínas || row.Proteínas || "0"),
            carbohidratos: parseFloat(row.carbohidratos || row.Carbohidratos || "0"),
            peso: row.peso || row.Peso || "",
            receta: row.receta || row.Receta || "",
            video: row.video || row.Video || row.video_url || "",
          }
        }
      })

      const saveResponse = await fetch("/api/program-data/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: operation.type,
          activityId: activity?.id || formData.id,
          programData: mappedData,
          coachId: user?.id,
          uploadMode: "append",
        }),
      })

      const saveResult = await saveResponse.json()
      if (!saveResponse.ok || !saveResult.success) {
        throw new Error(saveResult.error || "Error al guardar los datos del programa")
      }

      setCsvProcessingState({ stage: 'complete', progress: 100, message: `${saveResult.recordsCount} registros guardados exitosamente` })

      return { success: true, message: saveResult.message || `Datos de ${operation.type} guardados exitosamente` }
    } catch (error) {
      console.error(`Error en carga de ${operation.type}:`, error)
      setCsvProcessingState({ stage: 'error', progress: 0, message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` })
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al cargar datos' }
    }
  }

  // Función auxiliar para convertir días a números (para compatibilidad con BD)
  const convertDayToNumber = (day: string): number => {
    const dayMap: Record<string, number> = {
      'lunes': 1, 'monday': 1,
      'martes': 2, 'tuesday': 2, 
      'miercoles': 3, 'miércoles': 3, 'wednesday': 3,
      'jueves': 4, 'thursday': 4,
      'viernes': 5, 'friday': 5,
      'sabado': 6, 'sábado': 6, 'saturday': 6,
      'domingo': 7, 'sunday': 7
    }
    return dayMap[day?.toLowerCase()?.trim()] || 1
  }

  const nextColumnPage = () => {
    if (!previewData || previewData.length === 0) return
    const totalColumns = Object.keys(previewData[0]).length
    const maxPage = Math.ceil(totalColumns / columnsPerPage) - 1
    setColumnPage((prev) => (prev < maxPage ? prev + 1 : prev))
  }

  const prevColumnPage = () => {
    setColumnPage((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const getVisibleColumns = () => {
    if (!previewData || previewData.length === 0) return []
    const allColumns = Object.keys(previewData[0])
    const startIndex = columnPage * columnsPerPage
    return allColumns.slice(startIndex, startIndex + columnsPerPage)
  }

  const getTotalPages = () => {
    if (!previewData || previewData.length === 0) return 0
    const totalColumns = Object.keys(previewData[0]).length
    return Math.ceil(totalColumns / columnsPerPage)
  }

  const triggerPdfInput = () => {
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ""
      pdfInputRef.current.click()
    } else {
      toast({
        title: "Error",
        description: "No se pudo abrir el selector de archivos",
        variant: "destructive",
      })
    }
  }

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("Solo se permiten archivos PDF")
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setPdfError(`El archivo es demasiado grande (máximo 10MB)`)
      toast({
        title: "Error",
        description: "El archivo es demasiado grande (máximo 10MB)",
        variant: "destructive",
      })
      return
    }

    setPdfFile(file)
    setPdfError(null)
    setHasChanges(true) // Mark changes
  }

  const uploadPdfToStorage = async (file: File): Promise<string> => {
    setUploadingPdf(true)

    try {
      if (!isAuthenticated || !user) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      const response = await fetch("/api/storage/admin-upload-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al subir el archivo")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al subir el archivo")
      }

      return result.url
    } catch (error) {
      console.error("Error uploading PDF:", error)
      throw error
    } finally {
      setUploadingPdf(false)
    }
  }

  const AvailabilitySelector = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label className="text-base flex items-center mb-3">
            <Calendar className="h-5 w-5 mr-2 text-orange-400" />
            Días disponibles
          </Label>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = generalSelectedDays.includes(day.id)
              return (
                <div
                  key={day.id}
                  onClick={() => {
                    setGeneralSelectedDays((prevDays) => {
                      const newDays = prevDays.includes(day.id)
                        ? prevDays.filter((d) => d !== day.id)
                        : [...prevDays, day.id]
                      setHasChanges(true) // Mark changes
                      return newDays
                    })
                  }}
                  className={`
                flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all
                ${
                  isSelected
                    ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-900/20"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                }
              `}
                >
                  <span className="text-xs font-medium">{day.id.toUpperCase()}</span>
                  {isSelected && <Check className="h-3 w-3 mt-1" />}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <Label className="text-base flex items-center mb-3">
            <Clock className="h-5 w-5 mr-2 text-orange-400" />
            Franjas horarias
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {timeSlots.map((slot) => {
              const isSelected = generalSelectedHours.includes(slot.id)
              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    setGeneralSelectedHours((prevHours) => {
                      const newHours = prevHours.includes(slot.id)
                        ? prevHours.filter((s) => s !== slot.id)
                        : [...prevHours, slot.id]
                      setHasChanges(true) // Mark changes
                      return newHours
                    })
                  }}
                  className={`
                relative flex items-center p-3 rounded-lg cursor-pointer transition-all
                ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                }
              `}
                >
                  <div className="flex items-center">
                    {slot.icon}
                    <span className="text-sm">{slot.label.split(" ")[0]}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )

  const prepareDescription = (baseDescription: string) => {
    const cleanDescription = baseDescription
      .replace(/\[CONSULTAS_INCLUIDAS\]/g, "")
      .replace(/\[NOTA_CONSULTA\][\s\S]*?\[\/NOTA_CONSULTA\]/g, "")
      .replace(/\[SESSIONS_COUNT\]\d+\[\/SESSIONS_COUNT\]/g, "")
      .replace(/\[RICH_CONTENT\][\s\S]*?\[\/RICH_CONTENT\]/g, "")
      .replace(/\[DURATION\][\s\S]*?\[\/DURATION\]/g, "")
      .replace(/\[PROGRAM_DATA_JSON\][\s\S]*?\[\/PROGRAM_DATA_JSON\]/g, "")
      .trim()

    let newDescription = cleanDescription

    const markers = []

    if (includeConsultations) {
      markers.push("[CONSULTAS_INCLUIDAS]")

      if (consultationNote.trim()) {
        markers.push(`[NOTA_CONSULTA]${consultationNote.trim()}[/NOTA_CONSULTA]`)
      }
    }

    if (formData.rich_description && formData.rich_description.trim()) {
      // No need to wrap rich_description in [RICH_CONTENT] here, it's stored separately
      // and ProductDetailView prioritizes product.rich_description
      // This part is just for the 'description' field if it were to be used as a fallback
      // but we're ensuring rich_description is the primary source.
    }

    if (formData.type === "workshop") {
      markers.push(`[SESSIONS_COUNT]${sessionsCount}[/SESSIONS_COUNT]`)
    }

    if (durationEnabled && durationValue && durationUnit) {
      const durationText = `Duración: ${durationValue} ${
        durationUnit === "week"
          ? durationValue === "1"
            ? "semana"
            : "semanas"
          : durationUnit === "month"
            ? durationValue === "1"
              ? "mes"
              : "meses"
            : durationValue === "1"
              ? "año"
              : "años"
      }`

      markers.push(`[DURATION]${durationText}[/DURATION]`)
    }

    if (markers.length > 0) {
      if (newDescription.trim()) {
        newDescription += "\n\n"
      }
      newDescription += markers.join("\n\n")
    }

    return newDescription
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !user) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para crear o editar productos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUpdateProgress("Iniciando guardado...") // Initial progress message

    const submitTimeout = setTimeout(() => {
      console.error("⏰ Timeout: El envío tardó más de 60 segundos")
      setIsSubmitting(false)
      setUpdateProgress("")
      toast({
        title: "Tiempo agotado",
        description: "La operación tardó demasiado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }, 60000)

    try {
      // Step 1: Handle PDF upload if necessary
      let finalPdfUrl = formData.pdf_url
      if (formData.type === "document" && pdfFile && !finalPdfUrl) {
        setUpdateProgress("Subiendo archivo PDF...")
        finalPdfUrl = await uploadPdfToStorage(pdfFile)
        toast({
          title: "PDF subido",
          description: "El archivo PDF se ha subido correctamente",
        })
      }

      // Step 2: Prepare product data for 'activities' table
      setUpdateProgress("Guardando producto...")

      const { program_data, ...dataToSave } = formData

      // Ensure rich_description is directly used from formData, not extracted from description
      const baseDescriptionText = formData.rich_description || formData.description || ""
      const enhancedDescription = prepareDescription(baseDescriptionText)

      const activityData: ActivityData = {
        ...dataToSave,
        price: typeof formData.price === 'string' ? parseFloat(formData.price) || 0 : formData.price, // Convertir string a número
        coach_id: user.id,
        updated_at: new Date().toISOString(),
        description: enhancedDescription, // This will contain markers, not the full HTML
        rich_description: formData.rich_description || null, // This holds the actual HTML content
        pdf_url: finalPdfUrl,
      }

        title: activityData.title,
        type: activityData.type,
        coach_id: activityData.coach_id,
        isUpdate: !!activity?.id,
        rich_description_length: activityData.rich_description?.length || 0,
      })

      // Step 3: Save the activity FIRST to 'activities' table
      const activityUrl = activity?.id ? `/api/activities/${activity.id}` : "/api/activities"
      const activityMethod = activity?.id ? "PUT" : "POST"

      const activityResponse = await fetch(activityUrl, {
        method: activityMethod,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(activityData),
      })

      if (!activityResponse.ok) {
        const errorData = await activityResponse.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(errorData.error || `Error ${activityResponse.status}: ${activityResponse.statusText}`)
      }
      const activityResult = await activityResponse.json()
      if (!activityResult.success) {
        throw new Error(activityResult.error || "Error al guardar la actividad")
      }
      const newActivityId = activityResult.activityId || activityResult.activity?.id


      // Step 4: Handle coach general availability (if consultations are included)
      if (includeConsultations) {
        setUpdateProgress("Configurando disponibilidad de consultas...")

        const coachAvailabilityData = {
          coach_id: user.id,
          day_of_week: 0, // Dummy value for general preference (e.g., Monday)
          start_time: "00:00:00", // Dummy value for general preference
          end_time: "23:59:59", // Dummy value for general preference
          consultation_type: generalSelectedConsultationTypes, // Array of strings
          is_active: true,
          available_days: generalSelectedDays,
          available_hours: generalSelectedHours,
          videocall_duration: generalVideocallDuration,
          is_general_preference: true, // Mark as general preference
        }

        const coachAvailabilityUrl = generalAvailabilityId
          ? `/api/coach/availability?id=${generalAvailabilityId}`
          : `/api/coach/availability`
        const coachAvailabilityMethod = generalAvailabilityId ? "PUT" : "POST"

        try {
          const coachAvailabilityResponse = await fetch(coachAvailabilityUrl, {
            method: coachAvailabilityMethod,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(coachAvailabilityData),
          })

          if (!coachAvailabilityResponse.ok) {
            const errorData = await coachAvailabilityResponse.json()
            console.error("❌ Error al actualizar disponibilidad general del coach:", errorData)
            toast({
              title: "Error en disponibilidad",
              description:
                errorData.error || "No se pudo guardar la configuración de disponibilidad general del coach.",
              variant: "destructive",
            })
          } else {
            const result = await coachAvailabilityResponse.json()
            setGeneralAvailabilityId(result.id) // Update ID if a new one was created
            toast({
              title: "Disponibilidad de consultas",
              description: "Se ha actualizado la configuración de disponibilidad general del coach.",
            })
          }
        } catch (error) {
          console.error("❌ Error al enviar disponibilidad general del coach:", error)
          toast({
            title: "Error en disponibilidad",
            description: "No se pudo comunicar con el servicio de disponibilidad del coach.",
            variant: "destructive",
          })
        }
      }

      // Step 5: Execute any pending CSV upload operations
      for (const operation of pendingOperations.uploadOperations) {
        
        try {
          const uploadResult = await executeCSVUpload(operation)
          
          if (!uploadResult.success) {
            console.error(`❌ Error en carga de ${operation.type}:`, uploadResult.message)
              toast({
              title: `Error en carga de ${operation.type}`,
              description: uploadResult.message || "Error desconocido",
              variant: "destructive",
              })
            // Continuar con otras operaciones, no fallar todo
            } else {
              toast({
              title: `${operation.type} cargado exitosamente`,
              description: uploadResult.message,
              })
            }
        } catch (operationError) {
          console.error(`💥 Error crítico en operación ${operation.type}:`, operationError)
            toast({
            title: `Error crítico en ${operation.type}`,
            description: "Error inesperado durante la carga",
              variant: "destructive",
            })
          }
      }

      // Clear pending operations after execution
      setPendingOperations({ uploadOperations: [], deleteOperations: [] })


      clearTimeout(submitTimeout)
      toast({
        title: "Éxito",
        description: activity?.id ? "Producto actualizado correctamente" : "Producto creado correctamente",
      })
      setHasChanges(false) // Mark as saved ONLY AFTER ALL OPERATIONS ARE DONE

      onSuccess(
        activity?.id
          ? ({ ...activityData, id: activity.id, difficulty: activityData.difficulty || "beginner" } as any)
          : ({ ...activityData, id: newActivityId, difficulty: activityData.difficulty || "beginner" } as any)
      )
      onClose() // Close the modal only after everything is truly done and saved
    } catch (error) {
      console.error("💥 Error saving product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el producto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false) // Ensure isSubmitting is false on completion or error
      setUpdateProgress("")
    }
  }

  useEffect(() => {
      isSubmitting,
      isAuthenticated,
      fileProcessed,
      uploadMode,
      formDataType: formData.type,
      hasUploadedFile: !!uploadedFile,
      columnValidationValid: columnValidation?.valid,
      activityId: activity?.id,
      hasChanges, // Log hasChanges state
    })
  }, [
    isSubmitting,
    isAuthenticated,
    fileProcessed,
    uploadMode,
    formData.type,
    uploadedFile,
    columnValidation,
    activity?.id,
    hasChanges,
  ])

  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px] bg-gradient-to-b from-gray-900 to-black text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Autenticación requerida</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">Debes iniciar sesión para crear o editar productos.</p>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!isSubmitting && !open && hasChanges) {
            setShowDiscardConfirm(true)
          } else if (!isSubmitting && !open) {
            onClose()
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[800px] lg:max-w-[85vw] max-h-[95vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-black text-white border-gray-800"
          aria-describedby="product-form-description"
        >
          <div id="product-form-description" className="sr-only">
            Formulario para crear o editar un producto
          </div>
          <DialogHeader className="px-6 py-4 bg-gradient-to-r from-orange-600/20 to-purple-600/20 rounded-t-lg border-b border-gray-800">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              {activity?.id ? "Editar Producto" : "Crear Nuevo Producto"}
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 text-sm">
                  Cambios sin guardar
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form
            id="product-form"
            onSubmit={handleSubmit}
            className="px-5 py-4 space-y-5"
            onKeyDown={(e) => {
              // Prevent form submission on Enter key press, unless Shift is also pressed
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
              }
            }}
          >
            {/* Sección 1: Información General - COLAPSADA */}
            <div className="border border-gray-700 rounded-lg bg-gray-800/30">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleSection("generalInfo")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-white">Información General</h3>
                    <p className="text-sm text-gray-400">Título, precio, descripción y configuración básica</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!expandedSections.generalInfo && <Plus className="h-5 w-5 text-gray-400" />}
                  {expandedSections.generalInfo ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedSections.generalInfo && (
                <div className="px-4 pb-4 space-y-5 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base">
                        Título *
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="h-10 text-base bg-gray-800/50 border-gray-700 text-white focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-base">
                        Precio *
                      </Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price || ""}
                        onChange={handleNumberChange}
                        required
                        className="h-10 text-base bg-gray-800/50 border-gray-700 text-white focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Descripción</Label>
                    {/* The onKeyDown handler on the form element above should now prevent submission */}
                    <div>
                      <TiptapEditor
                        content={formData.rich_description || ""}
                        onChange={(content) => handleFormChange((prev) => ({ ...prev, rich_description: content }))}
                        className="bg-gray-800/50 border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="availability_type" className="text-base">
                        Tipo de disponibilidad
                      </Label>
                      <Select
                        value={formData.availability_type || "immediate_purchase"}
                        onValueChange={(value) => handleSelectChange("availability_type", value)}
                      >
                        <SelectTrigger
                          className="h-10 text-base bg-gray-800/50 border-gray-700 text-white
                        "
                        >
                          <SelectValue placeholder="Selecciona tipo de disponibilidad" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="immediate_purchase">Compra inmediata</SelectItem>
                          <SelectItem value="check_availability">Consultar disponibilidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image_url" className="text-base">
                        URL de imagen (opcional)
                      </Label>
                      <Input
                        id="image_url"
                        name="image_url"
                        value={formData.image_url || ""}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="h-10 text-base bg-gray-800/50 border-gray-700 text-white focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Sección de "Producto activo" */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => handleSwitchChange("is_public", checked)}
                        className="h-6 w-12 data-[state=checked]:bg-orange-600"
                      />
                      <Label htmlFor="is_public" className="font-medium text-base text-white">
                        Producto activo
                      </Label>
                    </div>

                    {/* Campos de duración integrados - Solo aparecen cuando is_public está activado */}
                    {formData.is_public && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration_value" className="text-sm text-gray-300">
                            Duración
                          </Label>
                          <Input
                            id="duration_value"
                            name="duration_value"
                            type="number"
                            min="1"
                            value={durationValue}
                            onChange={(e) => {
                              setDurationValue(e.target.value)
                              setHasChanges(true)
                            }}
                            className="h-10 text-base bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Valor"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration_unit" className="text-sm text-gray-300">
                            Unidad
                          </Label>
                          <Select
                            value={durationUnit}
                            onValueChange={(value) => {
                              setDurationUnit(value)
                              setHasChanges(true)
                            }}
                          >
                            <SelectTrigger className="h-10 text-base bg-gray-800/50 border-gray-700 text-white">
                              <SelectValue placeholder="Selecciona unidad" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="week">Semana(s)</SelectItem>
                              <SelectItem value="month">Mes(es)</SelectItem>
                              <SelectItem value="year">Año(s)</SelectItem>
                              <SelectItem value="always">Siempre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sección 2: Tipo de Producto - NO COLAPSADA */}
            <div className="border-t pt-6 mt-6 border-gray-800 space-y-5">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Video className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-xl text-white">Tipo de Producto</h3>
                  <p className="text-sm text-gray-400">Selecciona el tipo de contenido que vas a ofrecer</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: "program", label: "Programa", icon: <FileText className="h-5 w-5 mb-2" /> },
                  { id: "video", label: "Video", icon: <Video className="h-5 w-5 mb-2" /> },
                  { id: "workshop", label: "Taller", icon: <Users className="h-5 w-5 mb-2" /> },
                  { id: "document", label: "Documento", icon: <FileText className="h-5 w-5 mb-2" /> },
                ].map((type) => (
                  <div
                    key={type.id}
                    onClick={() => handleSelectChange("type", type.id)}
                    className={`
          flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all
          ${
            formData.type === type.id
              ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-900/20"
              : "bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-700"
          }
        `}
                  >
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </div>
                ))}
              </div>

              {/* Contenido específico según el tipo seleccionado */}
              {formData.type === "video" && (
                <Card className="border-blue-500/50 shadow-md bg-gray-900/50 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Video</CardTitle>
                    <CardDescription className="text-base mt-1 text-gray-300">
                      Proporciona la URL del video o el ID de Vimeo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="video_url" className="text-base">
                          URL del video
                        </Label>
                        <Input
                          id="video_url"
                          name="video_url"
                          value={formData.video_url || ""}
                          onChange={handleChange}
                          placeholder="https://youtube.com/watch?v=..."
                          className="h-10 text-base bg-gray-800/50 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vimeo_id" className="text-base">
                          ID de Vimeo (opcional)
                        </Label>
                        <Input
                          id="vimeo_id"
                          name="vimeo_id"
                          value={formData.vimeo_id || ""}
                          onChange={handleChange}
                          placeholder="123456789"
                          className="h-10 text-base bg-gray-800/50 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {formData.type === "workshop" && (
                <Card className="border-purple-500/50 shadow-md bg-gray-900/50 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Taller</CardTitle>
                    <CardDescription className="text-base mt-1 text-gray-300">
                      Configura las sesiones y horarios del taller
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sessions_count" className="text-base">
                          Número de sesiones
                        </Label>
                        <Input
                          id="sessions_count"
                          name="sessions_count"
                          type="number"
                          min="1"
                          value={sessionsCount}
                          onChange={(e) => {
                            setSessionsCount(Number(e.target.value))
                            setHasChanges(true)
                          }}
                          className="h-10 text-base bg-gray-800/50 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="available_slots" className="text-base">
                          Plazas disponibles
                        </Label>
                        <Input
                          id="available_slots"
                          name="available_slots"
                          type="number"
                          min="1"
                          value={formData.available_slots || ""}
                          onChange={handleNumberChange}
                          className="h-10 text-base bg-gray-800/50 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Horarios disponibles</Label>
                      {formData.available_times?.map((timeSlot, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="space-y-1">
                            <Label className="text-sm">Fecha</Label>
                            <Input
                              type="date"
                              value={timeSlot.date}
                              onChange={(e) => handleTimeSlotChange(index, "date", e.target.value)}
                              className="h-9 text-sm bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Hora inicio</Label>
                            <Input
                              type="time"
                              value={timeSlot.start_time}
                              onChange={(e) => handleTimeSlotChange(index, "start_time", e.target.value)}
                              className="h-9 text-sm bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Hora fin</Label>
                            <Input
                              type="time"
                              value={timeSlot.end_time}
                              onChange={(e) => handleTimeSlotChange(index, "end_time", e.target.value)}
                              className="h-9 text-sm bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(index)}
                              className="h-9 text-red-400 border-red-500 hover:bg-red-900/20"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTimeSlot}
                        className="w-full h-10 border-purple-500 text-purple-400 hover:bg-purple-900/20 bg-transparent"
                      >
                        Añadir horario
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {formData.type === "document" && (
                <Card className="border-green-500/50 shadow-md bg-gray-900/50 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Documento PDF</CardTitle>
                    <CardDescription className="text-base mt-1 text-gray-300">
                      Sube un archivo PDF o proporciona una URL
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="pdf_url" className="text-base">
                        URL del PDF (opcional)
                      </Label>
                      <Input
                        id="pdf_url"
                        name="pdf_url"
                        value={formData.pdf_url || ""}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/documento.pdf"
                        className="h-10 text-base bg-gray-800/50 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">O sube un archivo PDF</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={pdfInputRef}
                          onChange={handlePdfFileSelect}
                          accept=".pdf"
                          className="hidden"
                          id="pdf-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerPdfInput}
                          className="flex items-center gap-2 h-10 border-green-500 text-green-400 hover:bg-green-900/20 bg-transparent"
                          disabled={uploadingPdf}
                        >
                          {uploadingPdf ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {pdfFile ? "Cambiar PDF" : "Seleccionar PDF"}
                            </>
                          )}
                        </Button>
                        {pdfFile && (
                          <span className="text-sm text-gray-300">
                            {pdfFile.name} ({formatFileSize(pdfFile.size)})
                          </span>
                        )}
                      </div>
                      {pdfError && <p className="text-sm text-red-400">{pdfError}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sección 3: Base de Datos - COLAPSADA (solo para programas) */}
            {formData.type === "program" && (
              <div className="border border-gray-700 rounded-lg bg-gray-800/30">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                  onClick={() => toggleSection("database")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Database className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-white">Base de Datos del Programa</h3>
                      <p className="text-sm text-gray-400">
                        Carga datos de {programType === "fitness" ? "fitness" : "nutrición"} desde archivo CSV
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!expandedSections.database && <Plus className="h-5 w-5 text-gray-400" />}
                    {expandedSections.database ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedSections.database && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-700">
                    {/* Vista previa de datos existentes */}
                    {activity?.id && existingProgramData && (
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-orange-400">Datos actuales del programa</h4>
                          {loadingExistingData && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                        </div>

                        {existingProgramData.fitness && existingProgramData.fitness.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="border-green-500 text-green-400">
                                Fitness: {existingProgramData.fitness.length} registros
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => markDataForDeletion(activity.id!, "fitness")}
                                className="h-8 text-red-400 border-red-500 hover:bg-red-900/20"
                              >
                                Eliminar datos de fitness
                              </Button>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700 max-h-48 overflow-y-auto">
                              <p className="text-sm text-gray-300 mb-2">Últimas 5 filas cargadas:</p>
                              <div className="space-y-1">
                                {existingProgramData.fitness.slice(-5).map((row, index) => (
                                  <div key={index} className="text-xs text-gray-400 border-l-2 border-green-500 pl-2">
                                    <span className="text-green-300">Día {row.día}</span> -
                                    <span className="text-white ml-1">{row.nombre_actividad}</span> -
                                    <span className="text-gray-300">({row.duración}min)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {existingProgramData.nutrition && existingProgramData.nutrition.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="border-blue-500 text-blue-400">
                                Nutrición: {existingProgramData.nutrition.length} registros
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => markDataForDeletion(activity.id!, "nutrition")}
                                className="h-8 text-red-400 border-red-500 hover:bg-red-900/20"
                              >
                                Eliminar datos de nutrición
                              </Button>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700 max-h-48 overflow-y-auto">
                              <p className="text-sm text-gray-300 mb-2">Últimas 5 filas cargadas:</p>
                              <div className="space-y-1">
                                {existingProgramData.nutrition.slice(-5).map((row, index) => (
                                  <div key={index} className="text-xs text-gray-400 border-l-2 border-blue-500 pl-2">
                                    <span className="text-blue-300">{row.comida}</span> -
                                    <span className="text-white ml-1">{row.nombre}</span> -
                                    <span className="text-gray-300">({row.calorías} cal)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {!existingProgramData.fitness?.length && !existingProgramData.nutrition?.length && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No hay datos de programa cargados para esta actividad
                          </p>
                        )}
                      </div>
                    )}

                    {/* Botón para cargar datos */}
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUploadOptions(!showUploadOptions)}
                        className="flex items-center gap-2 h-12 px-6 border-green-500 text-green-400 hover:bg-green-900/20"
                      >
                        <Upload className="h-5 w-5" />
                        Cargar Datos
                      </Button>
                    </div>

                    {/* Opciones de carga */}
                    {showUploadOptions && (
                      <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        {activity?.id &&
                          existingProgramData &&
                          (existingProgramData.fitness?.length > 0 || existingProgramData.nutrition?.length > 0) && (
                            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                                <h5 className="font-medium text-yellow-300">Esta actividad ya tiene datos cargados</h5>
                              </div>
                              <p className="text-sm text-yellow-200 mb-3">
                                ¿Qué deseas hacer con el nuevo archivo CSV?
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadMode("replace")
                                    setHasChanges(true)
                                  }}
                                  className={`p-3 rounded-lg border transition-all text-sm ${
                                    uploadMode === "replace"
                                      ? "bg-red-900/30 border-red-500 text-red-200"
                                      : "bg-gray-800 border-gray-600 text-gray-300 hover:border-red-500"
                                  }`}
                                >
                                  <div className="font-medium">Reemplazar datos</div>
                                  <div className="text-xs mt-1 opacity-80">
                                    Eliminar datos existentes y cargar los nuevos
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadMode("append")
                                    setHasChanges(true)
                                  }}
                                  className={`p-3 rounded-lg border transition-all text-sm ${
                                    uploadMode === "append"
                                      ? "bg-green-900/30 border-green-500 text-green-200"
                                      : "bg-gray-800 border-gray-600 text-gray-300 hover:border-green-500"
                                  }`}
                                >
                                  <div className="font-medium">Agregar datos</div>
                                  <div className="text-xs mt-1 opacity-80">
                                    Mantener datos existentes y añadir los nuevos
                                  </div>
                                </button>
                              </div>
                            </div>
                          )}

                        <div className="flex items-start mb-3">
                          <Info className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-orange-400">Formato del archivo CSV</h4>
                            <p className="text-sm text-gray-300 mt-1">
                              El sistema detectará automáticamente si es un programa de fitness o nutrición basado en
                              las columnas del archivo.
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={copyTemplateLink}
                              className="flex items-center gap-2 h-8 mt-2 text-gray-300 hover:text-orange-400 p-0"
                            >
                              {linkCopied ? (
                                <>
                                  <Check className="h-4 w-4 text-green-500" />
                                  Plantilla copiada
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copiar enlace a plantilla
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileUpload}
                              accept=".csv"
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className={`flex items-center gap-2 h-10 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-none rounded-md px-4 py-2 cursor-pointer ${
                                fileProcessing || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {fileProcessing ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  Procesando archivo...
                                </>
                              ) : !isAuthenticated ? (
                                <>
                                  <AlertCircle className="h-5 w-5" />
                                  Inicia sesión para subir
                                </>
                              ) : (
                                <>
                                  <Upload className="h-5 w-5" />
                                  {uploadedFile ? "Cambiar archivo CSV" : "Seleccionar archivo CSV"}
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Estados de procesamiento y errores */}
                        {fileProcessing && (
                          <div className="flex items-center justify-between gap-2 text-base p-3 bg-blue-900/30 rounded border border-blue-700">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-blue-300 flex-shrink-0" />
                              <div className="text-blue-200">
                                <p className="font-medium">Procesando archivo CSV...</p>
                                <p className="text-xs mt-1">Detectando tipo de programa y validando estructura...</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {uploadedFile && (
                          <div className="flex items-center justify-between gap-2 text-base p-3 bg-gray-900/70 rounded border border-gray-700">
                            <div className="flex items-center gap-2 truncate">
                              <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-medium text-white truncate block">{uploadedFile.name}</span>
                                <span className="text-xs text-gray-400">
                                  {formatFileSize(uploadedFile.size)} • Tipo:{" "}
                                  {programType === "fitness" ? "Fitness" : "Nutrición"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {fileProcessed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            </div>
                          </div>
                        )}

                        {fileError && (
                          <div className="flex items-center gap-2 text-base p-3 bg-red-900/50 rounded border border-red-700">
                            <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0" />
                            <div className="text-red-200">
                              <p className="font-medium">Error al procesar el archivo</p>
                              <p className="text-sm mt-1">{fileError}</p>
                            </div>
                          </div>
                        )}

                        {/* Estado de procesamiento de CSV */}
                        {csvProcessingState.stage !== 'idle' && (
                          <div className="space-y-2 text-xs text-gray-400">
                            {csvProcessingState.stage === 'processing' && 'Procesando archivo...'}
                            {csvProcessingState.stage === 'saving' && 'Guardando datos...'}
                            {csvProcessingState.stage === 'error' && 'Error en procesamiento'}
                          </div>
                        )}

                        {/* Preview existente mejorado */}
                        {fileProcessed && filePreview && (
                          <div className="space-y-4 border p-4 rounded-lg border-gray-700 bg-gray-900/50 overflow-x-hidden">
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                  className={`px-3 py-1 text-base ${
                                    detectedFileType === "fitness" 
                                      ? "border-green-500 text-green-400 bg-green-950/20" 
                                      : "border-blue-500 text-blue-400 bg-blue-950/20"
                                  }`}
                                >
                                  {detectedFileType === "fitness" ? "🏋️ Plan de FITNESS" : "🥗 Plan de NUTRICIÓN"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  Detectado automáticamente
                              </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newType = programType === "fitness" ? "nutrition" : "fitness"
                                    setProgramType(newType)
                                    setDetectedFileType(newType)
                                  }}
                                  className="text-xs text-gray-400 hover:text-white"
                                >
                                  {programType === "fitness" ? "Cambiar a Nutrición" : "Cambiar a Fitness"}
                                </Button>
                              </div>
                            </div>

                            {/* Información del archivo */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <div className="font-medium text-green-300 mb-1">📊 Filas Válidas</div>
                                <div className="text-xl font-bold text-white">{filePreview.totalRows}</div>
                                <div className="text-xs text-gray-400">filas detectadas</div>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <div className="font-medium text-blue-300 mb-1">📦 Total del archivo</div>
                                <div className="text-xl font-bold text-white">{validationReport?.totalRows ?? (filePreview.totalRows)}</div>
                                <div className="text-xs text-gray-400">filas originales</div>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <div className="font-medium text-orange-300 mb-1">👀 Preview</div>
                                <div className="text-xl font-bold text-white">5</div>
                                <div className="text-xs text-gray-400">primeras filas</div>
                              </div>
                            </div>

                            {/* Lista de columnas detectadas */}
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                              <div className="font-medium text-gray-300 mb-2">🔍 Columnas detectadas en el archivo:</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {filePreview.allColumns.map((column, index) => {
                                  const isSeriesColumn = column.toLowerCase().includes("detalle de series")
                                  return (
                                    <div key={index} className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${isSeriesColumn ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                      <span className={`text-gray-300 ${isSeriesColumn ? 'font-medium text-orange-300' : ''}`}>
                                        {column}
                                        {isSeriesColumn && " ⚡"}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                              
                              {/* Información sobre formato de series si se detecta */}
                              {detectedFileType === "fitness" && filePreview.allColumns.some(col => 
                                col.toLowerCase().includes("detalle") && col.toLowerCase().includes("series")
                              ) && (
                                <div className="mt-3 p-2 bg-orange-900/20 border border-orange-700/50 rounded">
                                  <div className="text-xs font-medium text-orange-300 mb-1">⚡ Formato de Detalle de Series:</div>
                                  <div className="text-xs text-orange-200 space-y-1">
                                    <div>📋 Formato: <code className="bg-gray-900 px-1 rounded">[(peso-reps-series);(peso-reps-series);...]</code></div>
                                    <div>📝 Ejemplo: <code className="bg-gray-900 px-1 rounded">[(12-10-2);(10-8-1);(16-6-1)]</code></div>
                                    <div className="text-xs text-gray-400">
                                      • (12-10-2) = 2 series de 10 reps con 12kg<br/>
                                      • (10-8-1) = 1 serie de 8 reps con 10kg<br/>
                                      • (16-6-1) = 1 serie de 6 reps con 16kg
                                    </div>
                            </div>
                          </div>
                        )}
                      </div>

                            {/* Preview en tabla: columnas + primeras 5 filas con filtro de válidas/errores */}
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-300">👀 Preview - Primeras 5 filas</div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className={`px-2 py-1 rounded text-xs border ${previewMode === 'valid' ? 'border-green-500 text-green-300 bg-green-900/20' : 'border-gray-600 text-gray-300 hover:border-green-500'}`}
                                    onClick={() => setPreviewMode('valid')}
                                  >
                                    Ver válidas
                                  </button>
                                  <button
                                    type="button"
                                    className={`px-2 py-1 rounded text-xs border ${previewMode === 'error' ? 'border-red-500 text-red-300 bg-red-900/20' : 'border-gray-600 text-gray-300 hover:border-red-500'}`}
                                    onClick={() => setPreviewMode('error')}
                                  >
                                    Ver con error
                                  </button>
                                </div>
                              </div>
                              <div className="w-full max-w-full overflow-x-auto overflow-y-hidden">
                                {(() => {
                                  const rows = previewMode === 'valid' ? filePreview.previewRows : (filePreview.errorPreviewRows || []).slice(0, 5)
                                  if (!rows || rows.length === 0) {
                                    return (
                                      <div className="text-xs text-gray-400 p-2">{previewMode === 'valid' ? 'Sin filas válidas en el preview' : 'No se detectaron filas con error en el preview'}</div>
                                    )
                                  }
                                  return (
                                    <table className="w-full text-xs min-w-max table-fixed">
                                      <thead>
                                        <tr>
                                          <th className="text-left p-2 border-b border-gray-700 text-gray-300 whitespace-nowrap">Estado</th>
                                          {filePreview.allColumns.map((col) => (
                                            <th key={col} className="text-left p-2 border-b border-gray-700 text-gray-300 whitespace-nowrap">{col}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rows.map((row: any, idx: number) => (
                                          <tr key={idx} className={`${previewMode === 'error' ? 'bg-red-900/20' : 'odd:bg-gray-900/40'}`}>
                                            <td className="p-2 border-b border-gray-800">
                                              {previewMode === 'error' ? <span className="text-red-300">❌</span> : <span className="text-green-300">✅</span>}
                                            </td>
                                            {filePreview.allColumns.map((col) => (
                                              <td key={col} className={`p-2 border-b border-gray-800 text-gray-200 max-w-[220px] truncate ${previewMode === 'error' ? 'text-red-100' : ''}`}
                                                  title={previewMode === 'error' && Array.isArray(row?._errors) ? (row._errors.join('\n')) : undefined}
                                              >
                                                {String(row[col] ?? "")}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )
                                })()}
                              </div>
                            </div>

                            {/* Validación de columnas */}
                            {columnValidation && (
                              <div className={`p-3 rounded border ${
                                columnValidation.valid 
                                  ? "bg-green-900/30 border-green-700" 
                                  : "bg-yellow-900/30 border-yellow-700"
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {columnValidation.valid ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                                  )}
                                  <span className={`font-medium ${
                                    columnValidation.valid ? "text-green-300" : "text-yellow-300"
                                  }`}>
                                    {columnValidation.valid ? "✅ Formato correcto" : "⚠️ Faltan columnas requeridas"}
                                  </span>
                                </div>
                                {!columnValidation.valid && columnValidation.missingRequired.length > 0 && (
                                  <div className="text-xs text-yellow-200">
                                    <div className="font-medium mb-1">Columnas faltantes para {detectedFileType}:</div>
                                    <div className="text-yellow-300">{columnValidation.missingRequired.join(", ")}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Pregunta sobre reemplazar o agregar */}
                            <div className="bg-orange-900/30 border border-orange-700 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="h-5 w-5 text-orange-400" />
                                <span className="font-medium text-orange-300">¿Qué querés hacer con estos datos?</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadMode("replace")
                                    setHasChanges(true)
                                  }}
                                  className={`p-3 rounded-lg border transition-all text-sm ${
                                    uploadMode === "replace"
                                      ? "bg-red-900/30 border-red-500 text-red-200"
                                      : "bg-gray-800 border-gray-600 text-gray-300 hover:border-red-500"
                                  }`}
                                >
                                  <div className="font-medium">🔄 Reemplazar datos</div>
                                  <div className="text-xs mt-1 opacity-80">
                                    Eliminar datos actuales del plan y cargar estos nuevos
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadMode("append")
                                    setHasChanges(true)
                                  }}
                                  className={`p-3 rounded-lg border transition-all text-sm ${
                                    uploadMode === "append"
                                      ? "bg-green-900/30 border-green-500 text-green-200"
                                      : "bg-gray-800 border-gray-600 text-gray-300 hover:border-green-500"
                                  }`}
                                >
                                  <div className="font-medium">➕ Agregar datos</div>
                                  <div className="text-xs mt-1 opacity-80">
                                    Mantener datos existentes y añadir estas {filePreview.totalRows} filas nuevas
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sección 4: Consultas por Cliente - COLAPSADA */}
            <div className="border border-gray-700 rounded-lg bg-gray-800/30">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleSection("consultations")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-white">Consultas por Cliente</h3>
                    <p className="text-sm text-gray-400">
                      {includeConsultations ? "Consultas habilitadas" : "Habilita consultas directas con clientes"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {includeConsultations && (
                    <Badge variant="outline" className="border-green-500 text-green-400 bg-green-950/20">
                      Activo
                    </Badge>
                  )}
                  {!expandedSections.consultations && <Plus className="h-5 w-5 text-gray-400" />}
                  {expandedSections.consultations ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedSections.consultations && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-base text-white">Habilitar consultas</h4>
                        <p className="text-sm text-gray-300 mt-1">
                          Permite que los clientes puedan contactarte directamente sobre este producto.
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="include_consultations"
                          checked={includeConsultations}
                          onCheckedChange={(checked) => {
                            setIncludeConsultations(checked)
                            setHasChanges(true)
                          }}
                          className="h-6 w-12 data-[state=checked]:bg-purple-600"
                        />
                        <Label htmlFor="include_consultations" className="font-medium text-base text-white">
                          {includeConsultations ? "Habilitadas" : "Deshabilitadas"}
                        </Label>
                      </div>
                    </div>

                    {includeConsultations && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
                        <div>
                          <h5 className="font-medium text-base mb-3 text-purple-400">Disponibilidad para consultas</h5>
                          <p className="text-sm text-gray-300 mb-4">
                            Selecciona los días y horarios en los que estarás disponible para atender consultas sobre
                            este producto.
                          </p>
                          <AvailabilitySelector />
                        </div>

                        <Separator className="my-4 bg-gray-700" />

                        <div className="space-y-3">
                          <h5 className="font-medium text-base mb-3 text-purple-400">Tipo de consulta</h5>
                          <p className="text-sm text-gray-300 mb-4">
                            Selecciona los tipos de consulta que deseas ofrecer para este producto.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {consultationTypes.map((type) => {
                              const isSelected = generalSelectedConsultationTypes.includes(type.id)
                              return (
                                <div
                                  key={type.id}
                                  onClick={() => {
                                    setGeneralSelectedConsultationTypes((prevTypes) => {
                                      const newTypes = prevTypes.includes(type.id)
                                        ? prevTypes.filter((t) => t !== type.id)
                                        : [...prevTypes, type.id]
                                      setHasChanges(true) // Mark changes
                                      return newTypes
                                    })
                                  }}
                                  className={`
        relative flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all
        ${
          isSelected
            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-900/20"
            : "bg-gray-800 p-4 hover:bg-gray-700 text-gray-300 border border-gray-700"
        }
      `}
                                >
                                  <div className="flex flex-col items-center">
                                    {type.icon &&
                                      React.cloneElement(type.icon as any, {
                                        className: "h-8 w-8 mb-2",
                                      } as any)}
                                    <span className="text-sm font-medium">{type.label}</span>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2">
                                      <Check className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {generalSelectedConsultationTypes.includes("videocall") && (
                            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                              <div className="space-y-2">
                                <Label htmlFor="general_videocall_duration" className="text-base flex items-center">
                                  <Clock className="h-5 w-5 mr-2 text-purple-400" />
                                  Duración de la videollamada (minutos)
                                </Label>
                                <Input
                                  id="general_videocall_duration"
                                  name="general_videocall_duration"
                                  type="number"
                                  value={generalVideocallDuration || ""}
                                  onChange={(e) => {
                                    setGeneralVideocallDuration(Number(e.target.value))
                                    setHasChanges(true)
                                  }}
                                  min="1"
                                  className="h-10 text-base bg-gray-800 border-gray-700 text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (hasChanges && !isSubmitting) {
                    setShowDiscardConfirm(true)
                  } else {
                    onClose()
                  }
                }}
                disabled={isSubmitting}
                className="px-6 py-2 border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isAuthenticated || !hasChanges} // Disable if no changes
                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {updateProgress || (activity?.id ? "Actualizando producto..." : "Creando producto...")}
                  </>
                ) : activity?.id ? (
                  "Guardar cambios"
                ) : (
                  "Crear producto"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Confirmation Dialog */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent className="bg-gray-900 text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowDiscardConfirm(false)}
              className="bg-gray-700 text-gray-200 hover:bg-gray-600 border-none"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetForm() // Reset form to initial state
                onClose() // Close the modal
                setShowDiscardConfirm(false)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
