"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientProductLogic } from '@/hooks/client/useClientProductLogic'
import { ProductHero } from './product-modal/ProductHero'
import { ProductDetails } from './product-modal/ProductDetails'
import { WorkshopTopics } from './product-modal/WorkshopTopics'
import { ProductComments } from './product-modal/ProductComments'
import { ProductPurchaseSection } from './product-modal/ProductPurchaseSection'
import { Calendar, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  navigationContext?: any
  onEdit?: (product: any) => void
  showEditButton?: boolean
  onDelete?: (product: any) => void
  onCoachClick?: (coachId: string) => void
}

export default function ClientProductModal({
  isOpen,
  onClose,
  product,
  navigationContext,
  onEdit,
  showEditButton = false,
  onDelete,
  onCoachClick
}: ClientProductModalProps) {
  const logic = useClientProductLogic({
    product,
    isOpen,
    onClose,
    showEditButton,
    navigationContext,
    onCoachClick
  })

  const {
    handleClose,
    isDateChangeNoticeClosed,
    setIsDateChangeNoticeClosed,
    workshopTopics,
    loadingWorkshopTopics,
    comments,
    loadingComments,
    exceedsActivities,
    exceedsWeeks,
    exceedsStock
  } = logic

  if (!isOpen || !product) return null

  const isWorkshopInactive = product?.type === 'workshop' && (product as any).taller_activo === false

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#0F1012] rounded-3xl w-full max-w-2xl border border-white/5 overflow-hidden mb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Aviso Taller Finalizado */}
            {product?.type === 'workshop' && isWorkshopInactive && !isDateChangeNoticeClosed && (
              <div className="bg-[#FF7939]/10 border-b border-[#FF7939]/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#FF7939]" />
                  <p className="text-sm text-gray-300">Taller finalizado. Necesitas nuevas fechas para reactivar las ventas.</p>
                </div>
                <button onClick={() => setIsDateChangeNoticeClosed(true)} className="text-gray-500 hover:text-white transition-colors">✕</button>
              </div>
            )}

            <ProductHero product={product} logic={logic} onEdit={onEdit} onDelete={onDelete} showEditButton={showEditButton} />

            <ProductDetails product={product} logic={logic} />

            {product.type === 'workshop' && (
              <WorkshopTopics topics={workshopTopics} loading={loadingWorkshopTopics} />
            )}

            <ProductComments
              comments={comments}
              loading={loadingComments}
              rating={product.program_rating}
              ratingCount={product.total_program_reviews}
            />

            {/* Upgrade Banner for Coaches */}
            {showEditButton && (exceedsActivities || exceedsWeeks || exceedsStock) && (
              <div className="p-6">
                <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-4 text-center">
                  <Zap className="h-6 w-6 text-[#FF7939] mx-auto mb-2" />
                  <p className="text-white font-bold mb-2">Producto Excede los Límites</p>
                  <p className="text-gray-400 text-xs mb-4">Pasa a un plan superior para activar este producto.</p>
                  <Button className="w-full bg-[#FF7939] hover:bg-[#FF6B00] text-white font-bold border-none">Subir de Plan</Button>
                </div>
              </div>
            )}

            <div className="h-32" /> {/* Bottom Spacer */}
          </motion.div>

          <ProductPurchaseSection product={product} logic={logic} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
