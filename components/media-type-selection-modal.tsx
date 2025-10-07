"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Image, Video, Upload } from 'lucide-react'
import { motion } from 'framer-motion'

interface MediaTypeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onTypeSelected: (type: 'image' | 'video') => void
  hasImage?: boolean
  hasVideo?: boolean
}

export function MediaTypeSelectionModal({
  isOpen,
  onClose,
  onTypeSelected,
  hasImage = false,
  hasVideo = false
}: MediaTypeSelectionModalProps) {
  
  const handleTypeSelect = (type: 'image' | 'video') => {
    onTypeSelected(type)
    // No cerrar automáticamente para permitir seleccionar la otra opción
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-none max-w-sm rounded-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white text-lg font-bold text-center">
            {hasImage || hasVideo ? 'Selecciona otra media o cierra' : 'Selecciona el tipo de media'}
          </DialogTitle>
          {(hasImage || hasVideo) && (
            <div className="text-center text-sm text-gray-400 mt-2">
              {hasImage && hasVideo ? 'Imagen y Video seleccionados' : 
               hasImage ? 'Imagen seleccionada' : 'Video seleccionado'}
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          {/* Opción: Imagen */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => handleTypeSelect('image')}
              className={`w-full h-14 flex items-center justify-center space-x-3 transition-all duration-200 rounded-xl ${
                hasImage 
                  ? 'bg-[#FF7939]/20 border border-[#FF7939] text-[#FF7939]' 
                  : 'bg-transparent hover:bg-[#FF7939]/20 text-white'
              }`}
            >
              <Image className={`h-6 w-6 ${hasImage ? 'text-[#FF7939]' : 'text-[#FF7939]'}`} />
              <span className="text-lg font-medium">
                {hasImage ? 'Cambiar Imagen' : 'Imagen'}
              </span>
            </Button>
          </motion.div>

          {/* Opción: Video */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => handleTypeSelect('video')}
              className={`w-full h-14 flex items-center justify-center space-x-3 transition-all duration-200 rounded-xl ${
                hasVideo 
                  ? 'bg-[#FF7939]/20 border border-[#FF7939] text-[#FF7939]' 
                  : 'bg-transparent hover:bg-[#FF7939]/20 text-white'
              }`}
            >
              <Video className={`h-6 w-6 ${hasVideo ? 'text-[#FF7939]' : 'text-[#FF7939]'}`} />
              <span className="text-lg font-medium">
                {hasVideo ? 'Cambiar Video' : 'Video'}
              </span>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
