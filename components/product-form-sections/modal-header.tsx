"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, X, Trash2 } from 'lucide-react'
import { OmniaLogoText } from '@/components/omnia-logo'

interface ModalHeaderProps {
  currentStep: string
  onBack: () => void
  onClose: () => void
  editingProduct?: any
  onDelete?: (product: any) => void
}

export function ModalHeader({ currentStep, onBack, onClose, editingProduct, onDelete }: ModalHeaderProps) {
  const getStepTitle = () => {
    switch (currentStep) {
      case 'general':
        return ''
      case 'specific':
        return 'Detalles Específicos'
      case 'activities':
        return ''
      case 'preview':
        return 'Preview y Publicación'
      default:
        return editingProduct ? 'Editar Producto' : 'Planifica'
    }
  }


  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white hover:bg-white/10 p-2 rounded-lg mt-3"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-white font-semibold text-lg">{getStepTitle()}</h2>
        </div>
      </div>
      
      {/* Logo OMNIA centrado */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <OmniaLogoText size="text-2xl" />
      </div>
      
      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        {/* Botón eliminar - Solo mostrar cuando se está editando */}
        {editingProduct && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(editingProduct)}
            className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg mt-3"
            title="Eliminar producto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {/* Botón cerrar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/10 p-2 rounded-lg mt-3"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
