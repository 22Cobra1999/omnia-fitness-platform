"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ClientProductModal from "@/components/client/activities/client-product-modal"
import { PurchaseActivityModal } from "@/components/shared/activities/purchase-activity-modal"
import { useCoachProfileLogic } from "./hooks/useCoachProfileLogic"

// Refactored Components
import { CoachProfileHeader } from "./CoachProfileModalBase/components/CoachProfileHeader"
import { CoachProfileCertifications } from "./CoachProfileModalBase/components/CoachProfileCertifications"
import { CoachProfileStats } from "./CoachProfileModalBase/components/CoachProfileStats"
import { CoachProfileProducts } from "./CoachProfileModalBase/components/CoachProfileProducts"
import { CoachProfileConsultations } from "./CoachProfileModalBase/components/CoachProfileConsultations"

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coach: {
    id: string
    name: string
    avatar_url?: string
    bio?: string
    location?: string
    experience_years?: number
    specialization?: string
    certifications?: string[]
    rating?: number
    total_sessions?: number
    total_products?: number
  }
  navigationContext?: {
    fromSearch?: boolean
  }
  preloadedActivities?: any[]
  onActivityClick?: (activity: any) => void
}

export default function CoachProfileModal(props: CoachProfileModalProps) {
  const { isOpen, onClose, coach, preloadedActivities, onActivityClick } = props

  const {
    coachProducts,
    loadingProducts,
    selectedProduct,
    isProductModalOpen,
    isCafeViewOpen,
    setIsCafeViewOpen,
    coachConsultations,
    isProcessingPurchase,
    setIsProcessingPurchase,
    selectedConsultationActivity,
    setSelectedConsultationActivity,
    isPurchaseModalOpen,
    setIsPurchaseModalOpen,
    totalSales,
    coachCertifications,
    isStatsOpen,
    setIsStatsOpen,
    handleProductClick,
    handleCloseProductModal,
    handlePurchaseConsultation,
  } = useCoachProfileLogic({
    isOpen,
    onClose,
    coach,
    preloadedActivities,
    onActivityClick,
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="coach-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 flex items-start justify-center p-4 pt-16"
          onClick={onClose}
        >
          <motion.div
            key="coach-modal-content"
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="relative bg-[#1A1A1A] rounded-2xl w-full max-w-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cerrar */}
            <div className="absolute top-4 right-4 z-[100]">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-black/50 hover:bg-black/70 text-white hover:text-white backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Header del Coach */}
            <CoachProfileHeader
              coach={coach}
              totalSales={totalSales}
              onClose={onClose}
            />

            <div className="relative z-10">
              {/* Certifications Section */}
              <CoachProfileCertifications certifications={coachCertifications} />

              {/* Statistics Section */}
              <CoachProfileStats
                isStatsOpen={isStatsOpen}
                setIsStatsOpen={setIsStatsOpen}
              />
            </div>

            {/* Productos del Coach */}
            <div className="relative z-10">
              {isCafeViewOpen && (
                <div className="px-6">
                  <CoachProfileConsultations
                    coachConsultations={coachConsultations}
                    isProcessingPurchase={isProcessingPurchase}
                    handlePurchaseConsultation={handlePurchaseConsultation}
                    coachName={coach.name}
                  />
                </div>
              )}

              <CoachProfileProducts
                coachProducts={coachProducts}
                loadingProducts={loadingProducts}
                isCafeViewOpen={isCafeViewOpen}
                setIsCafeViewOpen={setIsCafeViewOpen}
                coachConsultations={coachConsultations}
                handleProductClick={handleProductClick}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal del producto */}
      {selectedProduct && (
        <ClientProductModal
          key={`product-modal-${selectedProduct.id || "unknown"}`}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
          product={selectedProduct}
          navigationContext={{ fromCoachProfile: true, coachId: coach.id }}
        />
      )}

      {/* Modal de compra de consulta */}
      {selectedConsultationActivity && (
        <PurchaseActivityModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false)
            setSelectedConsultationActivity(null)
            setIsProcessingPurchase(null)
          }}
          activity={selectedConsultationActivity}
          onPurchaseComplete={() => {
            setIsPurchaseModalOpen(false)
            setSelectedConsultationActivity(null)
            setIsProcessingPurchase(null)
          }}
        />
      )}
    </AnimatePresence>
  )
}
