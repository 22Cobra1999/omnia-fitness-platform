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

import { createClient } from "@/lib/supabase/supabase-client"

interface CoachProfileStatsProps {
    isStatsOpen: boolean
    setIsStatsOpen: (open: boolean) => void
    coachId: string
}

export const CoachProfileStats: React.FC<CoachProfileStatsProps> = ({
    isStatsOpen,
    setIsStatsOpen,
    coachId
}) => {
    const supabase = createClient()
    const [stats, setStats] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (isStatsOpen && coachId) {
            loadStats()
        }
    }, [isStatsOpen, coachId])

    const loadStats = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('coach_statistics')
                .select('*')
                .eq('coach_id', coachId)
                .maybeSingle()

            if (error) throw error
            setStats(data)
        } catch (err) {
            console.error('Error loading coach stats:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (minutes: number) => {
        if (!minutes || minutes === 0) return 'N/A'
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h`
        return `${Math.floor(hours / 24)}d`
    }

    const getResponseRateLabel = (rate: number) => {
        if (rate >= 90) return { text: 'Excelente', color: 'text-emerald-400' }
        if (rate >= 70) return { text: 'Bueno', color: 'text-blue-400' }
        if (rate >= 50) return { text: 'Regular', color: 'text-yellow-400' }
        return { text: 'Crítico', color: 'text-red-400' }
    }
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
                                        <span className="text-[10px] text-zinc-400 leading-none">Tasa de respuesta</span>
                                        <MessageSquare className="h-3.5 w-3.5 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-bold text-white leading-none">
                                            {stats ? `${Math.round(stats.response_rate)}%` : '0%'}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${stats ? getResponseRateLabel(stats.response_rate).color : 'text-red-400'}`}>
                                            {stats ? getResponseRateLabel(stats.response_rate).text : 'Crítico'}
                                        </span>
                                    </div>
                                </div>

                                {/* Tiempo de respuesta */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400 leading-none">Tiempo de resp.</span>
                                        <Clock className="h-3.5 w-3.5 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2 text-white">
                                        <span className="text-base font-bold leading-none">
                                            {formatTime(stats?.avg_response_time_minutes)}
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Rápido</span>
                                    </div>
                                </div>

                                {/* Cancelaciones */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400 leading-none">Cancelaciones</span>
                                        <X className="h-3.5 w-3.5 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-bold text-white leading-none">
                                            {stats?.cancellations_count || 0}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${(stats?.cancellations_count || 0) > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                                            {(stats?.cancellations_count || 0) > 0 ? 'Con canc.' : 'Sin canc.'}
                                        </span>
                                    </div>
                                </div>

                                {/* Reprogramaciones tardías */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400 leading-none">Reprog. tardías</span>
                                        <CalendarIcon className="h-3.5 w-3.5 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-bold text-white leading-none">
                                            {stats?.late_reschedules_count || 0}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${(stats?.late_reschedules_count || 0) > 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                            {(stats?.late_reschedules_count || 0) > 0 ? 'Atención' : 'Sin reprog.'}
                                        </span>
                                    </div>
                                </div>

                                {/* Asistencia */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400 leading-none">Asistencia</span>
                                        <User className="h-3.5 w-3.5 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-base font-bold text-white leading-none">
                                            {stats ? `${Math.round(stats.attendance_rate)}%` : '0%'}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${(!stats || stats.attendance_rate < 80) ? 'text-[#FF7939]' : 'text-emerald-400'}`}>
                                            {(!stats || stats.attendance_rate < 80) ? 'Mejorar' : 'Excelente'}
                                        </span>
                                    </div>
                                </div>

                                {/* Incidentes */}
                                <div className="flex flex-col p-2.5 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-400 leading-none">Incidentes</span>
                                        <Target className="h-3.5 w-3.5 text-[#FF7939]" />
                                    </div>
                                    <div className="flex items-baseline gap-2 text-white">
                                        <span className="text-base font-bold leading-none">
                                            {stats?.incidents_count || 0}
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Sin inc.</span>
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
