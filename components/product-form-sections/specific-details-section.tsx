"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, Users, FileText } from 'lucide-react'

interface SpecificDetailsSectionProps {
  selectedType: 'workshop' | 'program' | 'document' | null
  specificForm: any
  setSpecificForm: (form: any) => void
  onCSVFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDownloadTemplate: (type: 'fitness' | 'nutrition') => void
  csvFileName: string
}

export function SpecificDetailsSection({
  selectedType,
  specificForm,
  setSpecificForm,
  onCSVFileChange,
  onDownloadTemplate,
  csvFileName
}: SpecificDetailsSectionProps) {
  if (selectedType === 'workshop') {
    return (
      <div className="space-y-6">
        {/* Duración */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.duration ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              1
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Duración (minutos) *</label>
              <Input
                type="number"
                value={specificForm.duration}
                onChange={(e) => setSpecificForm({ ...specificForm, duration: e.target.value })}
                placeholder="60"
                className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939]"
              />
            </div>
          </div>
        </div>

        {/* Capacidad */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.capacity ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              2
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Capacidad máxima *</label>
              <Input
                type="number"
                value={specificForm.capacity}
                onChange={(e) => setSpecificForm({ ...specificForm, capacity: e.target.value })}
                placeholder="20"
                className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939]"
              />
            </div>
          </div>
        </div>

        {/* Tipo de taller */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.workshopType ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              3
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Tipo de taller *</label>
              <Select value={specificForm.workshopType} onValueChange={(value) => setSpecificForm({ ...specificForm, workshopType: value })}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white focus:border-[#FF7939]">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                  <SelectItem value="presencial" className="text-white hover:bg-[#2A2A2A]">Presencial</SelectItem>
                  <SelectItem value="virtual" className="text-white hover:bg-[#2A2A2A]">Virtual</SelectItem>
                  <SelectItem value="hibrido" className="text-white hover:bg-[#2A2A2A]">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'program') {
    return (
      <div className="space-y-6">
        {/* Fechas del programa */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.startDate && specificForm.endDate ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              1
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Detalles del Programa</label>
            </div>
          </div>
        </div>

        {/* Nivel */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.level ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              2
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Nivel *</label>
              <Select value={specificForm.level} onValueChange={(value) => setSpecificForm({ ...specificForm, level: value })}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white focus:border-[#FF7939]">
                  <SelectValue placeholder="Selecciona el nivel" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                  <SelectItem value="principiante" className="text-white hover:bg-[#2A2A2A]">Principiante</SelectItem>
                  <SelectItem value="intermedio" className="text-white hover:bg-[#2A2A2A]">Intermedio</SelectItem>
                  <SelectItem value="avanzado" className="text-white hover:bg-[#2A2A2A]">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Disponibilidad y Stock */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.availabilityType ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              3
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Disponibilidad *</label>
              <div className="space-y-4">
                <Select value={specificForm.availabilityType} onValueChange={(value) => setSpecificForm({ ...specificForm, availabilityType: value })}>
                  <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white focus:border-[#FF7939]">
                    <SelectValue placeholder="Selecciona disponibilidad" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                    <SelectItem value="ilimitada" className="text-white hover:bg-[#2A2A2A]">Ilimitada</SelectItem>
                    <SelectItem value="fecha_limite" className="text-white hover:bg-[#2A2A2A]">Hasta fecha límite</SelectItem>
                    <SelectItem value="agotar_stock" className="text-white hover:bg-[#2A2A2A]">Hasta agotar stock</SelectItem>
                  </SelectContent>
                </Select>
                
                {specificForm.availabilityType === 'agotar_stock' && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Cantidad de stock *</label>
                    <Input
                      type="number"
                      value={specificForm.stockQuantity}
                      onChange={(e) => setSpecificForm({ ...specificForm, stockQuantity: e.target.value })}
                      placeholder="100"
                      className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939]"
                    />
                    <p className="text-gray-400 text-xs mt-1">Solo si eliges 'Hasta agotar stock'</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  if (selectedType === 'document') {
    return (
      <div className="space-y-6">
        {/* Páginas */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.pages ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              1
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Número de páginas *</label>
              <Input
                type="number"
                value={specificForm.pages}
                onChange={(e) => setSpecificForm({ ...specificForm, pages: e.target.value })}
                placeholder="50"
                className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-400 focus:border-[#FF7939]"
              />
            </div>
          </div>
        </div>

        {/* Tipo de documento */}
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              specificForm.documentType ? 'bg-[#EE5B00] text-white' : 'bg-[#F2B590] text-[#0A0A0A]'
            }`}>
              2
            </div>
            <div className="flex-1">
              <label className="block text-white font-medium mb-3">Tipo de documento *</label>
              <Select value={specificForm.documentType} onValueChange={(value) => setSpecificForm({ ...specificForm, documentType: value })}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white focus:border-[#FF7939]">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2A2A2A]">
                  <SelectItem value="pdf" className="text-white hover:bg-[#2A2A2A]">PDF</SelectItem>
                  <SelectItem value="ebook" className="text-white hover:bg-[#2A2A2A]">E-book</SelectItem>
                  <SelectItem value="guia" className="text-white hover:bg-[#2A2A2A]">Guía</SelectItem>
                  <SelectItem value="manual" className="text-white hover:bg-[#2A2A2A]">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
