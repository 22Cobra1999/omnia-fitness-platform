"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, MotionValue, useMotionValue } from 'framer-motion'
import { Flame, Star, Zap, ShoppingCart, Users, User, Briefcase, ChevronRight, Play, Utensils, Globe, Layers, Video, ShieldAlert, Scale, MapPin } from 'lucide-react'
import { ShowcaseBubble, ShowcaseProgressRing, ShowcaseFeatureCard, ShowcaseIngredients, MockCalendar, ShowcaseShelf, ShowcaseConcept } from './ShowcaseComponents'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { OmniaLogo, OmniaLogoText } from '@/components/shared/ui/omnia-logo'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { Activity } from "@/types/activity"

interface OmniaShowcaseProps {
    scrollY?: MotionValue<number>
}

export function OmniaShowcase({ scrollY }: OmniaShowcaseProps) {
    const [role, setRole] = useState<'client' | 'coach'>('client')
    const [realActivities, setRealActivities] = useState<Activity[]>([])
    const [isLoadingReal, setIsLoadingReal] = useState(true)

    useEffect(() => {
        const fetchRealActivities = async () => {
            try {
                setIsLoadingReal(true)
                const response = await fetch('/api/activities/search')
                if (response.ok) {
                    const data = await response.json()
                    setRealActivities(data)
                }
            } catch (error) {
                console.error('Error fetching real activities for showcase:', error)
            } finally {
                setIsLoadingReal(false)
            }
        }
        fetchRealActivities()
    }, [])
    const containerRef = useRef(null)

    // Optimized scroll tracking: use passed scrollY if available (from app-mobile.tsx scroll container)
    const backupScrollY = useMotionValue(0)
    const effectiveScrollY = scrollY || backupScrollY

    // Progress for title animations (normalized over 400px of scroll)
    const scrollYProgress = useTransform(effectiveScrollY, [0, 400], [0, 1])

    // Stepped Tagline movement (more pronounced offsets for a 'stepped' feel)
    const titleY1 = useTransform(scrollYProgress, [0, 0.15], [0, -50])
    const titleY2 = useTransform(scrollYProgress, [0, 0.08, 0.22], [0, 0, -90])
    const titleY3 = useTransform(scrollYProgress, [0, 0.12, 0.28], [0, 0, -130])
    const titleOpacity = useTransform(scrollYProgress, [0, 0.18, 0.35], [1, 1, 0])

    const taglineX2 = useTransform(scrollYProgress, [0, 0.15], [40, 0])
    const taglineX3 = useTransform(scrollYProgress, [0, 0.15], [80, 0])

    // Mock activities data matching real Search results
    const mockActivities = [
        {
            id: 'hot-stuff',
            title: 'Hot stuff',
            coach_name: 'Franco Pomati',
            price: 15000,
            categoria: 'fitness',
            type: 'workshop',
            difficulty: 'intermediate',
            image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
            program_rating: 4.9,
            total_program_reviews: 124,
            items_unicos: 12,
            cantidadDias: 8,
            capacity: '∞',
            modality: 'híbrido',
            objetivos: ['Fuerza', 'Técnica'],
            coach_rating: 4.8
        },
        {
            id: 'calistenia',
            title: 'Calistenia desde cero',
            coach_name: 'Bauti B.',
            price: 12500,
            categoria: 'fitness',
            type: 'program',
            difficulty: 'beginner',
            image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80',
            program_rating: 4.8,
            total_program_reviews: 89,
            items_unicos: 45,
            cantidadDias: 24,
            capacity: '∞',
            modality: 'online',
            objetivos: ['Control Mental', 'Fuerza'],
            coach_rating: 5.0
        },
        {
            id: 'gamma-bomb',
            title: 'Gamma Bomb - Hipertrofia',
            coach_name: 'Franco Pomati',
            price: 8000,
            categoria: 'fitness',
            type: 'document',
            difficulty: 'advanced',
            image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
            program_rating: 5.0,
            total_program_reviews: 215,
            items_unicos: 2,
            cantidadDias: 180,
            capacity: '∞',
            modality: 'online',
            objetivos: ['Masa Muscular', 'Fuerza'],
            coach_rating: 4.8
        },
        {
            id: 'nutri-prog',
            title: 'Programa de Nutrición',
            coach_name: 'Franco Pomati',
            price: 12000,
            categoria: 'nutricion',
            type: 'program',
            difficulty: 'beginner',
            image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
            program_rating: 4.7,
            total_program_reviews: 67,
            items_unicos: 10,
            cantidadDias: 24,
            capacity: '∞',
            modality: 'híbrido',
            objetivos: ['Mediterránea', 'Salud'],
            coach_rating: 4.8
        }
    ] as any[]

    const mockEnrollments = mockActivities.map(a => ({
        id: `enr-${a.id}`,
        activity_id: a.id,
        client_id: 'user-1',
        status: 'activa',
        activity: a
    })) as any[]

    const [filterType, setFilterType] = useState<'workshop' | 'document' | 'program'>('program')
    const [filterCategory, setFilterCategory] = useState<'fitness' | 'nutricion'>('fitness')
    const [intensity, setIntensity] = useState(2)
    const [modality, setModality] = useState<'online' | 'hybrid' | 'presencial'>('online')
    const [workshopMode, setWorkshopMode] = useState<'grupal' | 'individual'>('grupal')

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div ref={containerRef} className="flex flex-col gap-12 pb-32 pt-4 px-4 overflow-hidden">
            {/* 0. Hero Section - Shrinking Logo to Header */}
            <section
                className="flex flex-col items-center justify-center py-20 relative pointer-events-none z-[1001] h-[160px]"
            >
                {/* Under-logo shadow for dimension */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/60 blur-xl rounded-full" />

                {/* Shadow at the feet effect */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-10 bg-[#FF7939]/10 blur-3xl rounded-full" />

                {/* The Logo itself is now managed globally in app-mobile.tsx to ensure a seamless transition into the fixed header */}
            </section>

            {/* Scrolling Staggered Title with Straightening Staircase Effect */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.15 } },
                    hidden: { transition: { staggerChildren: 0.1, staggerDirection: -1 } }
                }}
                style={{ opacity: titleOpacity }}
                className="w-full max-w-lg mx-auto mb-8 flex flex-col items-start px-8"
            >
                <motion.h1
                    style={{ y: titleY1 }}
                    variants={{
                        hidden: { opacity: 0, x: -30, filter: 'blur(10px)' },
                        visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none"
                >
                    La plataforma de
                </motion.h1>
                <motion.h1
                    style={{ y: titleY2, x: taglineX2 }}
                    variants={{
                        hidden: { opacity: 0, x: -30, filter: 'blur(10px)' },
                        visible: { opacity: 1, x: 40, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="text-3xl font-black text-[#FF7939] italic uppercase tracking-tighter leading-none"
                >
                    los mejores coaches
                </motion.h1>
                <motion.h1
                    style={{ y: titleY3, x: taglineX3 }}
                    variants={{
                        hidden: { opacity: 0, x: -30, filter: 'blur(10px)' },
                        visible: { opacity: 1, x: 80, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none"
                >
                    que siempre quisiste.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-white/40 text-[10px] font-bold uppercase mt-12 tracking-widest w-full text-center"
                >
                    +10k alumnos reales transformados
                </motion.p>
            </motion.div>

            {/* 1. Feature Previews: Activities & Calendar */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-12"
            >
                {/* Filtered Products Section (Explora lo Nuevo) */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-5 px-2">
                        <h2 className="text-xs font-black text-white italic uppercase tracking-[0.2em]">Explora lo Nuevo</h2>

                        {/* Unified Filters Row (Type + Category) */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                            {/* Category Filters */}
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 mr-2">
                                <button
                                    onClick={() => setFilterCategory('fitness')}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        filterCategory === 'fitness' ? "bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20" : "text-white/20 hover:text-white/40 bg-white/[0.03]"
                                    )}
                                >
                                    <Zap size={18} fill={filterCategory === 'fitness' ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={() => setFilterCategory('nutricion')}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        filterCategory === 'nutricion' ? "bg-orange-300 text-black shadow-lg shadow-orange-300/20" : "text-white/20 hover:text-white/40 bg-white/[0.03]"
                                    )}
                                >
                                    <Utensils size={18} fill={filterCategory === 'nutricion' ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            {/* Type Filters */}
                            {[
                                { id: 'workshop', label: 'Taller' },
                                { id: 'document', label: 'Documento' },
                                { id: 'program', label: 'Programa' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setFilterType(t.id as any)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-2xl text-xs font-black uppercase italic transition-all whitespace-nowrap border flex-shrink-0",
                                        filterType === t.id
                                            ? "bg-white text-black border-white shadow-lg scale-105"
                                            : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2-Column Product Display */}
                    <div className="grid grid-cols-2 gap-4 items-stretch min-h-[420px] relative">
                        {/* Fake Floating Comments over the gutter */}
                        <div className="absolute top-1/2 left-[32%] -translate-x-1/2 -translate-y-1/2 w-0 h-full z-20 pointer-events-none flex items-center justify-center">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={`${filterType}-${filterCategory}`}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
                                        exit: { opacity: 0, transition: { duration: 0.2 } }
                                    }}
                                    className="relative w-full h-full"
                                >
                                    {/* Select reviews based on category/type */}
                                    {(() => {
                                        const reviewsSet = filterCategory === 'nutricion'
                                            ? filterType === 'workshop'
                                                ? [
                                                    { text: "¡Me encantó la charla!", top: "30%", left: "-40px" },
                                                    { text: "Súper claro todo.", top: "50%", left: "20px" },
                                                    { text: "10/10.", top: "70%", left: "-30px" }
                                                ]
                                                : filterType === 'document'
                                                    ? [
                                                        { text: "Muy fácil de leer.", top: "35%", left: "-30px" },
                                                        { text: "Recetas increíbles.", top: "50%", left: "30px" },
                                                        { text: "Me cambió la vida.", top: "65%", left: "-20px" }
                                                    ]
                                                    : [
                                                        { text: "Dieta top.", top: "30%", left: "-50px" },
                                                        { text: "Resultados reales.", top: "50%", left: "10px" },
                                                        { text: "Cero hambre.", top: "70%", left: "-40px" }
                                                    ]
                                            : filterType === 'workshop'
                                                ? [
                                                    { text: "Técnica impecable.", top: "35%", left: "-40px" },
                                                    { text: "Aprendí muchísimo.", top: "50%", left: "20px" },
                                                    { text: "El coach es un genio.", top: "65%", left: "-30px" }
                                                ]
                                                : filterType === 'document'
                                                    ? [
                                                        { text: "La rutina perfecta.", top: "35%", left: "-50px" },
                                                        { text: "Directo al grano.", top: "50%", left: "30px" },
                                                        { text: "Excelente guía.", top: "65%", left: "-40px" }
                                                    ]
                                                    : [
                                                        { text: "Programa brutal.", top: "30%", left: "-60px" },
                                                        { text: "Mis mejores marcas.", top: "50%", left: "20px" },
                                                        { text: "Muy superior.", top: "70%", left: "-50px" }
                                                    ]

                                        return reviewsSet.map((rev, idx) => (
                                            <motion.div
                                                key={idx}
                                                variants={{
                                                    hidden: { opacity: 0, scale: 0.5, x: -20, y: 10 },
                                                    visible: { opacity: 1, scale: 1.0, x: 0, y: 0, transition: { type: 'spring', stiffness: 200, damping: 15 } },
                                                    exit: { opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }
                                                }}
                                                style={{ position: 'absolute', top: rev.top, left: rev.left, zIndex: 10 + idx }}
                                                className="bg-[#1e1e1e] backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 shadow-2xl origin-left min-w-[140px]"
                                            >
                                                <div className="flex gap-0.5 text-[#FF7939] mb-1"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                                                <p className="text-[12px] text-white font-semibold italic">"{rev.text}"</p>
                                            </motion.div>
                                        ))
                                    })()}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                {(() => {
                                    // Filter real activities if they exist, fallback to mock
                                    const source = realActivities.length > 0 ? realActivities : mockActivities
                                    const filtered = source.filter(a =>
                                        a.type === filterType && a.categoria === filterCategory
                                    )
                                    // If no perfect match, show the first available of that category
                                    const act = filtered[0] || source.find(a => a.categoria === filterCategory) || source[0]

                                    return (
                                        <motion.div
                                            key={act.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.05 }}
                                            transition={{ duration: 0.3, ease: "circOut" }}
                                            className="h-full"
                                        >
                                            <ActivityCard
                                                activity={act}
                                                size="small"
                                                variant="blurred"
                                            />
                                        </motion.div>
                                    )
                                })()}
                            </AnimatePresence>
                        </div>

                        {/* Product Type Description & Interactive Controls */}
                        <div className="flex flex-col justify-center gap-6 p-6 rounded-[32px] bg-white/[0.01] border border-white/5 relative overflow-hidden backdrop-blur-3xl z-10">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-[80px] -z-10" />

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-[#FF7939] uppercase italic tracking-[0.2em]">
                                        {filterType === 'workshop' ? 'Taller' : filterType === 'document' ? 'Documento' : 'Programa'}
                                    </span>
                                </div>
                                {/* Title & Interactive Mode Badge */}
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-white italic uppercase leading-none">
                                            {filterType === 'workshop' ? 'Experiencia Viva' : filterType === 'document' ? 'Conocimiento Directo' : 'Plan Maestro'}
                                        </h3>
                                    </div>

                                    {filterType === 'workshop' && (
                                        <div className="flex items-center gap-2 mt-4">
                                            {[
                                                { id: 'grupal', label: 'Grupal', icon: Users },
                                                { id: 'individual', label: '1:1', icon: User }
                                            ].map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setWorkshopMode(m.id as any)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all border",
                                                        workshopMode === m.id
                                                            ? "bg-white/10 border-[#FF7939]/50 text-white shadow-lg"
                                                            : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                                                    )}
                                                >
                                                    <m.icon size={14} className={workshopMode === m.id ? "text-[#FF7939]" : "text-white/20"} />
                                                    <span className="text-[10px] font-black uppercase italic">{m.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[13px] text-white/50 font-semibold leading-tight mt-3">
                                        {filterType === 'workshop'
                                            ? (workshopMode === 'grupal' ? 'Sesiones grupales con feedback real.' : 'Atención focalizada y exclusiva.')
                                            : filterType === 'document'
                                                ? 'PDFs optimizados para aplicar hoy.'
                                                : 'Programas de transformación total.'}
                                    </p>
                                </div>
                            </div>

                            {/* Intensity Selector (Fuegos Hollow) */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-black text-white/60 uppercase italic">Intensidad</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((lvl) => {
                                            const IconMatch = filterCategory === 'nutricion' ? Utensils : Flame;
                                            return (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setIntensity(lvl)}
                                                    className="transition-all active:scale-95"
                                                >
                                                    <IconMatch
                                                        size={18}
                                                        className={cn(
                                                            "transition-all duration-300",
                                                            intensity >= lvl
                                                                ? (intensity === 1 ? "text-[#F7E16B] drop-shadow-[0_0_10px_rgba(247,225,107,0.4)]"
                                                                    : intensity === 2 ? "text-[#FF7939] drop-shadow-[0_0_10px_rgba(255,121,57,0.4)]"
                                                                        : "text-[#FF4D4D] drop-shadow-[0_0_10px_rgba(255,77,77,0.4)]")
                                                                : "text-white/[0.03]"
                                                        )}
                                                        fill="none"
                                                        strokeWidth={intensity >= lvl ? 2.5 : 1.5}
                                                    />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className={cn(
                                    "text-[12px] font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-left-2",
                                    intensity === 1 ? "text-[#F7E16B]" : intensity === 2 ? "text-[#FF7939]" : "text-[#FF4D4D]"
                                )}>
                                    {intensity === 1 ? 'Básico' : intensity === 2 ? 'Intermedio' : 'Avanzado'}
                                </div>
                            </div>

                            {/* Modality Selector with Descriptions */}
                            <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-black text-white/60 uppercase italic">Modalidad Flex</span>
                                    <div className="flex gap-1.5">
                                        {[
                                            { id: 'online', icon: Globe, color: 'text-white', bg: 'bg-white/10', border: 'border-white/20', label: '100% Digital' },
                                            { id: 'hybrid', icon: Scale, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Mix Presencial' },
                                            { id: 'presencial', icon: MapPin, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Face to Face' }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setModality(m.id as any)}
                                                className={cn(
                                                    "p-2 rounded-xl border transition-all duration-300",
                                                    modality === m.id
                                                        ? `${m.bg} ${m.border} ${m.color} shadow-lg scale-110`
                                                        : "bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10"
                                                )}
                                            >
                                                <m.icon size={16} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[13px] font-semibold text-white/50 leading-tight italic animate-in fade-in slide-in-from-bottom-1">
                                    {modality === 'online' ? "Acceso global desde cualquier dispositivo." :
                                        modality === 'hybrid' ? "Soporte digital + encuentros físicos." :
                                            "Atención directa y personalizada en gimnasio."}
                                </p>
                            </div>


                            {/* Features Explainers */}
                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                <div className="flex flex-col gap-1 p-2.5 rounded-2xl bg-white/[0.01] border border-white/10 group hover:bg-white/[0.03] transition-all">
                                    <div className="flex items-center gap-2">
                                        <Video size={16} className="text-white" />
                                        <span className="text-[11px] font-black text-white uppercase italic">Meet Incluida</span>
                                    </div>
                                    <p className="text-[10px] text-white/40 leading-none">Opcional: sesiones agendadas.</p>
                                </div>
                                <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-white/[0.01] border border-white/10 group hover:bg-white/[0.03] transition-all">
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert size={16} className="text-red-400/60" />
                                            <span className="text-[11px] font-black text-white uppercase italic">Restricciones</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Star size={16} className="text-yellow-400/60" />
                                            <span className="text-[11px] font-black text-white uppercase italic">Objetivos</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/40 leading-tight">Filtro de salud y metas definidas para que coincidan con tu compra.</p>
                                </div>
                            </div>


                        </div>
                    </div>

                </div>

                {/* Calendar Preview */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="w-12 h-px bg-white/10" />
                        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest italic">Agenda tu Progreso</h2>
                    </div>
                    <MockCalendar />
                </div>
            </motion.section>

            {/* 2. Selector de Perfil Minimalista */}
            <div className="flex flex-col items-center gap-10 mt-10">
                <div className="flex p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-3xl">
                    <button
                        onClick={() => setRole('client')}
                        className={cn(
                            "px-10 py-4 rounded-full text-xs font-black uppercase tracking-tighter italic transition-all duration-500",
                            role === 'client' ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "text-white/30 hover:text-white/50"
                        )}
                    >
                        Soy Cliente
                    </button>
                    <button
                        onClick={() => setRole('coach')}
                        className={cn(
                            "px-10 py-4 rounded-full text-xs font-black uppercase tracking-tighter italic transition-all duration-500",
                            role === 'coach' ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "text-white/30 hover:text-white/50"
                        )}
                    >
                        Soy Coach
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={role}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="w-full flex flex-col gap-12"
                    >
                        {role === 'client' ? (
                            <div className="space-y-8">
                                <section className="bg-white/5 rounded-[40px] p-8 border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF7939]/5 blur-[80px] -z-10" />
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-[#FF7939]/10 rounded-2xl">
                                            <Star size={20} className="text-[#FF7939]" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tu Libertad</h3>
                                    </div>
                                    <p className="text-sm text-white/40 leading-relaxed mb-8">
                                        Entrená donde quieras, cuando quieras. Marketplace de programas reales, nutrición basada en ciencia y contacto directo con expertos.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <ShoppingCart size={16} className="text-[#FF7939] mb-2" />
                                            <p className="text-[10px] font-black uppercase text-white">Comprá hoy</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <Zap size={16} className="text-[#FF7939] mb-2" />
                                            <p className="text-[10px] font-black uppercase text-white">Usalo ya</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 gap-6">
                                    <ShowcaseFeatureCard title="Power Builder" type="fitness" icon={Flame} />
                                    <ShowcaseFeatureCard title="Veggie Plan" type="nutrition" icon={Utensils} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <section className="bg-white/5 rounded-[40px] p-8 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-[80px] -z-10" />
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                                            <Briefcase size={20} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tu Negocio</h3>
                                    </div>
                                    <p className="text-sm text-white/40 leading-relaxed mb-8">
                                        Dejá que el software trabaje por vos. Cobros automáticos, gestión de alumnos y escalabilidad real desde tu bolsillo.
                                    </p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <Users size={16} className="text-blue-400" />
                                            <span className="text-[10px] font-black uppercase text-white">Manejo de Alumnos</span>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <Play size={16} className="text-blue-400" />
                                            <span className="text-[10px] font-black uppercase text-white">Contenido On-Demand</span>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-gradient-to-br from-blue-500/20 to-transparent p-10 rounded-[50px] border border-blue-500/20 text-center">
                                    <h4 className="text-3xl font-black text-white italic uppercase mb-4 leading-none">Tu éxito <br /><span className="text-blue-400">Digital.</span></h4>
                                    <p className="text-xs text-white/40 lowercase tracking-widest font-bold">Automatizá pagos y rutinas hoy mismo.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Final CTA Overlay */}
            <section className="text-center py-20 relative">
                <div className="absolute -inset-10 bg-[#FF7939]/5 blur-[100px] -z-10" />
                <div className="w-16 h-1 w-full bg-gradient-to-r from-transparent via-[#FF7939]/30 to-transparent mx-auto mb-10" />
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight">
                    ¿Estás listo para <br />
                    <span className="text-[#FF7939]">la evolución?</span>
                </h2>
                <Button className="bg-white text-black hover:bg-white/90 rounded-full px-16 py-8 h-auto text-sm font-black italic uppercase shadow-[0_0_50px_rgba(255,255,255,0.1)] border-none">
                    Unirme a la comunidad
                </Button>
            </section>
        </div>
    )
}
