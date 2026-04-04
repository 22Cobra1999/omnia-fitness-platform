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
    publishProgress?: string
    publishPercentage?: number
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
    publishProgress,
    publishPercentage = 0,
    selectedType,
    selectedProgramType
}) => {
    return (
        <div className="sticky bottom-0 z-[100] bg-[#0b0b0b] h-24 sm:h-20 flex flex-col items-center justify-center px-4 sm:px-6 pb-6 sm:pb-4 border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            {isPublishing && (
                <div className="w-full mb-3 px-2">
                    <div className="flex justify-end items-center mb-1.5">
                        <span className="text-[10px] text-orange-500 font-black tabular-nums">
                            {publishPercentage}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500 ease-out" 
                            style={{ width: `${publishPercentage}%` }}
                        />
                    </div>
                </div>
            )}
            
            <div className="w-full flex items-center justify-between">
                <Button
                    onClick={() => {
                        const prevStepNumber = currentStepNumber - 1
                        if (prevStepNumber >= 1) {
                            goToStep(prevStepNumber)
                        } else {
                            onClose(false)
                        }
                    }}
                    disabled={isPublishing}
                    className="bg-[#333] hover:bg-[#444] text-white font-bold px-4 h-9 rounded-lg shadow-lg flex items-center gap-1.5 border-none text-[12px] uppercase italic tracking-tighter disabled:opacity-50"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Atrás
                </Button>

                <div className="flex gap-3">
                    {currentStep === 'preview' ? (
                        <Button
                            onClick={handlePublishProduct}
                            disabled={isPublishing}
                            className={`bg-[#FF7939] hover:bg-[#E66829] text-white font-bold px-6 h-9 rounded-lg text-[13px] uppercase italic tracking-tighter shadow-[0_0_15px_rgba(255,121,57,0.3)] transition-all ${isPublishing ? 'opacity-50 scale-95' : ''}`}
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {publishProgress || 'Publicando...'}
                                </>
                            ) : (
                                'Publicar'
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                const nextStepNumber = currentStepNumber + 1
                                if (nextStepNumber <= totalSteps) {
                                    goToStep(nextStepNumber)
                                }
                            }}
                            disabled={!selectedType || (currentStep === 'programType' && selectedType === 'program' && !selectedProgramType)}
                            className="text-[#FF7939] font-black hover:opacity-80 transition-opacity flex items-center gap-2 px-2 h-9 disabled:opacity-30 text-[13px] uppercase italic tracking-tighter hover:bg-transparent"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
