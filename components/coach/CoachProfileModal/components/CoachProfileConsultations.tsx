import React from "react"
import { Coffee, Zap, Target, GraduationCap } from "lucide-react"

interface CoachProfileConsultationsProps {
    coachConsultations: {
        express: { active: boolean; price: number; time: number; name: string }
        puntual: { active: boolean; price: number; time: number; name: string }
        profunda: { active: boolean; price: number; time: number; name: string }
    }
    isProcessingPurchase: string | null
    handlePurchaseConsultation: (type: "express" | "puntual" | "profunda") => void
    coachName: string
}

export const CoachProfileConsultations: React.FC<CoachProfileConsultationsProps> = ({
    coachConsultations,
    isProcessingPurchase,
    handlePurchaseConsultation,
}) => {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
                <Coffee className="w-5 h-5 text-[#FF7939]" />
                <h3 className="text-white font-semibold text-sm">Meet con el coach</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Express - 15 min */}
                {coachConsultations.express.active && (
                    <button
                        onClick={() => handlePurchaseConsultation("express")}
                        disabled={isProcessingPurchase === "express"}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Zap className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                        <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                            {coachConsultations.express.name}
                        </h4>
                        <p className="text-gray-400 text-xs mb-1">{coachConsultations.express.time} min</p>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs">$</span>
                            <span className="text-[#FF7939] font-bold text-sm">{coachConsultations.express.price}</span>
                        </div>
                        {isProcessingPurchase === "express" && (
                            <div className="mt-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                            </div>
                        )}
                    </button>
                )}

                {/* Puntual - 30 min */}
                {coachConsultations.puntual.active && (
                    <button
                        onClick={() => handlePurchaseConsultation("puntual")}
                        disabled={isProcessingPurchase === "puntual"}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Target className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                        <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                            {coachConsultations.puntual.name}
                        </h4>
                        <p className="text-gray-400 text-xs mb-1">{coachConsultations.puntual.time} min</p>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs">$</span>
                            <span className="text-[#FF7939] font-bold text-sm">{coachConsultations.puntual.price}</span>
                        </div>
                        {isProcessingPurchase === "puntual" && (
                            <div className="mt-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                            </div>
                        )}
                    </button>
                )}

                {/* Profunda - 60 min */}
                {coachConsultations.profunda.active && (
                    <button
                        onClick={() => handlePurchaseConsultation("profunda")}
                        disabled={isProcessingPurchase === "profunda"}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF7939] hover:bg-[#1A1A1A]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GraduationCap className="w-5 h-5 text-[#FF7939] mb-1.5" strokeWidth={2} fill="none" />
                        <h4 className="text-white font-semibold text-xs text-center mb-0.5">
                            {coachConsultations.profunda.name}
                        </h4>
                        <p className="text-gray-400 text-xs mb-1">{coachConsultations.profunda.time} min</p>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs">$</span>
                            <span className="text-[#FF7939] font-bold text-sm">{coachConsultations.profunda.price}</span>
                        </div>
                        {isProcessingPurchase === "profunda" && (
                            <div className="mt-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#FF7939]"></div>
                            </div>
                        )}
                    </button>
                )}
            </div>

            {!coachConsultations.express.active &&
                !coachConsultations.puntual.active &&
                !coachConsultations.profunda.active && (
                    <div className="text-center py-3">
                        <p className="text-gray-400 text-xs">Este coach aún no tiene consultas disponibles</p>
                    </div>
                )}
        </div>
    )
}
