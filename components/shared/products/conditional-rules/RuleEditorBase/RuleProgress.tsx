import React from "react"

interface RuleProgressProps {
    currentStep: number
    totalSteps?: number
}

export const RuleProgress = ({ currentStep, totalSteps = 4 }: RuleProgressProps) => {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === step
                        ? "w-8 bg-[#FF7939] shadow-[0_0_10px_rgba(255,121,57,0.3)]"
                        : currentStep > step
                            ? "w-2 bg-[#FF7939]/50"
                            : "w-2 bg-white/10"
                        }`}
                />
            ))}
        </div>
    )
}
