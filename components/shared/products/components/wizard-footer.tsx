import React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface WizardFooterProps {
    currentStep: string
    currentStepNumber: number
    totalSteps: number
    goToStep: (stepNumber: number) => void
    onClose: (saved?: boolean) => void
    handlePublishProduct: () => void
    isPublishing: boolean
    selectedType: string | null
    selectedProgramType: string | null
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
    currentStep,
    currentStepNumber,
    totalSteps,
    goToStep,
    onClose,
    handlePublishProduct,
    isPublishing,
    selectedType,
    selectedProgramType
}) => {
    return (
        <div className="sticky bottom-0 z-50 bg-[#0b0b0b] h-20 flex items-center justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+8px)] border-t border-white/5">
            <Button
                onClick={() => {
                    const prevStepNumber = currentStepNumber - 1
                    if (prevStepNumber >= 1) {
                        goToStep(prevStepNumber)
                    } else {
                        onClose(false)
                    }
                }}
                className="bg-[#FF7939] hover:bg-[#E66829] text-white font-bold px-6 h-11 rounded-xl shadow-lg flex items-center gap-2 border-none"
            >
                <ChevronLeft className="h-4 w-4" />
                Atrás
            </Button>

            <div className="flex gap-3">
                {currentStep === 'preview' ? (
                    <Button
                        onClick={handlePublishProduct}
                        disabled={isPublishing}
                        className="bg-[#FF7939] hover:bg-[#E66829] text-white font-bold px-8 h-11 rounded-xl"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            'Publicar'
                        )}
                    </Button>
                ) : (
                    <button
                        onClick={() => {
                            const nextStepNumber = currentStepNumber + 1
                            if (nextStepNumber <= totalSteps) {
                                goToStep(nextStepNumber)
                            }
                        }}
                        disabled={!selectedType || (currentStep === 'programType' && selectedType === 'program' && !selectedProgramType)}
                        className="text-[#FF7939] font-bold hover:opacity-80 transition-opacity flex items-center gap-2 px-4 h-11 disabled:opacity-30"
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
