"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Clock, Play, GraduationCap, Utensils, Video, Zap, Globe, Users, Bell, Plus, Minus, Star, UtensilsCrossed, Layers, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

/**
 * ShowcaseBubble: Minimalist representation of the calendar bubbles
 */
export const ShowcaseBubble = ({ type = 'fitness', duration = 45, isDone = false }: { type?: 'fitness' | 'nutrition' | 'coach', duration?: number, isDone?: boolean }) => {
    const isFitness = type === 'fitness'
    const isCoach = type === 'coach'
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
                isFitness
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    : isCoach
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : "bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]",
                isDone && "bg-white/10 border-white/20 text-white/50"
            )}
        >
            <div className={cn("p-1 rounded-full", isFitness ? "bg-orange-500/20" : isCoach ? "bg-cyan-500/20" : "bg-yellow-500/20")}>
                {isFitness ? <Flame size={14} /> : isCoach ? <Star size={14} /> : <Utensils size={14} />}
            </div>
            <span className="text-xs font-bold">{duration} min</span>
            {isDone && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />}
        </motion.div>
    )
}

/**
 * ShowcaseProgressRing: Minimalist representation of activity/daily progress
 */
export const ShowcaseProgressRing = ({ progress = 75, color = "#FF7939", size = 60 }: { progress?: number, color?: string, size?: number }) => {
    const radius = size * 0.4
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="transparent"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-white/80">{progress}%</span>
        </div>
    )
}

/**
 * ShowcaseFeatureCard: A mini activity card to show the logic
 */
export const ShowcaseFeatureCard = ({ title, type = 'fitness', icon: Icon = Play }: { title: string, type?: 'fitness' | 'nutrition' | 'coach', icon?: any }) => {
    const isCoach = type === 'coach';
    const isNutrition = type === 'nutrition';
    const colorClass = isCoach ? "text-cyan-400" : isNutrition ? "text-orange-300" : "text-[#FF7939]";
    const bgClass = isCoach ? "bg-cyan-400" : isNutrition ? "bg-orange-300" : "bg-[#FF7939]";

    return (
        <div className="w-full bg-[#1E1E1E] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="h-24 bg-gradient-to-br from-white/10 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                        <Icon className={colorClass} size={20} />
                    </div>
                </div>
            </div>
            <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white truncate pr-2">{title}</span>
                    <ShowcaseBubble type={type} duration={30} />
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: i === 1 ? '100%' : '0%' }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                                className={cn("h-full", bgClass)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/**
 * ShowcaseIngredients: Mini ingredients list demo
 */
export const ShowcaseIngredients = () => {
    const ingredients = [
        { name: 'Pechuga de Pollo', amount: '200g' },
        { name: 'Arroz Integral', amount: '100g' },
        { name: 'Palta', amount: '0.5 unidad' }
    ]

    return (
        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
                <Utensils size={14} className="text-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/60">Ingredientes</span>
            </div>
            {ingredients.map((ing, i) => (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={ing.name}
                    className="flex justify-between items-center"
                >
                    <span className="text-xs text-white/80">{ing.name}</span>
                    <span className="text-[10px] font-bold text-[#FF7939]">{ing.amount}</span>
                </motion.div>
            ))}
        </div>
    )
}

/**
 * ShowcaseConcept: Interactive concept section (Intensity, Modality, Objectives)
 */
export const ShowcaseConcept = () => {
    const [intensity, setIntensity] = React.useState(2)
    const [modality, setModality] = React.useState<'online' | 'hybrid' | 'presencial'>('online')

    const intensityLegend = [
        "Nivel 1: Recuperación y Movilidad",
        "Nivel 2: Entrenamiento estándar OMNIA",
        "Nivel 3: Alta Intensidad / Competencia"
    ]

    const modalityLegend = {
        online: "Escalabilidad Total: Rutinas y seguimiento 100% digital.",
        hybrid: "Lo mejor de ambos mundos: Presencial + soporte OMNIA.",
        presencial: "Experiencia Premium: Entrenamiento directo con tu coach."
    }

    return (
        <div className="w-full flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-[0.2em] italic">Concepto</span>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none italic">
                        Personalización Extrema
                    </h2>
                </div>
                <p className="text-[10px] text-white/30 font-medium leading-tight max-w-[260px]">
                    OMNIA se adapta a cada objetivo, restricción y preferencia. Prueba la interactividad debajo.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Intensity Interactive */}
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-white uppercase italic">Intensidad Sugerida</span>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setIntensity(lvl)}
                                    className="transition-transform active:scale-90"
                                >
                                    <Zap
                                        className={cn(
                                            "h-4 w-4 transition-all",
                                            intensity >= lvl ? "text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.4)]" : "text-white/10"
                                        )}
                                        fill={intensity >= lvl ? "currentColor" : "none"}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#FF7939] uppercase tracking-wider animate-in fade-in slide-in-from-left-2">
                        {intensityLegend[intensity - 1]}
                    </span>
                </div>

                {/* Modality Interactive */}
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-white uppercase italic">Modalidad Flex</span>
                        <div className="flex gap-2">
                            <button onClick={() => setModality('online')} className={cn("p-1.5 rounded-lg border transition-all", modality === 'online' ? "bg-blue-500/10 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-white/20")}>
                                <Globe className="h-4 w-4" />
                            </button>
                            <button onClick={() => setModality('hybrid')} className={cn("p-1.5 rounded-lg border transition-all", modality === 'hybrid' ? "bg-purple-500/10 border-purple-500/40 text-purple-400" : "bg-white/5 border-white/10 text-white/20")}>
                                <Layers className="h-4 w-4" />
                            </button>
                            <button onClick={() => setModality('presencial')} className={cn("p-1.5 rounded-lg border transition-all", modality === 'presencial' ? "bg-[#FF7939]/10 border-[#FF7939]/40 text-[#FF7939]" : "bg-white/5 border-white/10 text-white/20")}>
                                <Users className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <span className="text-[9px] font-medium text-white/40 leading-tight animate-in fade-in slide-in-from-left-2">
                        {modalityLegend[modality]}
                    </span>
                </div>

                {/* Meet & Restrictions (Explainers) */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <div className="flex items-center gap-2">
                            <Video className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-[8px] font-black text-white uppercase italic">Meet Incluida</span>
                        </div>
                        <p className="text-[7px] text-white/20 leading-none">Sesiones 1:1 agendadas desde el calendario.</p>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400/60" />
                            <span className="text-[8px] font-black text-white uppercase italic">Restricciones</span>
                        </div>
                        <p className="text-[7px] text-white/20 leading-none">Bloqueo automático de ejercicios incompatibles.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-1 opacity-50">
                {['Gluten Free', 'Sin Lactosa', 'Masa Muscular'].map((tag, i) => (
                    <span key={tag} className={cn(
                        "px-2 py-0.5 rounded-full border text-[7px] font-bold uppercase tracking-wider",
                        i === 2 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-white/40"
                    )}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    )
}

/**
 * ShowcaseCalendarDetail: A realistic replica of the client calendar detail view
 */
export const ShowcaseCalendarDetail = ({ day, activities = [] }: { day: number, activities?: any[] }) => {
    const dateLabel = `Viernes ${day.toString().padStart(2, '0')} de enero 26`

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full text-left"
        >
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-black text-white/95 uppercase tracking-tighter italic">
                        {dateLabel}
                    </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                    {activities.map((act, i) => {
                        if (act.type === 'meet') return (
                            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase italic">
                                <Video className="h-3 w-3" />
                                {act.duration || '1h'}
                            </div>
                        )
                        if (act.type === 'fitness') return (
                            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-black uppercase italic">
                                <Zap className="h-3 w-3" />
                                Fitness {act.duration || '45m'}
                            </div>
                        )
                        if (act.type === 'nutrition') return (
                            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFB366]/40 bg-[#FFB366]/10 text-[#FFB366] text-[10px] font-black uppercase italic">
                                <Utensils className="h-3 w-3" />
                                Nutrición {act.count || '5'}
                            </div>
                        )
                        if (act.type === 'workshop') return (
                            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F8BBD0]/40 bg-[#F8BBD0]/10 text-[#F8BBD0] text-[10px] font-black uppercase italic">
                                <GraduationCap className="h-3 w-3" />
                                Taller
                            </div>
                        )
                        return null
                    })}
                </div>
            </div>

            <div className="mb-4">
                <div className="text-[10px] font-black tracking-widest text-white/30 mb-3 uppercase italic">Actividades</div>
                <div className="space-y-3">
                    {activities.map((act, i) => (
                        <div key={i} className={cn(
                            "w-full bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-4 backdrop-blur-xl group transition-all cursor-pointer",
                            act.type === 'fitness' ? "hover:border-[#FF7939]/30" :
                                act.type === 'nutrition' ? "hover:border-[#FFB366]/30" :
                                    act.type === 'workshop' ? "hover:border-[#F8BBD0]/30" : "hover:border-orange-500/30"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border",
                                    act.type === 'fitness' ? "bg-[#FF7939]/10 text-[#FF7939] border-[#FF7939]/20" :
                                        act.type === 'nutrition' ? "bg-[#FFB366]/10 text-[#FFB366] border-[#FFB366]/20" :
                                            act.type === 'workshop' ? "bg-[#F8BBD0]/10 text-[#F8BBD0] border-[#F8BBD0]/20" :
                                                "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                )}>
                                    {act.type === 'fitness' ? <Zap size={18} /> :
                                        act.type === 'nutrition' ? <Utensils size={18} /> :
                                            act.type === 'workshop' ? <GraduationCap size={18} /> :
                                                <Video size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-white tracking-tighter">{act.title}</span>
                                        {act.is1on1 && <span className="text-[8px] font-black text-white/40 bg-white/10 px-1 rounded uppercase tracking-widest">1:1</span>}
                                        {act.isGroup && <span className="text-[8px] font-black text-white/40 bg-white/10 px-1 rounded uppercase tracking-widest">GRUPO</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">
                                            {act.type === 'fitness' ? 'Fitness · Programa' :
                                                act.type === 'nutrition' ? 'Nutrición · Programa' :
                                                    act.type === 'workshop' ? 'Workshop · Vivo' : 'Meet · Video'}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] font-black px-1.5 py-0.5 rounded italic",
                                            act.type === 'fitness' ? "text-[#FFB366] bg-[#FF7939]/10" :
                                                act.type === 'nutrition' ? "text-[#FFB366] bg-[#FF7939]/10" :
                                                    act.type === 'workshop' ? "text-[#F8BBD0] bg-[#F8BBD0]/10" : "text-orange-500 bg-orange-500/10"
                                        )}>
                                            {act.subtitle || act.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                {act.type === 'fitness' ? <Flame size={14} className="text-[#FF7939]" /> :
                                    act.type === 'nutrition' ? <UtensilsCrossed size={14} className="text-[#FFB366]" /> :
                                        act.type === 'workshop' ? <Star size={14} className="text-pink-400" /> :
                                            <Video size={14} className="text-orange-500" />}
                                <span className={cn(
                                    "text-[11px] font-black",
                                    act.type === 'fitness' ? "text-[#FF7939]" :
                                        act.type === 'nutrition' ? "text-[#FFB366]" :
                                            act.type === 'workshop' ? "text-pink-400" : "text-orange-500"
                                )}>
                                    {act.metric || '1'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Sin actividades programadas</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export const ShowcaseShelf = () => {
    return (
        <div className="w-12 h-full flex flex-col items-center justify-center p-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-3xl shrink-0 opacity-20">
            <div className="flex flex-col gap-8 [writing-mode:vertical-lr] items-center">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">OMNIA APP V2.0</span>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">REAL DATA SYNC</span>
            </div>
        </div>
    )
}

/**
 * MockCalendar: A highly realistic and interactive representation of the OMNIA calendar
 */
export const MockCalendar = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const today = 15
    const [selectedDay, setSelectedDay] = React.useState<number>(15)

    const activityData: Record<number, any[]> = {
        2: [
            { type: 'fitness', title: 'Fuerza Explosiva', duration: '45m', subtitle: 'Programa', metric: '1' }
        ],
        5: [
            { type: 'fitness', title: 'Cardio HIIT', duration: '30m', subtitle: 'Programa', metric: '1' },
            { type: 'nutrition', title: 'Plan de Macronutrientes', count: '3', subtitle: 'Programa', metric: '3' }
        ],
        8: [
            { type: 'nutrition', title: 'Guía de Suplementación', count: '5', subtitle: 'Nutrición', metric: '5' }
        ],
        12: [
            { type: 'meet', title: 'Check-in Nutricional', is1on1: true, subtitle: '14:00 – 14:30 con Laura S.', time: '14:00 – 14:30', metric: '1' },
            { type: 'fitness', title: 'Movilidad Articular', duration: '20m', subtitle: 'Programa', metric: '1' }
        ],
        15: [
            { type: 'workshop', title: 'Evaluación inicial · Objetivos', isGroup: true, subtitle: '18:00 – 19:00 con Nico M.', time: '18:00 – 19:00', metric: '1' },
            { type: 'meet', title: 'Coaching 1:1 · Seguimiento', is1on1: true, subtitle: '10:00 – 11:00 con Franco P.', time: '10:00 – 11:00', metric: '1' }
        ],
        16: [
            { type: 'fitness', title: 'Pliométricos de Ronaldinho', duration: '2m', subtitle: 'Programa', metric: '1' },
            { type: 'nutrition', title: 'Programa de Nutrición', count: '5', subtitle: 'Programa', metric: '5' }
        ],
        18: [
            { type: 'fitness', title: 'Resistencia Muscular', duration: '50m', subtitle: 'Programa', metric: '1' }
        ],
        20: [
            { type: 'workshop', title: 'Taller de Biomecánica', isGroup: true, subtitle: '19:00 – 20:30 con Carlos', time: '19:00 – 20:30', metric: '1' }
        ],
        22: [
            { type: 'nutrition', title: 'Cena de Proteína Alta', count: '1', subtitle: 'Programa', metric: '1' }
        ],
        25: [
            { type: 'meet', title: 'Sesión de Feedback', is1on1: true, subtitle: '16:00 – 17:00 con Martín', time: '16:00 – 17:00', metric: '1' },
            { type: 'fitness', title: 'Entrenamiento de Core', duration: '30m', subtitle: 'Programa', metric: '1' }
        ],
        28: [
            { type: 'workshop', title: 'Masterclass Nutrición', isGroup: true, subtitle: '20:00 – 21:00 con Ana', time: '20:00 – 21:00', metric: '1' }
        ]
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="w-full bg-[#121212] rounded-[32px] p-6 border border-white/5 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7939]/5 blur-[80px] -z-10" />

                {/* 1. Synced Header Icons with Production */}
                <div className="flex items-center justify-between mb-8 px-1">
                    {/* Notification Icon (Bell with Badge) */}
                    <div className="h-10 w-10 relative bg-zinc-800 border border-[#FF7939]/30 rounded-full flex items-center justify-center">
                        <Bell className="h-5 w-5 text-[#FF7939]" />
                        <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-[#FF7939] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border border-zinc-900 shadow-lg z-10">
                            2
                        </span>
                    </div>

                    {/* Month Selection */}
                    <div className="flex items-center gap-4 bg-white/5 rounded-full px-6 py-2.5 border border-white/5">
                        <span className="text-white/40 text-xs">‹</span>
                        <span className="text-white font-black uppercase text-[10px] tracking-widest italic">Enero 2026</span>
                        <span className="text-white/40 text-xs">›</span>
                    </div>

                    {/* Create Meet Button (Plus + Video) */}
                    <div className="h-10 px-3 flex items-center gap-2 rounded-full border bg-zinc-900 border-[#FF7939]/40 text-[#FF7939]">
                        <Video className="h-4 w-4 text-[#FF7939]" />
                        <Plus className="h-5 w-5" />
                    </div>
                </div>

                {/* 2. Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-6 text-center">
                    {days.map(d => (
                        <span key={d} className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 italic">{d}</span>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                        const activities = activityData[day] || []
                        const isSelected = selectedDay === day
                        const isToday = day === today

                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className="relative flex flex-col items-center justify-start h-14 cursor-pointer group"
                            >
                                <div className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-full text-sm font-black transition-all mb-1",
                                    isSelected ? "bg-white text-black scale-110 shadow-lg" : "text-white/60 group-hover:bg-white/5 group-hover:text-white",
                                    isToday && !isSelected && "border border-[#FF7939] text-[#FF7939]"
                                )}>
                                    {day}
                                </div>

                                {/* Activity Indicators (Bubbles) + Coach Names */}
                                <div className="flex flex-col gap-0.5 mt-1 w-full items-center">
                                    {(() => {
                                        const grouped = activities.reduce((acc: Record<string, number>, act: any) => {
                                            acc[act.type] = (acc[act.type] || 0) + 1
                                            return acc
                                        }, {} as Record<string, number>)

                                        return (Object.entries(grouped) as [string, number][]).map(([type, count], idx) => {
                                            if (type === 'fitness') return (
                                                <span key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none border shadow-sm bg-[#FF7939]/10 text-[#FF7939] border-[#FF7939]/30">
                                                    <Zap className="w-2.5 h-2.5" />
                                                    {(count as number) > 1 ? count : activities.find(a => a.type === 'fitness')?.duration}
                                                </span>
                                            )
                                            if (type === 'nutrition') return (
                                                <span key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold border leading-none shadow-sm bg-[#FFB366]/10 text-[#FFB366] border-[#FFB366]/30">
                                                    <Utensils className="w-2.5 h-2.5" />
                                                    {(count as number) > 1 ? count : activities.find(a => a.type === 'nutrition')?.count}
                                                </span>
                                            )
                                            if (type === 'workshop') return (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border leading-none bg-[#FCE4EC]/30 border-[#FCE4EC]/50 text-[#F06292] font-bold">
                                                        <GraduationCap className="w-2.5 h-2.5" />
                                                        {(count as number) > 1 && <span className="text-[8px] ml-0.5">{count}</span>}
                                                    </div>
                                                </div>
                                            )
                                            if (type === 'meet') return (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border leading-none bg-orange-500/10 border-orange-500/30 text-orange-400">
                                                        <Video className="w-2.5 h-2.5" />
                                                        {(count as number) > 1 && <span className="text-[9px] font-bold ml-0.5">{count}</span>}
                                                    </div>
                                                </div>
                                            )
                                            return null
                                        })
                                    })()}

                                    {/* Coach Name Label - Fine Gray Text */}
                                    {activities.length > 0 && activities.some(a => a.subtitle?.includes('con ')) && (
                                        <span className="text-[7px] text-white/20 font-medium leading-none mt-1 truncate max-w-[40px]">
                                            {activities.find(a => a.subtitle?.includes('con '))?.subtitle.split('con ')[1]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 3. Detail Reveal */}
                <AnimatePresence mode="wait">
                    {selectedDay && (
                        <ShowcaseCalendarDetail
                            key={selectedDay}
                            day={selectedDay}
                            activities={activityData[selectedDay]}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
