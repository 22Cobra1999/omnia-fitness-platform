"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X, ChevronRight, ChevronLeft, Eye, Calendar, Play, Flame, Globe, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import CalendarScheduleManager from '@/components/calendar-schedule-manager'
import { MediaTypeSelectionModal } from '@/components/media-type-selection-modal'

interface ProgressiveFormProps {
  onOpenMediaModal: (type: 'image' | 'video') => void
  onMediaSelected: (mediaUrl: string, mediaType: 'image' | 'video', mediaFile?: File) => void
  hasLocalVideo?: boolean
  videoFileName?: string
  onClearVideo?: () => void
  generalForm: {
    name: string
    description: string
    price: string
    image: File | { url: string } | null
    videoUrl: string
    modality: string
    is_public: boolean
    capacity?: string
    stockQuantity?: string
  }
  setGeneralForm: (form: any) => void
  validationErrors?: string[]
  fieldErrors?: {[key: string]: boolean}
  onClearFieldError?: (fieldName: string) => void
  specificForm: {
    duration: string
    capacity: string
    workshopType: string
    startDate: string
    endDate: string
    level: string
    availabilityType: string
    stockQuantity: string
    sessionsPerClient: string
    documentType: string
    pages: string
    weeks?: number
    availableExercises?: any[]
    weeklyExercises?: { [key: number]: any[] }
  }
  setSpecificForm: (form: any) => void
  // Props para el CalendarScheduleManager
  initialSchedule?: any[]
  onScheduleChange?: (schedule: any[]) => void
  // Props para navegación del modal principal
  onNextStep?: () => void
  currentModalStep?: string
  selectedType?: string
}

export function ProgressiveForm({
  onOpenMediaModal,
  onMediaSelected,
  hasLocalVideo = false,
  videoFileName,
  onClearVideo,
  generalForm,
  setGeneralForm,
  specificForm,
  setSpecificForm,
  initialSchedule = [],
  onScheduleChange,
  onNextStep,
  currentModalStep,
  selectedType,
  validationErrors = [],
  fieldErrors = {},
  onClearFieldError
}: ProgressiveFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isMediaTypeModalOpen, setIsMediaTypeModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [showVideo, setShowVideo] = useState(!!generalForm.videoUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Actualizar el estado cuando cambie el generalForm
  useEffect(() => {
    
    // Si solo hay video, mostrarlo por defecto
    if (generalForm.videoUrl && !generalForm.image) {
      setShowVideo(true)
    }
    // Si solo hay imagen, mostrar imagen por defecto
    else if (generalForm.image && !generalForm.videoUrl) {
      setShowVideo(false)
    }
    // Si hay ambos, mantener el estado actual o mostrar imagen por defecto
    else if (generalForm.image && generalForm.videoUrl) {
      // Si no hay estado previo, mostrar imagen por defecto
      if (showVideo === undefined) {
        setShowVideo(false)
      }
    }
  }, [generalForm.videoUrl, generalForm.image])

  const nextStep = () => {
    if (onNextStep && currentModalStep === 'general') {
      // Usar la función de navegación del modal principal
      onNextStep()
    } else if (currentStep < 2) {
      // Usar la navegación local del formulario progresivo
      setCurrentStep(currentStep + 1)
    }
  }

  const handleMediaTypeSelected = (type: 'image' | 'video') => {
    onOpenMediaModal(type)
  }

  const handleMediaSelected = (mediaUrl: string, mediaType: 'image' | 'video', mediaFile?: File) => {
    console.log('📁 ProgressiveForm: Media seleccionado', {
      mediaUrl, 
      mediaType, 
      mediaFile: mediaFile ? {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type
      } : null
    })
    
    // Llamar a la función del componente padre para manejar la selección
    onMediaSelected(mediaUrl, mediaType, mediaFile)
    
    // Si se selecciona video, mostrarlo automáticamente
    if (mediaType === 'video') {
      setShowVideo(true)
    }
    
    // Volver al modal de selección de tipo para permitir seleccionar la otra opción
    setIsMediaTypeModalOpen(true)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 px-2 -mt-8">
        
        {/* Paso 1: Información General */}
        {currentStep === 1 && (
          <motion.div 
            key="general"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header con logo OMNIA */}
            <div className="text-center -mt-6">
              {/* Media Preview */}
              <div className="w-full h-48 rounded-xl mx-auto mb-6 mt-4 flex items-center justify-center shadow-lg overflow-hidden relative">
                {generalForm.image && !showVideo ? (
                  <img 
                    src={(generalForm.image as { url: string })?.url || URL.createObjectURL(generalForm.image as File)} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : generalForm.videoUrl && (showVideo || !generalForm.image) ? (
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center relative">
                    <video 
                      ref={videoRef}
                      src={generalForm.videoUrl} 
                      className="w-full h-full object-cover rounded-xl"
                      preload="metadata"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    
                    {/* Botón de play/pausa centrado */}
                    <button
                      onClick={togglePlayPause}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      {!isPlaying && (
                        <div className="w-16 h-16 bg-[#FF7939] rounded-full flex items-center justify-center hover:bg-[#FF6B35] transition-colors shadow-lg">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[#FF7939] rounded-xl flex items-center justify-center mx-auto">
                    <Flame className="w-10 h-10 text-black" />
                  </div>
                )}
                
                {/* Botón para cambiar entre imagen y video */}
                {generalForm.videoUrl && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="absolute bottom-2 right-2 w-6 h-6 bg-[#FF7939] rounded-full flex items-center justify-center hover:bg-[#FF6B35] transition-colors"
                  >
                    <Play className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
              
              {/* Título OMNIA solo cuando no hay media */}
              {!generalForm.image && !generalForm.videoUrl && (
                <h1 className="text-gray-400 text-2xl font-bold -mt-8 mb-0">OMNIA</h1>
              )}
              
              {/* Botones de selección de media */}
              <div className="flex justify-center mt-1">
                <button 
                  onClick={() => setIsMediaTypeModalOpen(true)}
                  className="text-[#FF7939] text-sm hover:text-[#FF6B35] transition-colors cursor-pointer"
                >
                  {generalForm.image || generalForm.videoUrl ? 'cambiar media' : 'subir imagen y/o video'}
                </button>
              </div>
            </div>

            {/* Título y Descripción */}
            <div className="space-y-4 w-full -mt-12 -ml-4 -mr-4">
              <Textarea
                value={generalForm.name}
                onChange={(e) => {
                  setGeneralForm({ ...generalForm, name: e.target.value })
                  if (onClearFieldError) onClearFieldError('name')
                }}
                placeholder="Escribi el nombre del programa aca"
                className={`text-white text-base font-bold text-left bg-transparent border-none focus:ring-0 focus:border-none placeholder-gray-300 w-full resize-none h-14 min-h-14 max-h-14 py-2 px-6 ${
                  fieldErrors.name ? 'border-2 border-red-500 rounded-lg' : ''
                }`}
                rows={2}
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-sm px-6 -mt-2">El nombre es requerido</p>
              )}
              <Textarea
                value={generalForm.description}
                onChange={(e) => {
                  setGeneralForm({ ...generalForm, description: e.target.value })
                  if (onClearFieldError) onClearFieldError('description')
                }}
                placeholder="Detalles del desarrollo del programa para mejorar tu condición física y alcanzar tus objetivos de entrenamiento."
                className={`text-white text-sm text-left bg-transparent border-none focus:ring-0 focus:border-none placeholder-gray-300 resize-none w-full py-2 px-6 ${
                  fieldErrors.description ? 'border-2 border-red-500 rounded-lg' : ''
                }`}
                rows={4}
              />
              {fieldErrors.description && (
                <p className="text-red-500 text-sm px-6 -mt-2">La descripción es requerida</p>
              )}
            </div>

            {/* Campos de configuración */}
            <div className="space-y-6 w-full -mt-2">
              {/* Primera fila: Dificultad | Modalidad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#FF7939]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <Select
                    value={specificForm.level}
                    onValueChange={(value) => {
                      setSpecificForm({ ...specificForm, level: value })
                    }}
                  >
                    <SelectTrigger className="bg-transparent border-none text-gray-300 focus:ring-0 focus:border-none h-auto p-0 w-auto text-lg">
                      <SelectValue placeholder="beginner" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border border-gray-600">
                      <SelectItem value="beginner" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">beginner</SelectItem>
                      <SelectItem value="intermediate" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">intermediate</SelectItem>
                      <SelectItem value="advanced" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Globe className="w-7 h-7 text-[#FF7939]" />
                  </div>
                  <Select
                    value={generalForm.modality || ''}
                    onValueChange={(value) => {
                      setGeneralForm({ ...generalForm, modality: value })
                    }}
                  >
                    <SelectTrigger className="bg-transparent border-none text-gray-300 focus:ring-0 focus:border-none h-auto p-0 w-auto text-lg">
                      <SelectValue placeholder="online" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border border-gray-600">
                      <SelectItem value="online" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">online</SelectItem>
                      <SelectItem value="presencial" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">presencial</SelectItem>
                      <SelectItem value="híbrido" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda fila: VIP | Capacidad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-[#FF7939]" />
                  </div>
                  <Select
                    value={generalForm.is_public ? 'true' : 'false'}
                    onValueChange={(value) => {
                      const newValue = value === 'true'
                      setGeneralForm({ ...generalForm, is_public: newValue })
                    }}
                  >
                    <SelectTrigger className="bg-transparent border-none text-gray-300 focus:ring-0 focus:border-none h-auto p-0 w-auto text-lg">
                      <SelectValue placeholder="VIP" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border border-gray-600">
                      <SelectItem value="true" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">VIP</SelectItem>
                      <SelectItem value="false" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">Público</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 relative">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#FF7939]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <Select
                      value={generalForm.capacity || ''}
                      onValueChange={(value) => {
                        setGeneralForm({ ...generalForm, capacity: value })
                      }}
                    >
                      <SelectTrigger className="bg-transparent border-none text-gray-300 focus:ring-0 focus:border-none h-auto p-0 w-auto text-lg">
                        <SelectValue placeholder="Capacidad" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border border-gray-600">
                        <SelectItem value="stock" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">Stock</SelectItem>
                        <SelectItem value="ilimitada" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">Ilimitada</SelectItem>
                        <SelectItem value="consultar" className="text-gray-300 hover:bg-[#2A2A2A] text-lg">Consultar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo de número cuando se selecciona "stock" */}
                  {generalForm.capacity === 'stock' && (
                    <div className="flex items-center space-x-4 absolute right-0 top-full mt-2">
                      <Input
                        type="number"
                        value={generalForm.stockQuantity || ''}
                        onChange={(e) => {
                          setGeneralForm({ ...generalForm, stockQuantity: e.target.value })
                        }}
                        placeholder="Stock"
                        className="bg-transparent border-none text-gray-300 placeholder-gray-400 focus:ring-0 focus:border-none h-auto p-0 w-20 text-lg text-right"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Precio - Centrado, más abajo y en gris */}
            <div className="flex justify-center items-center pt-8">
              <div className="flex items-center justify-center">
                <span className="text-gray-400 text-2xl font-bold">$</span>
                <Input
                  type="number"
                  value={generalForm.price || '0'}
                  onChange={(e) => {
                    setGeneralForm({ ...generalForm, price: e.target.value })
                    if (onClearFieldError) onClearFieldError('price')
                  }}
                  placeholder="0"
                  className={`bg-transparent border-none text-gray-400 placeholder-gray-500 focus:ring-0 focus:border-none h-auto p-0 w-32 text-2xl font-bold text-center ${
                    fieldErrors.price ? 'border-2 border-red-500 rounded-lg' : ''
                  }`}
                />
              </div>
            </div>
            {fieldErrors.price && (
              <p className="text-red-500 text-sm text-center -mt-2">El precio es requerido</p>
            )}

            {/* Mensaje general de errores de validación */}
            {validationErrors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mt-4">
                <h4 className="text-red-400 font-medium mb-2">Por favor completa los siguientes campos:</h4>
                <ul className="text-red-300 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botón Siguiente mejorado */}
            {(currentStep < 2 || (onNextStep && currentModalStep === 'general')) && (
              <div className="flex justify-end -mt-64 -mr-4">
                <button
                  onClick={nextStep}
                  disabled={currentModalStep === 'general' ? false : currentStep === 1}
                  className="w-12 h-12 bg-[#FF7939] hover:bg-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>
            )}

            {/* Campos adicionales ocultos para funcionalidad */}
            <div className="hidden">
              <Input
                value={generalForm.price}
                onChange={(e) => setGeneralForm({ ...generalForm, price: e.target.value })}
                placeholder="0"
              />
              <Select
                value={specificForm.level}
                onValueChange={(value) => setSpecificForm({ ...specificForm, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* Paso 2: Organizador de ejercicios por semana */}
        {currentStep === 2 && (
          <div className="space-y-8">
            {/* Título centrado */}
            <div className="text-center">
              <h3 className="text-white font-light text-2xl">Semana</h3>
            </div>

            {/* Selector de número de semanas - minimalista */}
            <div className="flex items-center justify-center">
              <Select 
                value={specificForm.weeks?.toString() || '4'} 
                onValueChange={(value) => setSpecificForm({ ...specificForm, weeks: parseInt(value) })}
              >
                <SelectTrigger className="bg-transparent border-0 text-white text-lg font-light focus:ring-0 w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                  {[4, 6, 8, 12, 16, 20, 24].map((week) => (
                    <SelectItem key={week} value={week.toString()} className="text-white hover:bg-[#2A2A2A]">
                      {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de semanas - formato tabla sutil */}
            <div className="w-full">
              <div className="grid grid-cols-7 gap-1">
                {/* Headers de días */}
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">L</span>
                </div>
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">M</span>
                </div>
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">M</span>
                </div>
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">G</span>
                </div>
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">V</span>
                </div>
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">S</span>
                </div>
                <div className="bg-transparent p-3 text-center">
                  <span className="text-white text-sm font-light">D</span>
                </div>

                {/* Filas de semanas */}
                {Array.from({ length: specificForm.weeks || 4 }, (_, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {Array.from({ length: 7 }, (_, dayIndex) => (
                      <div 
                        key={`${weekIndex}-${dayIndex}`}
                        className="bg-gray-900/20 p-2 min-h-[80px] border border-gray-800/20 rounded-lg"
                        onDrop={(e) => {
                          e.preventDefault()
                          const exerciseData = e.dataTransfer.getData('text/plain')
                          if (exerciseData) {
                            const exercise = JSON.parse(exerciseData)
                            // Agregar ejercicio a esta semana/día específico
                            const weeklyExercises = specificForm.weeklyExercises || {}
                            const dayKey = `${weekIndex}-${dayIndex}`
                            const currentDayExercises = (weeklyExercises as any)[dayKey] || []
                            setSpecificForm({
                              ...specificForm,
                              weeklyExercises: {
                                ...weeklyExercises,
                                [dayKey]: [...currentDayExercises, exercise]
                              }
                            })
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="space-y-1">
                          {(specificForm.weeklyExercises as any)?.[`${weekIndex}-${dayIndex}`]?.map((exercise: any, exerciseIndex: number) => (
                            <div key={exerciseIndex} className="bg-blue-600/80 text-white text-xs p-2 rounded">
                              <div className="font-medium truncate">
                                {exercise.name || `Ejercicio ${exerciseIndex + 1}`}
                              </div>
                              <div className="text-blue-200 text-xs">
                                {exercise.time || '7 PM'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Lista de ejercicios - sección debajo */}
            <div className="mt-8">
              <h4 className="text-white font-light text-lg mb-4">Lista de ejercicios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {specificForm.availableExercises?.map((exercise: any, index: number) => (
                  <div 
                    key={index}
                    className="bg-gray-900/20 border border-gray-800/30 rounded-lg p-3 cursor-move hover:bg-[#FF7939]/10 hover:border-[#FF7939]/30 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify(exercise))
                    }}
                  >
                    <p className="text-gray-300 text-sm font-light">{exercise.name || `Ejercicio ${index + 1}`}</p>
                    <p className="text-gray-500 text-xs">{exercise.type || 'General'}</p>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm col-span-3">No hay ejercicios disponibles. Sube un archivo CSV primero.</p>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Modal de selección de tipo de media */}
        <MediaTypeSelectionModal
          isOpen={isMediaTypeModalOpen}
          onClose={() => setIsMediaTypeModalOpen(false)}
          onTypeSelected={handleMediaTypeSelected}
          hasImage={!!generalForm.image}
          hasVideo={!!generalForm.videoUrl}
        />
        

    </div>
  )
}
