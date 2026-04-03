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
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-white/60 font-medium text-[11px] uppercase tracking-[0.2em] italic">Servicios Meet</h3>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <Coffee className="w-4 h-4 text-[#FF7939]/40" />
            </div>

            <div className="grid grid-cols-3 gap-1">
                {/* Express - 15 min */}
                {coachConsultations.express.active && (
                    <button
                        onClick={() => handlePurchaseConsultation("express")}
                        disabled={isProcessingPurchase === "express"}
                        className="relative flex flex-col items-center justify-center p-4 rounded-[20px] transition-all duration-500 overflow-hidden group border border-white/0 hover:border-white/5 hover:bg-white/[0.03]"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF7939]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 mb-3 group-hover:scale-110 group-hover:bg-[#FF7939]/10 transition-all duration-500 ring-1 ring-white/5 group-hover:ring-[#FF7939]/20">
                            <Zap className="w-5 h-5 text-[#FF7939] opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} fill="none" />
                        </div>
                        
                        <h4 className="text-white/90 font-bold text-[10px] uppercase tracking-wider text-center mb-0.5 leading-none">
                            {coachConsultations.express.name}
                        </h4>
                        <p className="text-white/30 text-[9px] font-medium mb-2 uppercase tracking-tighter italic">{coachConsultations.express.time} min</p>
                        
                        <div className="flex items-baseline gap-0.5 mt-1">
                            <span className="text-white/40 text-[9px] font-black">$</span>
                            <span className="text-white font-black text-sm tracking-tighter">{coachConsultations.express.price}</span>
                        </div>

                        {isProcessingPurchase === "express" && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF7939]"></div>
                            </div>
                        )}
                    </button>
                )}

                {/* Puntual - 30 min */}
                {coachConsultations.puntual.active && (
                    <button
                        onClick={() => handlePurchaseConsultation("puntual")}
                        disabled={isProcessingPurchase === "puntual"}
                        className="relative flex flex-col items-center justify-center p-4 rounded-[20px] transition-all duration-500 overflow-hidden group border border-white/0 hover:border-white/5 hover:bg-white/[0.03]"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF7939]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 mb-3 group-hover:scale-110 group-hover:bg-[#FF7939]/10 transition-all duration-500 ring-1 ring-white/5 group-hover:ring-[#FF7939]/20">
                            <Target className="w-5 h-5 text-[#FF7939] opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} fill="none" />
                        </div>

                        <h4 className="text-white/90 font-bold text-[10px] uppercase tracking-wider text-center mb-0.5 leading-none">
                            {coachConsultations.puntual.name}
                        </h4>
                        <p className="text-white/30 text-[9px] font-medium mb-2 uppercase tracking-tighter italic">{coachConsultations.puntual.time} min</p>

                        <div className="flex items-baseline gap-0.5 mt-1">
                            <span className="text-white/40 text-[9px] font-black">$</span>
                            <span className="text-white font-black text-sm tracking-tighter">{coachConsultations.puntual.price}</span>
                        </div>

                        {isProcessingPurchase === "puntual" && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF7939]"></div>
                            </div>
                        )}
                    </button>
                )}

                {/* Profunda - 60 min */}
                {coachConsultations.profunda.active && (
                    <button
                        onClick={() => handlePurchaseConsultation("profunda")}
                        disabled={isProcessingPurchase === "profunda"}
                        className="relative flex flex-col items-center justify-center p-4 rounded-[20px] transition-all duration-500 overflow-hidden group border border-white/0 hover:border-white/5 hover:bg-white/[0.03]"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF7939]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 mb-3 group-hover:scale-110 group-hover:bg-[#FF7939]/10 transition-all duration-500 ring-1 ring-white/5 group-hover:ring-[#FF7939]/20">
                            <GraduationCap className="w-5 h-5 text-[#FF7939] opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} fill="none" />
                        </div>

                        <h4 className="text-white/90 font-bold text-[10px] uppercase tracking-wider text-center mb-0.5 leading-none">
                            {coachConsultations.profunda.name}
                        </h4>
                        <p className="text-white/30 text-[9px] font-medium mb-2 uppercase tracking-tighter italic">{coachConsultations.profunda.time} min</p>

                        <div className="flex items-baseline gap-0.5 mt-1">
                            <span className="text-white/40 text-[9px] font-black">$</span>
                            <span className="text-white font-black text-sm tracking-tighter">{coachConsultations.profunda.price}</span>
                        </div>

                        {isProcessingPurchase === "profunda" && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF7939]"></div>
                            </div>
                        )}
                    </button>
                )}
            </div>

            {!coachConsultations.express.active &&
                !coachConsultations.puntual.active &&
                !coachConsultations.profunda.active && (
                    <div className="text-center py-6 border border-white/5 rounded-2xl bg-white/[0.02] mx-1">
                        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest italic">Este coach aún no tiene consultas disponibles</p>
                    </div>
                )}
        </div>
    )
}
