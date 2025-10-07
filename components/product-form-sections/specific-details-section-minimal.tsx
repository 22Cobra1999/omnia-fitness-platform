"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Users, Calendar, Target, FileText } from 'lucide-react'

interface SpecificDetailsSectionProps {
  selectedType: 'workshop' | 'program' | 'document'
  specificForm: {
    duration: string
    capacity: string
    workshopType: string
    startDate: string
    endDate: string
    level: string
    availabilityType: string
    stockQuantity: string
    sessionsPerClient: string
    activities: any
    documentType: string
    document: File | null
    pages: string
  }
  setSpecificForm: (form: any) => void
}

export function SpecificDetailsSectionMinimal({
  selectedType,
  specificForm,
  setSpecificForm
}: SpecificDetailsSectionProps) {
  // Este paso ha sido eliminado - las variables se manejan en el paso 3 (General Info)
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">Este paso ha sido eliminado</p>
        <p className="text-gray-500 text-sm mt-2">Las configuraciones se manejan en el paso anterior</p>
      </div>
    </div>
  )
}
