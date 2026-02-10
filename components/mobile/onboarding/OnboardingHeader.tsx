"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, X } from "lucide-react"

interface OnboardingHeaderProps {
    currentStep: number
    totalSteps: number
    onBack: () => void
    onClose: () => void
}

export function OnboardingHeader({ currentStep, totalSteps, onBack, onClose }: OnboardingHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
                {currentStep > 0 && (
                    <Button onClick={onBack} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <div className="flex gap-1">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentStep ? 'bg-[#FF6A00]' : 'bg-white/10'}`}
                        />
                    ))}
                </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white rounded-full">
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}
