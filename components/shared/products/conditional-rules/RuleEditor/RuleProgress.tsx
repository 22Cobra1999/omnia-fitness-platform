import React from "react"

interface RuleProgressProps {
    currentStep: number
    totalSteps?: number
}

export const RuleProgress = ({ currentStep, totalSteps = 4 }: RuleProgressProps) => {
    return (
        <div className="flex items-center justify-between mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <React.Fragment key={step}>
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step
                            ? "bg-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.4)]"
                            : "bg-white/10 text-gray-500"
                            }`}
                    >
                        {step}
                    </div>
                    {step < totalSteps && (
                        <div className={`flex-1 h-px transition-all ${currentStep > step ? "bg-[#FF7939]" : "bg-white/10"}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}
