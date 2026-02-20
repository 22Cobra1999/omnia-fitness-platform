"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Clock, Play, GraduationCap, Utensils, Video, Zap, Globe, Users, Bell, Plus, Minus, Star, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

/**
 * ShowcaseBubble: Minimalist representation of the calendar bubbles
 */
export const ShowcaseBubble = ({ type = 'fitness', duration = 45, isDone = false }: { type?: 'fitness' | 'nutrition', duration?: number, isDone?: boolean }) => {
    const isFitness = type === 'fitness'
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
                isFitness
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    : "bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]",
                isDone && "bg-white/10 border-white/20 text-white/50"
            )}
        >
            <div className={cn("p-1 rounded-full", isFitness ? "bg-orange-500/20" : "bg-yellow-500/20")}>
                {isFitness ? <Flame size={14} /> : <Utensils size={14} />}
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
export const ShowcaseFeatureCard = ({ title, type = 'fitness', icon: Icon = Play }: { title: string, type?: 'fitness' | 'nutrition', icon?: any }) => {
    return (
        <div className="w-full bg-[#1E1E1E] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="h-24 bg-gradient-to-br from-white/10 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                        <Icon className="text-[#FF7939]" size={20} />
                    </div>
                </div>
            </div>
            <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white truncate pr-2">{title}</span>
                    <ShowcaseBubble type={type === 'fitness' ? 'fitness' : 'nutrition'} duration={30} />
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: i === 1 ? '100%' : '0%' }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                                className="h-full bg-[#FF7939]"
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
    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-[0.2em] italic">Concepto</span>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">
                        Personalización<br />Extrema
                    </h2>
                </div>
                <p className="text-sm text-white/40 font-medium leading-relaxed max-w-[280px]">
                    Cada cliente es un mundo. Por eso OMNIA se adapta a cada objetivo, restricción y preferencia.
                </p>
            </div>

            <div className="space-y-4">
                {/* Objectives */}
                <div className="flex items-start gap-4 p-5 rounded-[24px] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                    <div className="w-10 h-10 rounded-full bg-[#FF7939]/10 flex items-center justify-center border border-[#FF7939]/20 shrink-0">
                        <Zap className="h-5 w-5 text-[#FF7939]" fill="currentColor" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-white uppercase italic">Objetivos Claros</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {['Masa Muscular', 'Resistencia', 'Flexibilidad'].map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 uppercase">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Restrictions */}
                <div className="flex items-start gap-4 p-5 rounded-[24px] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                        <Star className="h-5 w-5 text-orange-400" fill="currentColor" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-white uppercase italic">Restricciones</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {['Alguna lesión', 'Alergia al gluten'].map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[9px] font-bold text-orange-400 uppercase">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * ShowcaseCalendarDetail: A realistic replica of the client calendar detail view
 */
export const ShowcaseCalendarDetail = ({ type, day }: { type: 'fitness' | 'nutrition' | 'special' | 'workshop', day: number }) => {
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
                    {day === 15 ? (
                        <>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase italic">
                                <Video className="h-3 w-3" />
                                1h
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-black uppercase italic">
                                <Zap className="h-3 w-3" />
                                Fitness 2m
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFB366]/40 bg-[#FFB366]/10 text-[#FFB366] text-[10px] font-black uppercase italic">
                                <Utensils className="h-3 w-3" />
                                Nutrición 5
                            </div>
                        </>
                    ) : (
                        <>
                            {(type === 'fitness' || type === 'special') && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FF7939]/40 bg-[#FF7939]/10 text-[#FFB366] text-[10px] font-black uppercase italic">
                                    <Zap className="h-3 w-3" />
                                    Fitness 45m
                                </div>
                            )}
                            {(type === 'nutrition' || type === 'special') && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFB873]/40 bg-[#FFB873]/10 text-[#FFB366] text-[10px] font-black uppercase italic">
                                    <Utensils className="h-3 w-3" />
                                    Nutrición 5
                                </div>
                            )}
                            {type === 'workshop' && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase italic">
                                    <GraduationCap className="h-3 w-3" />
                                    Taller
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {(type === 'special' || type === 'workshop' || day === 15) && (
                <div className="mb-6">
                    <div className="text-[10px] font-black tracking-widest text-white/30 mb-3 uppercase italic">Meet</div>
                    <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-4 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                {type === 'workshop' ? <GraduationCap size={18} /> : <Video size={18} />}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-white tracking-tighter">
                                        {day === 15 ? 'Evaluación inicial · Objetivos' : (type === 'workshop' ? 'Taller de Biomecánica' : 'Coaching 1:1 · Seguimiento')}
                                    </span>
                                    <span className="text-[8px] font-black text-white/40 bg-white/10 px-1 rounded uppercase tracking-widest">{type === 'workshop' ? 'GRUPO' : '1:1'}</span>
                                </div>
                                <span className="text-[10px] font-bold text-white/40">
                                    {day === 15 ? '18:00 – 19:00' : '10:00 – 11:00'}
                                </span>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                            <Video size={10} /> CONFIRMADA
                        </span>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <div className="text-[10px] font-black tracking-widest text-white/30 mb-3 uppercase italic">Programación</div>
                <div className="space-y-3">
                    {(type === 'fitness' || type === 'special' || day === 15) && (
                        <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-4 backdrop-blur-xl group hover:border-[#FF7939]/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/20">
                                    <Zap size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white tracking-tighter">
                                        {day === 15 ? 'Pliométricos de Ronaldinho' : 'Fuerza Explosiva'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">Fitness · Programa</span>
                                        <span className="text-[9px] font-black text-[#FFB366] bg-[#FF7939]/10 px-1.5 py-0.5 rounded italic">2m restante</span>
                                    </div>
                                </div>
                            </div>
                            {/* Refined Flame icon without frame to match ActivityCard style */}
                            <div className="flex items-center gap-0.5">
                                <Flame size={14} className="text-[#FF7939]" />
                                <span className="text-[11px] font-black text-[#FF7939]">1</span>
                            </div>
                        </div>
                    )}

                    {(type === 'nutrition' || type === 'special' || day === 15) && (
                        <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-4 backdrop-blur-xl group hover:border-[#FFB366]/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFB366]/10 text-[#FFB366] border border-[#FFB366]/20">
                                    <Utensils size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white tracking-tighter">Programa de Nutrición</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">Nutrición · Programa</span>
                                        <span className="text-[9px] font-black text-[#FFB366] bg-[#FF7939]/10 px-1.5 py-0.5 rounded italic">5</span>
                                    </div>
                                </div>
                            </div>
                            {/* Refined UtensilsCrossed icon without frame to match ActivityCard style */}
                            <div className="flex items-center gap-0.5">
                                <UtensilsCrossed size={14} className="text-[#FFB366]" />
                                <span className="text-[11px] font-black text-[#FFB366]">5</span>
                            </div>
                        </div>
                    )}

                    {type === 'workshop' && (
                        <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-between gap-4 backdrop-blur-xl group hover:border-pink-500/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                    <GraduationCap size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white tracking-tighter">Biomecánica Aplicada</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">Workshop · Vivo</span>
                                        <span className="text-[9px] font-black text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded italic">Taller</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-pink-400" />
                                <span className="text-[11px] font-black text-pink-400">1</span>
                            </div>
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

    const activityData: Record<number, { type: 'fitness' | 'nutrition' | 'special' | 'workshop' }> = {
        5: { type: 'fitness' },
        6: { type: 'nutrition' },
        8: { type: 'fitness' },
        12: { type: 'nutrition' },
        15: { type: 'special' },
        18: { type: 'fitness' },
        20: { type: 'workshop' },
        22: { type: 'nutrition' },
        25: { type: 'special' },
        28: { type: 'workshop' }
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
                        const hasActivity = activityData[day]
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

                                {/* Activity Indicators (Bubbles) */}
                                <div className="flex flex-col gap-0.5 h-4 justify-center">
                                    {day === 15 ? (
                                        <>
                                            <div className="w-1.5 h-3.5 rounded-full bg-pink-500/40" title="Workshop" />
                                            <div className="flex gap-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Meet" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Meet" />
                                            </div>
                                        </>
                                    ) : hasActivity?.type === 'fitness' ? (
                                        <div className="w-1.5 h-3.5 rounded-full bg-orange-500/40" />
                                    ) : hasActivity?.type === 'nutrition' ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                    ) : hasActivity?.type === 'special' ? (
                                        <div className="flex flex-col gap-0.5 items-center">
                                            <div className="w-1.5 h-3.5 rounded-full bg-orange-500/40" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        </div>
                                    ) : hasActivity?.type === 'workshop' ? (
                                        <div className="w-1.5 h-3.5 rounded-full bg-pink-500/40" />
                                    ) : null}
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
                            type={activityData[selectedDay]?.type || 'fitness'}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
