import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    TrendingUp,
    ChevronUp,
    ChevronDown,
    MessageSquare,
    Clock,
    X,
    Calendar as CalendarIcon,
    User,
    Target
} from "lucide-react"

interface CoachProfileStatsProps {
    isStatsOpen: boolean
    setIsStatsOpen: (open: boolean) => void
}

export const CoachProfileStats: React.FC<CoachProfileStatsProps> = ({
    isStatsOpen,
    setIsStatsOpen,
}) => {
    return (
        <div className="px-6 mb-6">
            <button
                onClick={() => setIsStatsOpen(!isStatsOpen)}
                className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
            >
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#FF7939]" />
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Estadísticas</span>
                </div>
                {isStatsOpen ? (
                    <ChevronUp className="h-4 w-4 text-white/40" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-white/40" />
                )}
            </button>

            <AnimatePresence>
                {isStatsOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2">
                            <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider font-bold">
                                Últimos 30 días
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Tasa de respuesta */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400">Tasa de respuesta</span>
                                        <MessageSquare className="h-3 w-3 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">0%</span>
                                        <span className="text-[9px] text-[#FF7939]">Crítico</span>
                                    </div>
                                </div>

                                {/* Tiempo de respuesta */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400">Tiempo de resp.</span>
                                        <Clock className="h-3 w-3 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">N/A</span>
                                        <span className="text-[9px] text-zinc-500">Rápido</span>
                                    </div>
                                </div>

                                {/* Cancelaciones */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400">Cancelaciones</span>
                                        <X className="h-3 w-3 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">0</span>
                                        <span className="text-[9px] text-zinc-500">Sin canc.</span>
                                    </div>
                                </div>

                                {/* Reprogramaciones tardías */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400">Reprog. tardías</span>
                                        <CalendarIcon className="h-3 w-3 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">0</span>
                                        <span className="text-[9px] text-zinc-500">Sin reprog.</span>
                                    </div>
                                </div>

                                {/* Asistencia */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400">Asistencia</span>
                                        <User className="h-3 w-3 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">0%</span>
                                        <span className="text-[9px] text-[#FF7939]">Mejorar</span>
                                    </div>
                                </div>

                                {/* Incidentes */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400">Incidentes</span>
                                        <Target className="h-3 w-3 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-white">0</span>
                                        <span className="text-[9px] text-zinc-500">Sin inc.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
