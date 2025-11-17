"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Star, MapPin, Calendar, Award, Package, TrendingUp, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import ClientProductModal from '@/components/client/activities/client-product-modal'

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
}

export default function CoachProfileModal({ 
  isOpen, 
  onClose, 
  coach,
  navigationContext
}: CoachProfileModalProps) {
  const [coachProducts, setCoachProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  // Cargar productos del coach cuando se abre el modal
  useEffect(() => {
    if (isOpen && coach?.id) {
      loadCoachProducts()
    }
  }, [isOpen, coach?.id])

  const loadCoachProducts = async () => {
    if (!coach?.id) return
    
    setLoadingProducts(true)
    try {
      // Usar la misma API que el search para obtener productos
      const response = await fetch(`/api/activities/search?coachId=${coach.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch coach products')
      }
      
      const products = await response.json()
      setCoachProducts(products || [])
    } catch (error) {
      console.error('Error cargando productos del coach:', error)
      setCoachProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="coach-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
          onClick={handleClose}
        >
        <motion.div
          key="coach-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-[#1A1A1A] rounded-2xl w-full max-w-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cerrar */}
          <div className="absolute top-4 right-4 z-[100]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="bg-black/50 hover:bg-black/70 text-white hover:text-white backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Header del Coach */}
          <div className="relative p-6 pb-4">
            {/* Imagen de fondo difuminada */}
            {coach.avatar_url && (
              <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                <Image 
                  src={coach.avatar_url} 
                  alt={coach.name} 
                  fill
                  className="object-cover blur-sm scale-110" 
                />
                <div className="absolute inset-0 bg-black/60" />
              </div>
            )}

            {/* Contenido del header */}
            <div className="relative z-10 text-center">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden">
                  {coach.avatar_url ? (
                    <img 
                      src={coach.avatar_url} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white font-bold">{coach.name[0]}</span>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <h1 className="text-2xl font-bold text-white mb-2">
                {coach.name}
              </h1>

              {/* Rating */}
              {coach.rating && coach.rating > 0 ? (
                <div className="flex items-center justify-center text-[#FF7939] mb-4">
                  <Star className="w-5 h-5 fill-current mr-1" />
                  <span className="text-lg font-semibold">{coach.rating.toFixed(1)}</span>
                  <span className="text-gray-400 ml-2">
                    ({coach.total_sessions || 0} sesiones)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 mb-4">
                  <Star className="w-5 h-5 mr-1" />
                  <span>Sin reseñas aún</span>
                </div>
              )}

              {/* Información del coach */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-4 h-4 text-[#FF7939] mr-2" />
                  <span className="text-sm">{coach.location || "No especificada"}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 text-[#FF7939] mr-2" />
                  <span className="text-sm">{coach.experience_years || 0} años de experiencia</span>
                </div>
              </div>

              {/* Bio */}
              {coach.bio && (
                <div className="text-center mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {coach.bio}
                  </p>
                </div>
              )}

              {/* Especialización */}
              {coach.specialization && (
                <div className="text-center mb-4">
                  <span className="text-[#FF7939] bg-[#FF7939]/10 px-3 py-1 rounded-full text-sm font-medium border border-[#FF7939]/20">
                    {coach.specialization}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Productos del Coach */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Package className="w-5 h-5 mr-2 text-[#FF7939]" />
                Productos ({coachProducts.length})
              </h2>
            </div>

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
          key={`product-modal-${selectedProduct.id || 'unknown'}`}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
          product={selectedProduct}
          navigationContext={{ fromCoach: true, coachId: coach.id }}
        />
      )}
    </AnimatePresence>
  )
}
