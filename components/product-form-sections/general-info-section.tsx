"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload } from 'lucide-react'

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

export function GeneralInfoSection({
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
      {/* Tipo de Producto */}
      <div className="space-y-4">
        <h3 className="text-white font-medium text-lg">Tipo de Producto</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setProductCategory('fitness')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
              productCategory === 'fitness'
                ? 'bg-[#FF7939] text-white shadow-lg'
                : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
            }`}
          >
            Fitness
          </button>
          <button
            onClick={() => setProductCategory('nutricion')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
              productCategory === 'nutricion'
                ? 'bg-[#FF7939] text-white shadow-lg'
                : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
            }`}
          >
            Nutrición
          </button>
        </div>
      </div>

      {/* Información básica */}
      <div className="space-y-6">
        <h3 className="text-white font-medium text-lg">Información Básica</h3>
        
        {/* Nombre y Precio en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-white font-medium text-sm">Nombre del producto *</label>
            <Input
              value={generalForm.name}
              onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
              placeholder="Ej: Programa de Fuerza y Resistencia"
              className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939] h-12"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-white font-medium text-sm">Precio ($) *</label>
            <Input
              type="number"
              value={generalForm.price}
              onChange={(e) => setGeneralForm({ ...generalForm, price: e.target.value })}
              placeholder="0"
              className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939] h-12"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-3">
          <label className="text-white font-medium text-sm">Descripción breve *</label>
          <Textarea
            value={generalForm.description}
            onChange={(e) => setGeneralForm({ ...generalForm, description: e.target.value })}
            placeholder="Describe brevemente tu producto..."
            className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939] min-h-[120px]"
          />
        </div>

        {/* Categoría (readonly) */}
        <div className="space-y-3">
          <label className="text-white font-medium text-sm">Categoría</label>
          <Input
            value={productCategory === 'fitness' ? 'Programa' : 'Plan'}
            readOnly
            className="bg-[#2A2A2A] border-[#2A2A2A] text-gray-400 h-12"
          />
        </div>
      </div>

      {/* Media */}
      <div className="space-y-6">
        <h3 className="text-white font-medium text-lg">Media</h3>
        
        {/* Imagen de portada */}
        <div className="space-y-3">
          <label className="text-white font-medium text-sm">Imagen de portada</label>
          {generalForm.image ? (
            <div className="space-y-3">
              {/* Vista previa de la imagen */}
              <div className="relative">
                <img
                  src={generalForm.image instanceof File 
                    ? URL.createObjectURL(generalForm.image) 
                    : generalForm.image?.url || ''
                  }
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-[#2A2A2A]"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  ✓ Cargada
                </div>
              </div>
              
              {/* Información del archivo */}
              <div className="flex items-center space-x-3 p-3 bg-[#FF7939]/5 border border-[#FF7939]/20 rounded-lg">
                <div className="w-8 h-8 bg-[#FF7939]/10 rounded-lg flex items-center justify-center">
                  <Upload className="h-4 w-4 text-[#FF7939]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {generalForm.image instanceof File 
                      ? generalForm.image.name 
                      : generalForm.image?.url 
                        ? generalForm.image.url.slice(-15)
                        : 'imagen_existente.jpg'
                    }
                  </p>
                  <p className="text-[#FF7939] text-xs">✓ Cargada</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenMediaModal('image')}
                  className="flex-1 px-3 py-1 bg-[#FF7939] hover:bg-[#FF6B35] text-white text-xs rounded transition-colors"
                >
                  Reemplazar
                </button>
                <button
                  onClick={() => setGeneralForm({ ...generalForm, image: null })}
                  className="flex-1 px-3 py-1 bg-transparent border border-red-500 text-red-400 hover:bg-red-500 hover:text-white text-xs rounded transition-colors"
                >
                  Borrar
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="border border-dashed border-[#2A2A2A] rounded-lg p-4 text-center hover:border-[#FF7939]/50 transition-colors cursor-pointer bg-[#0F0F0F]/30"
              onClick={() => onOpenMediaModal('image')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-5 w-5 text-gray-400" />
                <p className="text-gray-400 text-sm">Subir imagen</p>
              </div>
            </div>
          )}
        </div>

        {/* Video de presentación - solo archivo */}
        <div className="space-y-3">
          <label className="text-white font-medium text-sm">Video de presentación</label>
          {hasLocalVideo || generalForm.videoUrl ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-[#FF7939]/5 border border-[#FF7939]/20 rounded-lg">
                <div className="w-8 h-8 bg-[#FF7939]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#FF7939]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {videoFileName || (generalForm.videoUrl ? generalForm.videoUrl.slice(-20) : 'video.mp4')}
                  </p>
                  <p className="text-[#FF7939] text-xs">✓ Cargado</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenMediaModal('video')}
                  className="flex-1 px-3 py-1 bg-[#FF7939] hover:bg-[#FF6B35] text-white text-xs rounded transition-colors"
                >
                  Reemplazar
                </button>
                <button
                  onClick={() => {
                    if (onClearVideo) onClearVideo();
                    setGeneralForm({ ...generalForm, videoUrl: '' })
                  }}
                  className="flex-1 px-3 py-1 bg-transparent border border-red-500 text-red-400 hover:bg-red-500 hover:text-white text-xs rounded transition-colors"
                >
                  Borrar
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="border border-dashed border-[#2A2A2A] rounded-lg p-4 text-center cursor-pointer hover:border-[#FF7939]/50 transition-colors bg-[#0F0F0F]/30"
              onClick={() => onOpenMediaModal('video')}
            >
              <div className="flex flex-col items-center space-y-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-400 text-sm">Subir archivo de video</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
