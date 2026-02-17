import React from 'react'
import { X } from "lucide-react"

interface WizardHeaderProps {
    currentStep: string
    currentStepNumber: number
    totalSteps: number
    handleClose: () => void
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
    currentStep,
    currentStepNumber,
    totalSteps,
    handleClose
}) => {
    return (
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0b0b0b]">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => handleClose()}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold text-white">
                    {currentStep === 'type' ? 'Tipo de producto' :
                        currentStep === 'programType' ? 'Categoría' :
                            currentStep === 'general' ? 'Información General' :
                                currentStep === 'weeklyPlan' ? 'Planificación' :
                                    currentStep === 'workshopSchedule' ? 'Organización' :
                                        currentStep === 'workshopMaterial' || currentStep === 'documentMaterial' ? 'Material' :
                                            currentStep === 'preview' ? 'Preview' :
                                                'Crear Producto'}
                </h2>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1
                    const isActive = stepNum === currentStepNumber
                    const isPast = stepNum < currentStepNumber
                    return (
                        <div
                            key={stepNum}
                            className={`h-1.5 transition-all duration-300 rounded-full ${isActive ? 'w-10 bg-[#FF7939]' :
                                isPast ? 'w-2 bg-[#FF7939]/40' :
                                    'w-2 bg-white/10'
                                }`}
                        />
                    )
                })}
            </div>
        </div>
    )
}
