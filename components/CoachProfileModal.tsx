"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Star, Calendar, Award, Package, MessageCircle, Instagram, ExternalLink, Flame, Users, Clock, MapPin, Coffee } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ActivityCard from './ActivityCard'
import { useComponentUsage } from '@/hooks/use-component-usage'
import CoachCard from './CoachCard'
import { useSmartCoachCache } from '@/hooks/use-smart-coach-cache'
import type { Activity } from '@/types/activity'

interface Coach {
  id: string
  name?: string
  full_name?: string
  username?: string
  avatar?: string
  avatar_url?: string
  specialization?: string
  specialty?: string
  experience_years?: number
  experienceYears?: number
  certifications?: string[] | number
  certifications_count?: number
  activities?: Activity[] | number
  products_count?: number
  rating?: number
  total_reviews?: number
  totalReviews?: number
  bio?: string
  description?: string
  whatsapp?: string
  instagram?: string
  verified?: boolean
  isLive?: boolean
  [key: string]: any
}

interface CoachProfileModalProps {
  coach: Coach
  isOpen: boolean
  onClose: () => void
  onActivityClick?: (activity: Activity, fromCoachProfile?: boolean, coachId?: string) => void
  preloadedActivities?: Activity[] // Actividades ya cargadas para reutilizar
}

export default function CoachProfileModal({ coach, isOpen, onClose, onActivityClick, preloadedActivities }: CoachProfileModalProps) {
  const usage = useComponentUsage('CoachProfileModal', { coachId: coach?.id })
  const { getCachedCoach, cacheCoach, preloadCoach } = useSmartCoachCache()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Helper functions para obtener datos del coach
  const getCoachName = () => coach.full_name || coach.name || 'Coach'
  const getCoachAvatar = () => coach.avatar_url || coach.avatar || "/placeholder.svg?height=200&width=200&query=coach"
  const getCoachSpecialization = () => coach.specialization || coach.specialty || 'Fitness'
  const getCoachRating = () => coach.rating || 0
  const getCoachExperience = () => coach.experience_years || coach.experienceYears || 0
  const getCoachCertifications = () => {
    if (coach.certifications_count) return coach.certifications_count
    if (Array.isArray(coach.certifications)) return coach.certifications.length
    return 0
  }
  const getCoachProducts = () => {
    if (coach.products_count) return coach.products_count
    if (Array.isArray(coach.activities)) return coach.activities.length
    return coach.activities || 0
  }
  const getCoachReviews = () => coach.total_reviews || coach.totalReviews || 0

  // Cargar actividades del coach
  useEffect(() => {
    if (isOpen && coach.id) {
      loadCoachActivities()
    }
  }, [isOpen, coach.id])

  const loadCoachActivities = async () => {
    const startTime = performance.now()
    
    // Primero verificar si tenemos actividades pre-cargadas (más eficiente)
    if (preloadedActivities && preloadedActivities.length > 0) {
      const coachActivities = preloadedActivities.filter(activity => activity.coach_id === coach.id)
      if (coachActivities.length > 0) {
        console.log('✅ CoachProfileModal: Actividades cargadas desde cache', {
          totalActivities: preloadedActivities.length,
          coachActivities: coachActivities.length,
          loadTime: 'instant'
        })
        setActivities(coachActivities)
        // Cachear para futuras navegaciones
        cacheCoach(coach.id, coach, coachActivities)
        return
      }
    }
    
    // Segundo: verificar si tenemos datos en cache
    const cachedData = getCachedCoach(coach.id)
    if (cachedData && cachedData.activities.length > 0) {
      console.log('✅ CoachProfileModal: Actividades cargadas desde cache', {
        activitiesCount: cachedData.activities.length,
        cacheTime: Math.round((Date.now() - cachedData.lastAccessed) / 1000) + 's ago'
      })
      setActivities(cachedData.activities)
      return
    }
    
    setLoadingActivities(true)
    try {
      
      // Usar la misma API que search-screen.tsx para obtener datos consistentes
      const response = await fetch("/api/activities/search", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const allActivities = await response.json()
      const apiEndTime = performance.now()
      
      // Filtrar solo las actividades de este coach
      const filterStartTime = performance.now()
      const coachActivities = allActivities.filter((activity: any) => 
        activity.coach_id === coach.id
      )
      const filterEndTime = performance.now()
      
      setActivities(coachActivities)
      
      // Cachear los datos para futuras navegaciones
      cacheCoach(coach.id, coach, coachActivities)
      
      const totalEndTime = performance.now()
      
    } catch (error) {
      const endTime = performance.now()
      console.error(`❌ [COACH-MODAL] Error en ${(endTime - startTime).toFixed(2)}ms:`, error)
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleActivityClick = (activity: Activity) => {
    // usage.onClick(activity.id, { where: 'CoachProfileModal' }) // Removido - variable no definida
    
    // NO cerrar el modal del coach aquí - se manejará en la pila de navegación
    // Llamar a la función del componente padre para abrir el modal de actividad con contexto
    if (onActivityClick) {
      onActivityClick(activity, true, coach.id) // Pasar contexto de que viene del perfil del coach
    } else {
      console.error('❌ [COACH-MODAL] onActivityClick is not defined!')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#1A1A1A] rounded-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800/30 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con diseño de card horizontal */}
          <div className="relative p-4 border-b border-gray-800/50">
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-800/50 hover:bg-gray-700/50 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-300" />
            </button>

            {/* Usar el componente CoachCard existente */}
            <CoachCard 
              coach={coach} 
              size="horizontal"
              onClick={() => {}} // No hacer nada al hacer click en el modal
            />
          </div>

          {/* Contenido principal */}
          <div className="p-4 space-y-4">
            {/* Sección de Certificaciones */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Award className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Certificaciones</h3>
              </div>
              <div className="bg-gray-800/20 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  {getCoachCertifications() > 0 
                    ? `${getCoachCertifications()} certificaciones disponibles`
                    : 'Sin certificaciones registradas'
                  }
                </p>
              </div>
            </div>

            {/* Sección de Consultas - Layout vertical */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MessageCircle className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Consultas Disponibles</h3>
              </div>
              <div className="flex space-x-3">
                {/* Café - $15 */}
                <div className="bg-gray-800/20 rounded-lg p-3 flex-1 flex flex-col items-center text-center">
                  <Coffee className="w-6 h-6 text-orange-400 mb-2" />
                  <p className="text-white font-medium text-sm mb-1">Café</p>
                  <p className="text-gray-400 text-xs mb-2">Consulta informal</p>
                  <span className="text-orange-400 font-bold text-lg">$15</span>
                </div>

                {/* Meet 30 min - $30 */}
                <div className="bg-gray-800/20 rounded-lg p-3 flex-1 flex flex-col items-center text-center">
                  <Clock className="w-6 h-6 text-orange-400 mb-2" />
                  <p className="text-white font-medium text-sm mb-1">Meet 30 min</p>
                  <p className="text-gray-400 text-xs mb-2">Consulta de 30 minutos</p>
                  <span className="text-orange-400 font-bold text-lg">$30</span>
                </div>

                {/* Meet 1 hora - $60 */}
                <div className="bg-gray-800/20 rounded-lg p-3 flex-1 flex flex-col items-center text-center">
                  <Users className="w-6 h-6 text-orange-400 mb-2" />
                  <p className="text-white font-medium text-sm mb-1">Meet 1 hora</p>
                  <p className="text-gray-400 text-xs mb-2">Consulta completa de 1 hora</p>
                  <span className="text-orange-400 font-bold text-lg">$60</span>
                </div>
              </div>
            </div>

            {/* Botones de contacto */}
            <div className="flex space-x-2">
              {coach.whatsapp && (
                <a
                  href={`https://wa.me/${coach.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}
              {coach.instagram && (
                <a
                  href={`https://www.instagram.com/${coach.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}
            </div>

            {/* Actividades del coach - Scroll horizontal */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Actividades</h3>
                <span className="text-xs text-gray-400">{activities.length} productos</span>
              </div>

              {loadingActivities ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-6 bg-gray-800/20 rounded-lg">
                  <Package className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Sin actividades publicadas</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-0.5" style={{ minWidth: "min-content" }}>
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex-shrink-0 w-44">
                        <ActivityCard
                          activity={activity}
                          size="small"
                          onClick={handleActivityClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
