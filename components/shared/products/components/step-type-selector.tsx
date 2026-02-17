"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, FileText, Users, ChevronRight } from 'lucide-react'
import { ProductType } from '../product-constants'

interface StepTypeSelectorProps {
    onSelect: (type: ProductType) => void
    selected?: ProductType | null
}

export const StepTypeSelector: React.FC<StepTypeSelectorProps> = ({ onSelect, selected }) => {
    const options = [
        {
            id: 'program' as ProductType,
            title: 'PROGRAMA',
            description: 'Entrenamientos estructurados por semanas',
            icon: <ClipboardList className="h-6 w-6 text-[#FF7939]" />,
        },
        {
            id: 'document' as ProductType,
            title: 'DOCUMENTO',
            description: 'PDF, guías o manuales descargables',
            icon: <FileText className="h-6 w-6 text-[#FF7939]" />,
        },
        {
            id: 'workshop' as ProductType,
            title: 'TALLER',
            description: 'Sesión única 1:1 o grupal',
            icon: <Users className="h-6 w-6 text-[#FF7939]" />,
        }
    ]

    return (
        <div className="space-y-8 w-full overflow-x-hidden py-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white px-2">¿Qué tipo de producto querés crear?</h2>

            <div className="grid gap-4">
                {options.map((option) => (
                    <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(option.id)}
                        className={`relative w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 backdrop-blur-md ${selected === option.id
                            ? 'border-[#FF7939] bg-[#FF7939]/10 shadow-[0_0_20px_rgba(255,121,57,0.15)] ring-1 ring-[#FF7939]/30'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                    >
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex-shrink-0">
                            {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white tracking-wide">{option.title}</h3>
                            <p className="text-sm text-gray-500 truncate">{option.description}</p>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    )
}
