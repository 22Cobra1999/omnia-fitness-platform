"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CoachCard from '@/components/CoachCard'
import CoachProfileModal from '@/components/CoachProfileModal'
import ClientProductModal from '@/components/client-product-modal'
import { SettingsIcon } from '@/components/settings-icon'
import { OmniaLogoText } from '@/components/omnia-logo'
import { BottomNavigation } from '@/components/mobile/bottom-navigation'

export default function CoachesPage() {
  const router = useRouter()
  const { coaches, loading } = { coaches: [], loading: false }
  const [filteredCoaches, setFilteredCoaches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const [selectedCoach, setSelectedCoach] = useState<any>(null)
  const [isCoachProfileModalOpen, setIsCoachProfileModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [navigationContext, setNavigationContext] = useState<any>(null)

  useEffect(() => {
    if (coaches && Array.isArray(coaches)) {
      setFilteredCoaches(coaches)
    }
  }, [coaches])

  const handleBack = () => {
    // Limpiar todo el estado antes de regresar
    setIsCoachProfileModalOpen(false)
    setIsProductModalOpen(false)
    setSelectedCoach(null)
    setSelectedActivity(null)
    setNavigationContext(null)
    router.push('/?tab=search')
  }

  const handleActivityClick = (activity: any, fromCoachProfile = false, coachId?: string) => {
    console.log('Activity clicked:', activity.title, 'fromCoachProfile:', fromCoachProfile)
    setSelectedActivity(activity)
    
    // Configurar contexto de navegación
    if (fromCoachProfile && coachId) {
      setNavigationContext({
        fromCoachProfile: true,
        coachId: coachId,
        onReturnToCoach: () => {
          setIsProductModalOpen(false)
          setSelectedActivity(null)
          setNavigationContext(null)
          setIsCoachProfileModalOpen(true)
        }
      })
    } else {
      setNavigationContext(null)
    }
    
    setIsProductModalOpen(true)
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black rounded-b-[32px] px-5 py-0.5 flex justify-between items-center">
        {/* Settings Icon */}
        <div className="flex items-center">
          <SettingsIcon />
        </div>

        {/* OMNIA Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 translate-y-1">
          <OmniaLogoText size="text-3xl" />
        </div>

        {/* Placeholder para balance visual */}
        <div className="w-10 h-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pt-14 pb-16">
        <div className="p-4">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-white hover:text-[#FF7939] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </button>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <User className="h-6 w-6 mr-2 text-[#FF7939]" />
              Todos los Coaches
            </h1>
          </div>

          {/* Coaches List */}
          {loading || !filteredCoaches || filteredCoaches.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
            </div>
          ) : (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filteredCoaches.map((coach, index) => (
                <motion.div
                  key={coach.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <CoachCard 
                    coach={coach} 
                    size="vertical"
                    onClick={(selectedCoach) => {
                      // Abrir modal del perfil del coach
                      setSelectedCoach(selectedCoach)
                      setIsCoachProfileModalOpen(true)
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Coach Profile Modal */}
      {selectedCoach && (
        <CoachProfileModal
          coach={selectedCoach}
          isOpen={isCoachProfileModalOpen}
          onClose={() => {
            setIsCoachProfileModalOpen(false)
            // No resetear selectedCoach aquí para mantener la navegación contextual
            // setSelectedCoach(null)
          }}
          onActivityClick={handleActivityClick}
        />
      )}

      {/* Product Modal */}
      {selectedActivity && (
        <ClientProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false)
            setSelectedActivity(null)
            // No resetear navigationContext aquí, se maneja en handleClose del modal
          }}
          product={selectedActivity}
          navigationContext={navigationContext}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
