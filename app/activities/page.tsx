"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SettingsIcon } from '@/components/settings-icon'
import { OmniaLogoText } from '@/components/omnia-logo'
import { BottomNavigation } from '@/components/mobile/bottom-navigation'
import ActivityCard from '@/components/ActivityCard'
import ClientProductModal from '@/components/client-product-modal'

interface Activity {
  id: number
  title: string
  description: string
  type: string
  difficulty: string
  price: number
  coach_name: string
  coach_avatar_url: string
  program_rating: number
  total_program_reviews: number
  exercisesCount: number
  totalSessions: number
  modality: string
  activity_media?: Array<{
    image_url: string
    video_url?: string
  }>
}

export default function ActivitiesPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("search")
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities/search')
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const handleBack = () => {
    router.push('/?tab=search')
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
              <ShoppingCart className="h-6 w-6 mr-2 text-[#FF7939]" />
              Todas las Actividades
            </h1>
          </div>

          {/* Activities List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <ActivityCard 
                    activity={activity} 
                    size="medium"
                    onClick={(selectedActivity) => {
                      // Abrir modal de producto
                      setSelectedActivity(selectedActivity)
                      setIsProductModalOpen(true)
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {selectedActivity && (
        <ClientProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false)
            setSelectedActivity(null)
          }}
          product={selectedActivity}
          navigationContext={null}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}