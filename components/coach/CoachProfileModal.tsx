"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  Calendar as CalendarIcon,
  TrendingUp,
  MessageCircle,
  Coffee,
  Zap,
  MessageSquare,
  Target,
  GraduationCap,
  ChevronUp,
  ChevronDown,
  Clock,
  User,
  Package,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import ActivityCard from "@/components/shared/activities/ActivityCard"
import ClientProductModal from "@/components/client/activities/client-product-modal"
import { PurchaseActivityModal } from "@/components/shared/activities/purchase-activity-modal"
import { CoachPersonalInfoSection } from "@/components/shared/coach/coach-personal-info-section"
import { useCoachProfileLogic } from "./hooks/useCoachProfileLogic"

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
            <div className="relative">
              {/* Imagen de fondo difuminada */}
              {coach.avatar_url && (
                <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                  <Image src={coach.avatar_url} alt={coach.name} fill className="object-cover blur-sm scale-110" />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              )}

              {/* Contenido del header */}
              <div className="relative z-10">
                <CoachPersonalInfoSection
                  coach={{
                    name: coach.name,
                    full_name: coach.name,
                    avatar_url: coach.avatar_url,
                    location: coach.location,
                    bio: coach.bio,
                    specialization: coach.specialization,
                    certifications: coach.certifications,
                    certifications_count: coach.certifications?.length,
                    rating: coach.rating,
                    total_sales: totalSales,
                  }}
                  variant="modal"
                  showStreak={true}
                  streakCount={6}
                  leftAction={
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        const chatIntent = {
                          coachId: coach.id,
                          coachName: coach.name,
                          coachAvatar: coach.avatar_url,
                        }
                        localStorage.setItem("startChatWithCoach", JSON.stringify(chatIntent))
                        window.dispatchEvent(
                          new CustomEvent("navigateToTab", {
                            detail: { tab: "messages" },
                          }),
                        )
                        onClose()
                      }}
                      className="relative z-50 cursor-pointer pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                    >
                      <MessageCircle className="w-6 h-6 group-hover:text-[#FF7939] transition-colors" />
                    </button>
                  }
                  rightAction={
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        const meetContext = {
                          coachId: coach.id,
                          source: "profile_button",
                        }
                        localStorage.setItem("scheduleMeetContext", JSON.stringify(meetContext))
                        sessionStorage.setItem("scheduleMeetIntent", "1")
                        window.dispatchEvent(
                          new CustomEvent("navigateToTab", {
                            detail: { tab: "calendar" },
                          }),
                        )
                        onClose()
                      }}
                      className="relative z-50 cursor-pointer pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                    >
                      <CalendarIcon className="w-6 h-6 group-hover:text-[#FF7939] transition-colors" />
                    </button>
                  }
                />

                {/* Certifications Section */}
                {coachCertifications && coachCertifications.length > 0 && (
                  <div className="text-center mb-4 px-4">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <GraduationCap className="w-4 h-4 text-[#FF7939]" />
                      {coachCertifications.map((cert, index) => {
                        const certName = cert.split("/").pop()?.replace(/\.(pdf|PDF)$/, "") || cert
                        return (
                          <span
                            key={index}
                            className="text-white/70 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10"
                          >
                            {certName}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Statistics Section */}
                <div className="px-6 mb-6">
                  <button
                    onClick={() => setIsStatsOpen(!isStatsOpen)}
                    className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#FF7939]" />
                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Estadísticas</span>
                    </div>
                    {isStatsOpen ? (
                      <ChevronUp className="h-4 w-4 text-white/40" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white/40" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isStatsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider font-bold">
                            Últimos 30 días
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Tasa de respuesta */}
                            <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-zinc-400">Tasa de respuesta</span>
                                <MessageSquare className="h-3 w-3 text-[#FF7939]" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white">0%</span>
                                <span className="text-[9px] text-[#FF7939]">Crítico</span>
                              </div>
                            </div>

                            {/* Tiempo de respuesta */}
                            <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-zinc-400">Tiempo de resp.</span>
                                <Clock className="h-3 w-3 text-[#FF7939]" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white">N/A</span>
                                <span className="text-[9px] text-zinc-500">Rápido</span>
                              </div>
                            </div>

                            {/* Cancelaciones */}
                            <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-zinc-400">Cancelaciones</span>
                                <X className="h-3 w-3 text-[#FF7939]" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white">0</span>
                                <span className="text-[9px] text-zinc-500">Sin canc.</span>
                              </div>
                            </div>

                            {/* Reprogramaciones tardías */}
                            <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-zinc-400">Reprog. tardías</span>
                                <CalendarIcon className="h-3 w-3 text-[#FF7939]" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white">0</span>
                                <span className="text-[9px] text-zinc-500">Sin reprog.</span>
                              </div>
                            </div>

                            {/* Asistencia */}
                            <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-zinc-400">Asistencia</span>
                                <User className="h-3 w-3 text-[#FF7939]" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white">0%</span>
                                <span className="text-[9px] text-[#FF7939]">Mejorar</span>
                              </div>
                            </div>

                            {/* Incidentes */}
                            <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-zinc-400">Incidentes</span>
                                <Target className="h-3 w-3 text-[#FF7939]" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white">0</span>
                                <span className="text-[9px] text-zinc-500">Sin inc.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Productos del Coach */}
            <div className="px-6 pt-2 pb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Package className="w-5 h-5 mr-2 text-[#FF7939]" />
                  Productos ({coachProducts.length})
                </h2>

                <button
                  onClick={() => setIsCafeViewOpen((prev) => !prev)}
                  className={
                    "relative w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 " +
                    "backdrop-blur-md bg-white/5 hover:bg-white/10 " +
                    "shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                  }
                  style={{
                    borderColor:
                      coachConsultations.express.active ||
                        coachConsultations.puntual.active ||
                        coachConsultations.profunda.active
                        ? "rgba(255,121,57,0.65)"
                        : "rgba(255,255,255,0.14)",
                  }}
                >
                  <Coffee
                    className={"h-5 w-5 transition-all duration-200 " + (isCafeViewOpen ? "opacity-40" : "opacity-100")}
                    style={{
                      color:
                        coachConsultations.express.active ||
                          coachConsultations.puntual.active ||
                          coachConsultations.profunda.active
                          ? "#FF7939"
                          : "#9CA3AF",
                    }}
                  />
                </button>
              </div>

              {/* Vista de Consultas */}
              {isCafeViewOpen && (
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Coffee className="w-5 h-5 text-[#FF7939]" />
                    <h3 className="text-white font-semibold text-sm">Meet con el coach</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Express - 15 min */}
                    {coachConsultations.express.active && (
                      <button
                        onClick={() => handlePurchaseConsultation("express")}
                        disabled={isProcessingPurchase === "express"}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                        <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                          {coachConsultations.express.name}
                        </h4>
                        <p className="text-gray-400 text-xs mb-1">{coachConsultations.express.time} min</p>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">$</span>
                          <span className="text-[#FF7939] font-bold text-sm">{coachConsultations.express.price}</span>
                        </div>
                        {isProcessingPurchase === "express" && (
                          <div className="mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                          </div>
                        )}
                      </button>
                    )}

                    {/* Puntual - 30 min */}
                    {coachConsultations.puntual.active && (
                      <button
                        onClick={() => handlePurchaseConsultation("puntual")}
                        disabled={isProcessingPurchase === "puntual"}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Target className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                        <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                          {coachConsultations.puntual.name}
                        </h4>
                        <p className="text-gray-400 text-xs mb-1">{coachConsultations.puntual.time} min</p>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">$</span>
                          <span className="text-[#FF7939] font-bold text-sm">{coachConsultations.puntual.price}</span>
                        </div>
                        {isProcessingPurchase === "puntual" && (
                          <div className="mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                          </div>
                        )}
                      </button>
                    )}

                    {/* Profunda - 60 min */}
                    {coachConsultations.profunda.active && (
                      <button
                        onClick={() => handlePurchaseConsultation("profunda")}
                        disabled={isProcessingPurchase === "profunda"}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <GraduationCap className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                        <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                          {coachConsultations.profunda.name}
                        </h4>
                        <p className="text-gray-400 text-xs mb-1">{coachConsultations.profunda.time} min</p>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">$</span>
                          <span className="text-[#FF7939] font-bold text-sm">{coachConsultations.profunda.price}</span>
                        </div>
                        {isProcessingPurchase === "profunda" && (
                          <div className="mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                          </div>
                        )}
                      </button>
                    )}
                  </div>

                  {!coachConsultations.express.active &&
                    !coachConsultations.puntual.active &&
                    !coachConsultations.profunda.active && (
                      <div className="text-center py-3">
                        <p className="text-gray-400 text-xs">Este coach aún no tiene consultas disponibles</p>
                      </div>
                    )}
                </div>
              )}

              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
                </div>
              ) : coachProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                    {coachProducts.map((product, index) => (
                      <ActivityCard
                        key={product.id || `product-${index}`}
                        activity={product}
                        onClick={() => handleProductClick(product)}
                        size="small"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Este coach aún no tiene productos disponibles</p>
                </div>
              )}
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
