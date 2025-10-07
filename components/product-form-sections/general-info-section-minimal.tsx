"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, DollarSign, FileText, User } from 'lucide-react'

interface GeneralInfoSectionProps {
  productCategory: 'fitness' | 'nutricion'
  setProductCategory: (category: 'fitness' | 'nutricion') => void
  generalForm: {
    name: string
    description: string
    price: string
    image: File | { url: string } | null
    videoUrl: string
  }
  setGeneralForm: (form: any) => void
  onOpenMediaModal: (type: 'image' | 'video') => void
  hasLocalVideo?: boolean
  videoFileName?: string
  onClearVideo?: () => void
}

export function GeneralInfoSectionMinimal({
  productCategory,
  setProductCategory,
  generalForm,
  setGeneralForm,
  onOpenMediaModal,
  hasLocalVideo = false,
  videoFileName,
  onClearVideo
}: GeneralInfoSectionProps) {
  return (
    <div className="space-y-8">

      {/* Categoría - Diseño moderno */}
      <div className="space-y-4">
        <div className="flex gap-1">
          <button
            onClick={() => setProductCategory('fitness')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium text-sm transition-all duration-300 ${
              productCategory === 'fitness'
                ? 'bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20'
                : 'bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-[#1A1A1A] border border-[#2A2A2A]'
            }`}
          >
            Fitness
          </button>
          <button
            onClick={() => setProductCategory('nutricion')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium text-sm transition-all duration-300 ${
              productCategory === 'nutricion'
                ? 'bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20'
                : 'bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-[#1A1A1A] border border-[#2A2A2A]'
            }`}
          >
            Nutrición
          </button>
        </div>
      </div>

      {/* Información básica - Diseño moderno */}
      <div className="space-y-6">
        {/* Grid de campos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Nombre del programa</label>
            <Input
              value={generalForm.name}
              onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
              placeholder="Ej: Programa de Fuerza"
              className="bg-[#0F0F0F] border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#FF7939] focus:ring-0 h-14 rounded-xl text-base"
            />
          </div>
          
          {/* Precio */}
          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Precio ($)</label>
            <Input
              type="number"
              value={generalForm.price}
              onChange={(e) => setGeneralForm({ ...generalForm, price: e.target.value })}
              placeholder="0"
              className="bg-[#0F0F0F] border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#FF7939] focus:ring-0 h-14 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-3">
          <label className="text-white text-sm font-medium">Descripción</label>
          <Textarea
            value={generalForm.description}
            onChange={(e) => setGeneralForm({ ...generalForm, description: e.target.value })}
            placeholder="Describe tu programa de manera clara y atractiva..."
            className="bg-[#0F0F0F] border-[#2A2A2A] text-white placeholder-gray-500 focus:border-[#FF7939] focus:ring-0 min-h-[120px] rounded-xl resize-none text-base"
          />
        </div>
      </div>

      {/* Media - Diseño moderno */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imagen de portada */}
          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Imagen de portada</label>
            <div 
              onClick={() => onOpenMediaModal('image')}
              className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-8 text-center hover:border-[#FF7939] transition-all duration-300 cursor-pointer group bg-[#0F0F0F]"
            >
              {generalForm.image ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-[#FF7939] rounded-xl mx-auto flex items-center justify-center shadow-lg">
                    <FileText className="text-white h-8 w-8" />
                  </div>
                  <p className="text-white text-sm font-medium">Imagen seleccionada</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setGeneralForm({ ...generalForm, image: null })
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto group-hover:text-[#FF7939] transition-colors" />
                  <p className="text-gray-400 text-sm">Subir imagen</p>
                </div>
              )}
            </div>
          </div>

          {/* Video */}
          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Video promocional</label>
            <div 
              onClick={() => onOpenMediaModal('video')}
              className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-8 text-center hover:border-[#FF7939] transition-all duration-300 cursor-pointer group bg-[#0F0F0F]"
            >
              {hasLocalVideo || generalForm.videoUrl ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-[#FF7939] rounded-xl mx-auto flex items-center justify-center shadow-lg">
                    <FileText className="text-white h-8 w-8" />
                  </div>
                  <p className="text-white text-sm font-medium">
                    {videoFileName || 'Video seleccionado'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearVideo?.()
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto group-hover:text-[#FF7939] transition-colors" />
                  <p className="text-gray-400 text-sm">Subir video</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
