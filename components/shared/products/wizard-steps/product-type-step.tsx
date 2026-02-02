import React from 'react'
import { FileText, Users } from 'lucide-react'

export type ProductType = 'workshop' | 'program' | 'document'
export type ProductStep = 'type' | 'programType' | 'general' | 'specific' | 'workshopMaterial' | 'workshopSchedule' | 'documentMaterial' | 'weeklyPlan' | 'preview'

interface ProductTypeStepProps {
    selectedType: ProductType | null
    onSelect: (type: ProductType, nextStep: ProductStep) => void
}

export function ProductTypeStep({ selectedType, onSelect }: ProductTypeStepProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-6">
                ¿Qué tipo de producto querés crear?
            </h3>
            <div className="flex flex-col gap-3">
                {/* PROGRAMA */}
                <button
                    onClick={() => onSelect('program', 'programType')}
                    className={`p-3 rounded-lg border transition-all text-left flex items-start gap-2 ${selectedType === 'program'
                        ? 'border-[#FF7939] bg-black'
                        : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                        }`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="relative">
                            <FileText className="h-4 w-4 text-[#FF7939]" />
                            {selectedType === 'program' && (
                                <div className="absolute -left-1 top-0 flex flex-col gap-0.5">
                                    <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[#FF7939]"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-0.5 uppercase">
                            PROGRAMA
                        </h4>
                        <p className="text-xs text-gray-400 whitespace-normal">
                            Entrenamientos estructurados por semanas
                        </p>
                    </div>
                </button>

                {/* DOCUMENTO */}
                <button
                    onClick={() => onSelect('document', 'programType')}
                    className={`p-3 rounded-lg border transition-all text-left flex items-start gap-2 ${selectedType === 'document'
                        ? 'border-[#FF7939] bg-black'
                        : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                        }`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-[#FF7939]" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-0.5 uppercase">
                            DOCUMENTO
                        </h4>
                        <p className="text-xs text-gray-400 whitespace-normal">
                            PDF, guías o manuales descargables
                        </p>
                    </div>
                </button>

                {/* TALLER */}
                <button
                    onClick={() => onSelect('workshop', 'general')}
                    className={`p-3 rounded-lg border transition-all text-left flex items-start gap-2 ${selectedType === 'workshop'
                        ? 'border-[#FF7939] bg-black'
                        : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                        }`}
                >
                    <div className="flex-shrink-0 mt-0.5 relative">
                        <Users className="h-4 w-4 text-[#FF7939]" />
                        {selectedType === 'workshop' && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF7939] rounded-full"></div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-0.5 uppercase">
                            TALLER
                        </h4>
                        <p className="text-xs text-gray-400 whitespace-normal">
                            Sesión única 1:1 o grupal
                        </p>
                    </div>
                </button>
            </div>
        </div>
    )
}
