"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductPreviewCard } from '@/components/shared/products/product-preview-card'
import { ExpandedProductCard } from '@/components/shared/products/expanded-product-card'

interface ProductPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onEdit: (product: any) => void
  onDelete: (product: any) => void
}

export default function ProductPreviewModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete
}: ProductPreviewModalProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isOpen || !product) return null

  const getValidImageUrl = () => {
    const imageUrl = product.activity_media?.[0]?.image_url || product.image?.url

    // Si es una URL de placeholder, usar una imagen real
    if (imageUrl && imageUrl.includes('via.placeholder.com')) {
      return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&timestamp=${Date.now()}`
    }

    return imageUrl
  }

  const handleEdit = () => {
    onEdit(product)
  }

  const handleDelete = () => {
    onDelete(product)
  }

  // Debug: Log para verificar los datos del producto


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1A1A1A] rounded-2xl w-full max-w-2xl border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
            <h2 className="text-xl font-bold text-white">Preview del Producto</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">

            <AnimatePresence mode="wait">
              {!isExpanded ? (
                <motion.div
                  key="compact"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >

                  <ProductPreviewCard
                    product={{
                      id: product.id,
                      title: product.title,
                      description: product.description,
                      price: product.price,
                      type: product.type,
                      image: getValidImageUrl(),
                      videoUrl: product.activity_media?.[0]?.video_url || product.video_url,
                      difficulty: product.difficulty,
                      duration: product.duration,
                      capacity: product.capacity,
                      sessionsPerClient: product.sessions_per_client,
                      workshopType: product.workshop_type,
                      pages: product.pages,
                      level: product.difficulty,
                      materials: product.materials,
                      modality: product.modality,
                      exercisesCount: product.exercisesCount || (product.csvData && product.csvData.length > 1 ? product.csvData.length - 1 : undefined),
                      totalSessions: product.totalSessions,
                      program_rating: product.program_rating,
                      total_program_reviews: product.total_program_reviews,
                      blocks: product.activity_availability
                    }}
                    showPurchaseButton={true}
                    onPurchase={() => console.log('Preview clicked')}
                    onExpand={() => setIsExpanded(true)}
                    isPreview={true}
                    csvData={product.csvData}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <ExpandedProductCard
                    product={{
                      id: product.id,
                      title: product.title,
                      description: product.description,
                      price: product.price,
                      type: product.type,
                      image: getValidImageUrl(),
                      videoUrl: product.activity_media?.[0]?.video_url || product.video_url,
                      difficulty: product.difficulty,
                      duration: product.duration,
                      capacity: product.capacity,
                      sessionsPerClient: product.sessions_per_client,
                      workshopType: product.workshop_type,
                      pages: product.pages,
                      level: product.difficulty,
                      materials: product.materials,
                      modality: product.modality,
                      exercisesCount: product.exercisesCount || (product.csvData && product.csvData.length > 1 ? product.csvData.length - 1 : undefined),
                      totalSessions: product.totalSessions,
                      program_rating: product.program_rating,
                      total_program_reviews: product.total_program_reviews,
                      blocks: product.activity_availability
                    }}
                    onPurchase={() => console.log('Purchase clicked')}
                    onClose={() => setIsExpanded(false)}
                    csvData={product.csvData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}





