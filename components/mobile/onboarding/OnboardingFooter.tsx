"use client"

import { Button } from "@/components/ui/button"

interface OnboardingFooterProps {
    isSubmitting: boolean
    isLastStep: boolean
    onNext: () => void
}

export function OnboardingFooter({ isSubmitting, isLastStep, onNext }: OnboardingFooterProps) {
    return (
        <div className="p-4 border-t border-white/5 bg-black/20">
            <Button
                onClick={onNext}
                disabled={isSubmitting}
                className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white font-bold h-12 rounded-xl"
            >
                {isSubmitting ? "Guardando..." : (isLastStep ? 'Listo, empezar' : 'Continuar')}
            </Button>
        </div>
    )
}
