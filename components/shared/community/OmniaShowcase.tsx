"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, MotionValue, useMotionValue } from 'framer-motion'
import { Flame, Star, Zap, ShoppingCart, Users, User, Briefcase, ChevronRight, Play, Utensils, Globe, Layers, Video, ShieldAlert, Scale, MapPin, ArrowLeft, ArrowRight, Edit2, Clock, X, Maximize2, FileText, Monitor, Laptop, Cloud, TrendingUp, BarChart3, PlusCircle, Mic, MicOff, VideoOff, PhoneOff, Hand, MoreVertical, MessageSquare, Info, LayoutGrid, ShieldCheck, Wifi } from 'lucide-react'
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
    const [clientMockupType, setClientMockupType] = useState<'fitness' | 'nutrition'>('fitness')
    const [coachMockupType, setCoachMockupType] = useState<'clients' | 'profile' | 'products'>('profile')
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
    const titleY1 = useTransform(scrollYProgress, [0, 0.15], [0, -10])
    const titleY2 = useTransform(scrollYProgress, [0, 0.08, 0.22], [0, 0, -20])
    const titleY3 = useTransform(scrollYProgress, [0, 0.12, 0.28], [0, 0, -30])
    const titleOpacity = useTransform(scrollYProgress, [0, 0.18, 0.35], [1, 1, 0])

    const taglineX2 = useTransform(scrollYProgress, [0, 0.15], [20, 0])
    const taglineX3 = useTransform(scrollYProgress, [0, 0.15], [40, 0])

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
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    // Detectar si la sección está en pantalla para reiniciar el autoplay si se pausó
    const sectionRef = useRef<HTMLDivElement>(null)
    const isVisible = (function useIsVisible(ref: any) {
        const [isIntersecting, setIntersecting] = useState(false)
        useEffect(() => {
            const observer = new IntersectionObserver(([entry]) => {
                // Solo activamos si entra en pantalla. Si sale, no hacemos nada con el estado de autoplay 
                // pero rastreamos la intersección para el RE-INGRESO.
                setIntersecting(entry.isIntersecting)
            }, { threshold: 0.1 })
            if (ref.current) observer.observe(ref.current)
            return () => { observer.disconnect() }
        }, [ref])
        return isIntersecting
    })(sectionRef)

    // Controlar el autoplay basado directamente en la visibilidad
    useEffect(() => {
        setIsAutoPlaying(isVisible)
    }, [isVisible])

    const handleManualInteraction = (action: () => void) => {
        setIsAutoPlaying(false)
        action()
    }

    // 🔄 Advanced Auto-cycle logic (TASK-004)
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            const types: ('workshop' | 'document' | 'program')[] = ['workshop', 'document', 'program'];
            const categories: ('fitness' | 'nutricion')[] = ['fitness', 'nutricion'];
            const modalities: ('online' | 'hybrid' | 'presencial')[] = ['online', 'hybrid', 'presencial'];
            const workshopModes: ('grupal' | 'individual')[] = ['grupal', 'individual'];

            // 1. Ciclar Intensidad (1, 2, 3)
            setIntensity(prev => (prev % 3) + 1);

            // 2. Ciclar Modalidad
            setModality(prev => modalities[(modalities.indexOf(prev) + 1) % modalities.length]);

            // 3. Ciclar Modo de taller
            setWorkshopMode(prev => workshopModes[(workshopModes.indexOf(prev) + 1) % workshopModes.length]);

            // 4. Ciclar Tipo y Categoría (los drivers principales)
            setFilterType(prevType => {
                const currentIndex = types.indexOf(prevType);
                const nextIndex = (currentIndex + 1) % types.length;

                if (nextIndex === 0) {
                    setFilterCategory(prevCat =>
                        categories[(categories.indexOf(prevCat) + 1) % categories.length]
                    );
                }
                return types[nextIndex];
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

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
        <div ref={containerRef} className="flex flex-col gap-12 pb-32 pt-4 px-2 overflow-hidden">
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
                ref={sectionRef}
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
                                    onClick={() => handleManualInteraction(() => setFilterCategory('fitness'))}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        filterCategory === 'fitness' ? "bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20" : "text-white/20 hover:text-white/40 bg-white/[0.03]"
                                    )}
                                >
                                    <Zap size={18} fill={filterCategory === 'fitness' ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={() => handleManualInteraction(() => setFilterCategory('nutricion'))}
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
                                    onClick={() => handleManualInteraction(() => setFilterType(t.id as any))}
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

                    {/* Fixed 2-Column Product Display on all screen sizes - Maximized presence (+20% scale feel) */}
                    <div className="grid grid-cols-2 gap-3 lg:gap-6 items-stretch min-h-[760px] lg:min-h-[500px] relative px-1">
                        {/* Fake Floating Comments (Desktop only) */}
                        <div className="hidden lg:block absolute top-0 left-[35%] w-0 h-full z-20 pointer-events-none">
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
                                    className="relative w-full h-[400px]"
                                >
                                    {/* ... existing desktop comments logic ... */}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="relative z-10 order-1">
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
                                            className="h-full sm:scale-100 mobile:scale-[1.25] origin-top-left"
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
                        <div className="flex flex-col justify-center gap-7 lg:gap-6 p-3 lg:p-6 rounded-[32px] bg-white/[0.01] border border-white/5 relative overflow-hidden backdrop-blur-3xl z-10 order-2">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-[80px] -z-10" />

                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] lg:text-[10px] font-black text-[#FF7939] uppercase italic tracking-[0.2em]">
                                        {filterType === 'workshop' ? 'Taller' : filterType === 'document' ? 'Documento' : 'Programa'}
                                    </span>
                                </div>
                                {/* Title & Interactive Mode Badge */}
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[17px] lg:text-xl font-black text-white italic uppercase leading-[1.1]">
                                            {filterType === 'workshop' ? 'Experiencia Viva' : filterType === 'document' ? 'Conocimiento Directo' : 'Plan Maestro'}
                                        </h3>
                                    </div>

                                    {filterType === 'workshop' && (
                                        <div className="flex items-center gap-2 mt-5 lg:mt-4">
                                            {[
                                                { id: 'grupal', label: 'Grupal', icon: Users },
                                                { id: 'individual', label: '1:1', icon: User }
                                            ].map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => handleManualInteraction(() => setWorkshopMode(m.id as any))}
                                                    className={cn(
                                                        "flex items-center gap-2 lg:gap-2 px-3.5 lg:px-4 py-2 lg:py-2 rounded-lg lg:rounded-xl transition-all border",
                                                        workshopMode === m.id
                                                            ? "bg-white/10 border-[#FF7939]/50 text-white"
                                                            : "bg-white/5 border-white/5 text-white/30"
                                                    )}
                                                >
                                                    <m.icon size={13} className={workshopMode === m.id ? "text-[#FF7939]" : "text-white/20"} />
                                                    <span className="text-[11px] lg:text-[10px] font-black uppercase italic">{m.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[13px] lg:text-[13px] text-white/50 font-semibold leading-tight mt-5 lg:mt-3">
                                        {filterType === 'workshop'
                                            ? (workshopMode === 'grupal' ? 'Sesiones grupales.' : 'Atención exclusiva.')
                                            : filterType === 'document'
                                                ? 'PDFs para aplicar hoy.'
                                                : 'Transformación total.'}
                                    </p>
                                </div>
                            </div>

                            {/* Intensity Selector */}
                            <div className="flex flex-col gap-2.5 lg:gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] lg:text-[12px] font-black text-white/60 uppercase italic">Nivel</span>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map((lvl) => {
                                            const IconMatch = filterCategory === 'nutricion' ? Utensils : Flame;
                                            return (
                                                <button key={lvl} onClick={() => handleManualInteraction(() => setIntensity(lvl))}>
                                                    <IconMatch size={18} className={cn(intensity >= lvl ? (intensity === 1 ? "text-[#F7E16B]" : intensity === 2 ? "text-[#FF7939]" : "text-[#FF4D4D]") : "text-white/[0.03]")} fill="none" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Modality Selector */}
                            <div className="flex flex-col gap-3.5 pt-3.5 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] lg:text-[12px] font-black text-white/60 uppercase italic">Digital</span>
                                    <div className="flex gap-2.5">
                                        {[
                                            { id: 'online', icon: Globe },
                                            { id: 'hybrid', icon: Scale },
                                            { id: 'presencial', icon: MapPin }
                                        ].map((m) => (
                                            <button key={m.id} onClick={() => handleManualInteraction(() => setModality(m.id as any))} className={cn("p-3 rounded-lg border", modality === m.id ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.02] border-white/5 text-white/20")}>
                                                <m.icon size={18} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Features (Compact) */}
                            <div className="flex flex-col gap-3.5 pt-5 border-t border-white/5 sm:block mb-6">
                                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                    <Video size={18} className="text-white/40" />
                                    <span className="text-[11px] lg:text-[10px] font-black text-white uppercase italic tracking-wider">Meet Incluida</span>
                                </div>
                            </div>

                            {/* Mobile Staggered Comments (TASK-002) - Directly under info */}
                            <div className="flex lg:hidden flex-col gap-1 relative mt-2 pt-4 border-t border-white/5">
                                <div className="space-y-1">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-[#1e1e1e]/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl self-start ml-0 mr-4 z-10"
                                    >
                                        <div className="flex gap-0.5 text-[#FF7939] mb-1.5"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                                        <p className="text-[14px] text-white font-black italic leading-tight">"¡Me encantó todo!"</p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-[#1e1e1e]/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl self-start ml-6 mr-0 z-20"
                                    >
                                        <div className="flex gap-0.5 text-[#FF7939] mb-1.5"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                                        <p className="text-[14px] text-white font-black italic leading-tight">"Súper claro."</p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-[#1e1e1e]/90 backdrop-blur-md rounded-2xl p-4 border border-[#FF7939]/30 shadow-xl self-start ml-2 mr-6 z-10"
                                    >
                                        <div className="flex gap-0.5 text-[#FF7939] mb-1.5"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                                        <p className="text-[14px] text-white font-black italic leading-tight">"10/10 brutal."</p>
                                    </motion.div>
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
                        onClick={() => handleManualInteraction(() => setRole('client'))}
                        className={cn(
                            "px-10 py-4 rounded-full text-xs font-black uppercase tracking-tighter italic transition-all duration-500",
                            role === 'client' ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "text-white/30 hover:text-white/50"
                        )}
                    >
                        Soy Cliente
                    </button>
                    <button
                        onClick={() => handleManualInteraction(() => setRole('coach'))}
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
                            <div className="space-y-32">
                                {/* 1. Integrated Mobile Experience (iPhone) */}
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Tu Libertad <br /><span className="text-white/30 text-xl tracking-normal lowercase">en un solo lugar.</span></h3>
                                        <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed mt-2">
                                            Una experiencia móvil diseñada para la acción. Todo tu entrenamiento y nutrición integrados en una interfaz fluida. Toca para ver detalle.
                                        </p>
                                    </div>

                                    <div className="flex justify-center relative h-[620px] w-full max-w-sm mx-auto perspective-[2000px] mt-12 mb-12 select-none">
                                        {/* Glow Backgrounds */}
                                        <div className={cn(
                                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000",
                                            clientMockupType === 'fitness' ? "bg-[#FF7939]/20" : "bg-orange-300/20"
                                        )} />

                                        {/* Phone 1: Fitness */}
                                        <motion.div
                                            onClick={() => setClientMockupType('fitness')}
                                            animate={{
                                                scale: clientMockupType === 'fitness' ? 1.05 : 0.85,
                                                x: clientMockupType === 'fitness' ? "-50%" : "-100%",
                                                y: clientMockupType === 'fitness' ? 0 : 20,
                                                zIndex: clientMockupType === 'fitness' ? 20 : 10,
                                                rotateZ: clientMockupType === 'fitness' ? 0 : -5,
                                                opacity: clientMockupType === 'fitness' ? 1 : 0.4,
                                                filter: clientMockupType === 'fitness' ? 'blur(0px)' : 'blur(4px)',
                                            }}
                                            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                            className="absolute top-0 left-1/2 w-[280px] aspect-[9/19] rounded-[48px] border-[6px] border-[#1a1a1a] overflow-hidden bg-[#050505] shadow-2xl cursor-pointer"
                                        >
                                            <div className="h-full flex flex-col bg-black overflow-y-auto hide-scrollbar pointer-events-none">
                                                {/* Status Bar / Notch */}
                                                <div className="h-7 flex items-center justify-center bg-black relative z-50">
                                                    <div className="w-14 h-4 bg-black rounded-b-xl" />
                                                </div>

                                                <div className="px-5 py-2 flex items-center justify-between">
                                                    <ArrowLeft size={16} className="text-white/80" />
                                                    <span className="text-[#FF7939] text-[7px] font-black uppercase italic tracking-[0.2em] flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-[#FF7939] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,121,57,0.5)]" /> PENDIENTE
                                                    </span>
                                                    <div className="w-4" />
                                                </div>

                                                <h4 className="px-6 text-[12px] font-black text-white text-center uppercase italic leading-tight mb-3">
                                                    Press con mancuernas <br /> en banco plano
                                                </h4>

                                                {/* Video Player Mockup with Real Image - Aspect ratio adjusted */}
                                                <div className="mx-3 aspect-[4/3] bg-white/5 rounded-2xl relative group/video overflow-hidden border border-white/5">
                                                    <img
                                                        src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"
                                                        alt="Exercise Preview"
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale transition-all duration-700"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5 bg-gradient-to-t from-black to-transparent">
                                                        <div className="w-full h-1 bg-white/20 rounded-full relative overflow-hidden">
                                                            <div className="absolute left-0 top-0 h-full w-[45%] bg-[#FF7939]" />
                                                        </div>
                                                        <div className="flex items-center justify-between text-[7px] font-bold text-white/80">
                                                            <div className="flex items-center gap-2">
                                                                <Play size={8} fill="white" className="text-white" />
                                                                <span>00:32 / 01:15</span>
                                                            </div>
                                                            <Maximize2 size={8} className="opacity-60" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="p-3 bg-[#FF7939] rounded-full shadow-[0_0_30px_rgba(255,121,57,0.4)]">
                                                            <Play size={14} fill="white" className="text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex justify-center">
                                                    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-3xl">
                                                        <div className="flex items-center gap-1.5"><Clock size={10} className="text-white/30" /><span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">12 min</span></div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5"><Flame size={10} className="text-[#FF7939]" /><span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">~70 kcal</span></div>
                                                            <div className="px-2 py-0.5 bg-blue-500/20 rounded border border-blue-500/30">
                                                                <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Fuerza</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 px-6 flex items-center justify-between border-b border-white/5 pb-2">
                                                    {['Series', 'Músculos', 'Equipo', 'Técnica'].map((tab, i) => (
                                                        <span key={tab} className={cn(
                                                            "text-[8px] font-black uppercase italic tracking-tighter",
                                                            i === 0 ? "text-white border-b-2 border-[#FF7939]" : "text-white/20"
                                                        )}>{tab}</span>
                                                    ))}
                                                </div>

                                                <div className="mt-4 px-4 space-y-2 flex-1">
                                                    {[1, 2, 3, 4, 5, 6].map((s) => (
                                                        <div key={s} className={cn(
                                                            "p-2.5 rounded-2xl border flex items-center justify-between transition-all duration-500",
                                                            s <= 2 ? "bg-white/[0.04] border-white/10" : "bg-transparent border-white/5 opacity-20"
                                                        )}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black", s <= 2 ? "bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30" : "bg-white/5 text-white/10")}>{s}</div>
                                                                <div className="flex gap-3">
                                                                    <div className="flex flex-col"><span className="text-[9px] font-black text-white">{s <= 2 ? '3' : ''}</span><span className="text-[5px] text-white/30 uppercase font-black">Series</span></div>
                                                                    <div className="flex flex-col"><span className="text-[9px] font-black text-white">{s <= 2 ? '10' : ''}</span><span className="text-[5px] text-white/30 uppercase font-black">Reps</span></div>
                                                                    <div className="flex flex-col"><span className="text-[9px] font-black text-white">{s <= 2 ? '15kg' : ''}</span><span className="text-[5px] text-white/30 uppercase font-black">Peso</span></div>
                                                                </div>
                                                            </div>
                                                            {s <= 2 && <ShieldCheck size={10} className="text-[#FF7939]" />}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto p-6 flex justify-between">
                                                    <div className="p-3 rounded-full border border-white/10 bg-white/5"><ArrowLeft size={14} className="text-white/20" /></div>
                                                    <div className="p-3 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 shadow-[0_0_20px_rgba(255,121,57,0.15)]"><ArrowRight size={14} className="text-[#FF7939]" /></div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Phone 2: Nutrition */}
                                        <motion.div
                                            onClick={() => setClientMockupType('nutrition')}
                                            animate={{
                                                scale: clientMockupType === 'nutrition' ? 1.05 : 0.85,
                                                x: clientMockupType === 'nutrition' ? "-50%" : "0%",
                                                y: clientMockupType === 'nutrition' ? 0 : 20,
                                                zIndex: clientMockupType === 'nutrition' ? 20 : 10,
                                                rotateZ: clientMockupType === 'nutrition' ? 0 : 5,
                                                opacity: clientMockupType === 'nutrition' ? 1 : 0.4,
                                                filter: clientMockupType === 'nutrition' ? 'blur(0px)' : 'blur(4px)',
                                            }}
                                            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                            className="absolute top-0 left-1/2 w-[280px] aspect-[9/19] rounded-[48px] border-[6px] border-[#1a1a1a] overflow-hidden bg-[#050505] shadow-2xl cursor-pointer"
                                        >
                                            <div className="h-full flex flex-col bg-black overflow-y-auto hide-scrollbar pointer-events-none">
                                                {/* Nutrition Mockup Header */}
                                                <div className="h-7 flex items-center justify-center bg-black relative z-50">
                                                    <div className="w-14 h-4 bg-black rounded-b-xl" />
                                                </div>

                                                <div className="px-5 py-3 flex items-center justify-between">
                                                    <ArrowLeft size={16} className="text-white/80" />
                                                    <span className="text-orange-300 text-[9px] font-black uppercase italic">MENÚ DEL DÍA</span>
                                                    <div className="w-4" />
                                                </div>

                                                <div className="px-6 flex flex-col items-center">
                                                    <div className="relative w-full aspect-square max-w-[180px] group/nutrition-image">
                                                        <div className="absolute inset-0 bg-orange-300/20 rounded-full blur-3xl animate-pulse" />
                                                        <img
                                                            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
                                                            alt="Healthy Plate"
                                                            className="absolute inset-0 w-full h-full object-cover rounded-full border-4 border-white/5 shadow-2xl transition-transform duration-700 group-hover/nutrition-image:scale-105"
                                                        />
                                                        {/* Play Button Overlay on Plate */}
                                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                                            <div className="p-4 bg-orange-300 rounded-full shadow-[0_0_40px_rgba(253,186,116,0.4)] cursor-pointer hover:scale-110 active:scale-95 transition-all">
                                                                <Play size={20} fill="white" className="text-white ml-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 text-center">
                                                        <h5 className="text-[13px] font-black text-white italic uppercase">Bowl Mediterráneo</h5>
                                                        <p className="text-[8px] font-bold text-orange-300 tracking-widest uppercase">450 Calorías reales</p>
                                                    </div>
                                                </div>

                                                <div className="mt-6 px-4 space-y-4">
                                                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-[24px] backdrop-blur-2xl">
                                                        <div className="flex justify-between items-end mb-3">
                                                            <span className="text-[11px] font-black text-white uppercase italic">Macros</span>
                                                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Balance Ideal</span>
                                                        </div>
                                                        <div className="flex h-2.5 gap-1.5 mb-5 overflow-hidden">
                                                            <div className="w-[45%] bg-[#FF7939] rounded-full shadow-[0_0_10px_rgba(255,121,57,0.3)]" />
                                                            <div className="w-[30%] bg-orange-300 rounded-full" />
                                                            <div className="w-[25%] bg-blue-400 rounded-full" />
                                                        </div>
                                                        <div className="flex justify-between items-center px-1">
                                                            <div className="flex flex-col items-center"><span className="text-[11px] font-black text-white">40g</span><span className="text-[6px] text-white/40 uppercase font-black">PROT</span></div>
                                                            <div className="flex flex-col items-center"><span className="text-[11px] font-black text-white">25g</span><span className="text-[6px] text-white/40 uppercase font-black">FATS</span></div>
                                                            <div className="flex flex-col items-center"><span className="text-[11px] font-black text-white">15g</span><span className="text-[6px] text-white/40 uppercase font-black">CARBS</span></div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                                                        <div className="flex border-b border-white/5">
                                                            <div className="flex-1 py-3 text-center border-r border-white/5 bg-white/5">
                                                                <span className="text-[8px] font-black text-orange-300 italic uppercase">Ingredientes</span>
                                                            </div>
                                                            <div className="flex-1 py-3 text-center">
                                                                <span className="text-[8px] font-black text-white/20 italic uppercase">Receta</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 space-y-2">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1 h-1 rounded-full bg-orange-300" />
                                                                        <span className="text-[9px] font-bold text-white/60">Base de Quinoa</span>
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-white/40 italic uppercase">120g</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* 2. iPad Integrated Experience (Multi-Device) */}
                                <div className="space-y-12">
                                    <div className="text-center space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            <Laptop size={12} className="text-blue-400" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase italic">Experiencia Web Pro</span>
                                        </div>
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Interacción <br /><span className="text-white/30 text-xl tracking-normal lowercase">multitasking real.</span></h3>
                                        <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
                                            Tus sesiones en vivo y documentos compartidos en una sola pantalla. Diseñado para tablets y escritorio para que no te pierdas ni un detalle.
                                        </p>
                                    </div>

                                    <div className="flex justify-center relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />

                                        {/* iPad Layout: 3/4 Video Workshop (Yoga) + 1/4 PDF Doc */}
                                        <div className="w-full max-w-[850px] aspect-[11/8] bg-[#0a0a0a] rounded-[32px] border-[12px] border-[#1a1a1a] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                                            {/* Camera Top */}
                                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/40 rounded-full border border-white/10 z-50" />

                                            {/* iPad Native Status Bar */}
                                            <div className="absolute top-0 w-full px-8 py-3 flex items-center justify-between z-30 text-white/90">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold">5:37 PM</span>
                                                    <span className="text-[10px] font-medium opacity-60">Ven 27 feb</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-80">
                                                    <Globe size={11} />
                                                    <Wifi size={11} />
                                                    <div className="flex items-center gap-0.5 ml-1">
                                                        <div className="w-5 h-2.5 border border-white/40 rounded-[3px] relative flex items-center px-[1px]">
                                                            <div className="h-full w-[65%] bg-white rounded-[1px]" />
                                                            <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[3px] bg-white/40 rounded-r-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex h-full pt-8">
                                                {/* Left Side: Video Workshop */}
                                                <div className="w-[68%] bg-black relative flex flex-col border-r border-white/10 overflow-hidden">
                                                    {/* Central Multi-tasking Handle (The 3 dots the user mentioned) */}
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex gap-0.5 opacity-40">
                                                        <div className="w-1 h-1 bg-white rounded-full" />
                                                        <div className="w-1 h-1 bg-white rounded-full" />
                                                        <div className="w-1 h-1 bg-white rounded-full" />
                                                    </div>

                                                    {/* Video Content */}
                                                    <div className="h-full relative overflow-hidden flex items-center justify-center">
                                                        <img
                                                            src="/showcase/yoga_coach.png"
                                                            alt="Yoga Workshop"
                                                            className="w-full h-full object-cover"
                                                        />

                                                        {/* Meet Header UI */}
                                                        <div className="absolute top-0 w-full p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start z-10">
                                                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                                                <span className="text-[#FF7939] text-[8px] animate-pulse">●</span>
                                                                <span className="text-[10px] font-bold text-white/90">Taller Yoga: Maru</span>
                                                            </div>
                                                        </div>

                                                        {/* Google Meet Style Controls */}
                                                        <div className="absolute bottom-6 left-0 w-full px-6 flex items-center justify-between z-20">
                                                            <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                                                <MicOff size={10} className="text-red-400" />
                                                                <span className="text-[10px] font-bold text-white/90">Maru Yoga</span>
                                                            </div>

                                                            <div className="absolute left-[45%] -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl">
                                                                <button className="p-2 bg-white/5 rounded-full text-white/80"><Mic size={14} /></button>
                                                                <button className="p-2 bg-white/5 rounded-full text-white/80"><Video size={14} /></button>
                                                                <button className="p-2 bg-white/5 rounded-full text-white/80"><Monitor size={14} /></button>
                                                                <button className="p-2 bg-white/5 rounded-full text-white/80"><Hand size={14} /></button>
                                                                <button className="p-2.5 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/30"><PhoneOff size={14} /></button>
                                                            </div>

                                                            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
                                                                <Users size={12} className="text-white/60" />
                                                                <MessageSquare size={12} className="text-white/60" />
                                                                <LayoutGrid size={12} className="text-white/60" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side: PDF Document Section */}
                                                <div className="w-[32%] bg-[#1c1c1e] flex flex-col overflow-hidden relative">
                                                    {/* Central Multi-tasking Handle (3 dots) */}
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex gap-0.5 opacity-40">
                                                        <div className="w-1 h-1 bg-white rounded-full" />
                                                        <div className="w-1 h-1 bg-white rounded-full" />
                                                        <div className="w-1 h-1 bg-white rounded-full" />
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto hide-scrollbar pt-6 pb-12 flex flex-col items-center gap-4 px-2">
                                                        {[1, 2, 3].map((page) => (
                                                            <div key={page} className={cn(
                                                                "w-full bg-white shadow-xl rounded-sm overflow-hidden",
                                                                page === 3 ? "h-32 opacity-40" : "aspect-[3/4.2]"
                                                            )}>
                                                                <img
                                                                    src="/showcase/yoga_document.png"
                                                                    className="w-full h-full object-cover"
                                                                    alt={`Manual Page ${page}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-32">
                                {/* 1. Integrated Mobile Experience (iPhone Coach) */}
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-3xl">
                                            {(['clients', 'products', 'profile'] as const).map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => handleManualInteraction(() => setCoachMockupType(tab))}
                                                    className={cn(
                                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all duration-300",
                                                        coachMockupType === tab
                                                            ? (tab === 'clients' ? "bg-blue-500 text-white" : tab === 'products' ? "bg-cyan-500 text-white" : "bg-[#FF7939] text-white")
                                                            : "text-white/30 hover:text-white/50"
                                                    )}
                                                >
                                                    {tab === 'clients' ? 'Clientes' : tab === 'products' ? 'Productos' : 'Perfil'}
                                                </button>
                                            ))}
                                        </div>
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Tu Negocio <br /><span className="text-white/30 text-xl tracking-normal lowercase">en escala real.</span></h3>
                                        <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
                                            Control total sobre tus alumnos y tu contenido. Una oficina potente que cabe en tu bolsillo.
                                        </p>
                                    </div>

                                    <div className="flex justify-center relative h-[620px] w-full max-w-sm mx-auto perspective-[2000px] mt-12 mb-12 select-none">
                                        {/* Glow Backgrounds */}
                                        <div className={cn(
                                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000",
                                            coachMockupType === 'clients' ? "bg-blue-500/20" : coachMockupType === 'products' ? "bg-cyan-500/20" : "bg-[#FF7939]/20"
                                        )} />

                                        {/* Phone 1: Clients */}
                                        <motion.div
                                            onClick={() => setCoachMockupType('clients')}
                                            animate={{
                                                scale: coachMockupType === 'clients' ? 1.05 : 0.85,
                                                x: coachMockupType === 'clients' ? "-50%" : "-100%",
                                                y: coachMockupType === 'clients' ? 0 : 20,
                                                zIndex: coachMockupType === 'clients' ? 20 : 10,
                                                rotateZ: coachMockupType === 'clients' ? 0 : -5,
                                                opacity: coachMockupType === 'clients' ? 1 : 0.4,
                                                filter: coachMockupType === 'clients' ? 'blur(0px)' : 'blur(4px)',
                                            }}
                                            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                            className="absolute top-0 left-1/2 w-[280px] aspect-[9/19] rounded-[48px] border-[6px] border-[#1a1a1a] overflow-hidden bg-[#050505] shadow-2xl cursor-pointer"
                                        >
                                            <div className="h-full flex flex-col bg-[#050505] overflow-y-auto hide-scrollbar pointer-events-none">
                                                <div className="h-7 flex justify-center bg-black relative z-50">
                                                    <div className="w-14 h-4 bg-black rounded-b-xl" />
                                                </div>

                                                <div className="px-6 py-4 space-y-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Seguimiento</span>
                                                        <span className="text-xl font-black text-white italic uppercase">Mis Clientes</span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {[
                                                            { name: 'Juan Pérez', status: 'Activo', progress: 85, color: '#3b82f6' },
                                                            { name: 'María Garcia', status: 'Nuevo', progress: 10, color: '#10b981' },
                                                            { name: 'Pedro Solo', status: 'Inactivo', progress: 0, color: '#ef4444' }
                                                        ].map((client, i) => (
                                                            <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/50">
                                                                        {client.name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-black text-white">{client.name}</span>
                                                                        <span className="text-[8px] font-bold uppercase" style={{ color: client.color }}>{client.status}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-white/20" style={{ width: `${client.progress}%` }} />
                                                                    </div>
                                                                    <ChevronRight size={10} className="text-white/20" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mt-auto p-4 bg-black/80 backdrop-blur-md border-t border-white/5 flex justify-around items-center">
                                                    <Users size={18} className="text-blue-500" />
                                                    <PlusCircle size={18} className="text-white/20" />
                                                    <BarChart3 size={18} className="text-white/20" />
                                                    <User size={18} className="text-white/20" />
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Phone 2: Profile (Dashboard) */}
                                        <motion.div
                                            onClick={() => setCoachMockupType('profile')}
                                            animate={{
                                                scale: coachMockupType === 'profile' ? 1.05 : 0.85,
                                                x: coachMockupType === 'profile' ? "-50%" : "0%",
                                                y: coachMockupType === 'profile' ? 0 : 20,
                                                zIndex: coachMockupType === 'profile' ? 20 : 10,
                                                rotateZ: coachMockupType === 'profile' ? 0 : 5,
                                                opacity: coachMockupType === 'profile' ? 1 : 0.4,
                                                filter: coachMockupType === 'profile' ? 'blur(0px)' : 'blur(4px)',
                                            }}
                                            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                            className="absolute top-0 left-1/2 w-[280px] aspect-[9/19] rounded-[48px] border-[6px] border-[#1a1a1a] overflow-hidden bg-[#050505] shadow-2xl cursor-pointer"
                                        >
                                            <div className="h-full flex flex-col bg-[#0a0a0a] overflow-y-auto hide-scrollbar pointer-events-none">
                                                <div className="h-7 flex justify-center bg-[#0a0a0a] relative z-50">
                                                    <div className="w-14 h-4 bg-black rounded-b-xl" />
                                                </div>

                                                {/* Profile Content */}
                                                <div className="flex flex-col items-center pt-4 px-4">
                                                    <div className="w-16 h-16 rounded-full border-2 border-[#FF7939] p-0.5 mb-2">
                                                        <img src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100&q=80" className="w-full h-full object-cover rounded-full" />
                                                    </div>
                                                    <h5 className="text-[13px] font-black text-white italic uppercase leading-none">Franco Pomati coach</h5>
                                                    <div className="flex items-center gap-4 mt-2 mb-3">
                                                        <div className="flex items-center gap-1 text-[8px] font-black text-white"><Star size={8} className="text-[#FF7939] fill-[#FF7939]" /> 4.3</div>
                                                        <div className="text-[8px] font-black text-white/40 uppercase">1 ventas</div>
                                                        <div className="text-[8px] font-black text-white/40 uppercase">1 cert.</div>
                                                    </div>

                                                    <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-4">
                                                        <div className="text-center mb-4">
                                                            <span className="text-2xl font-black text-white italic tracking-tighter">$850</span>
                                                            <p className="text-[7px] text-white/30 uppercase font-bold tracking-widest mt-1">Ganancia Bruta: $1.000 | Suscripción: -$12.000</p>
                                                        </div>
                                                        <div className="w-full h-10 bg-[#FF7939] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,121,57,0.3)]">
                                                            <span className="text-[10px] font-black text-black">1k</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2 mt-4">
                                                            {[Briefcase, Users, FileText, MessageSquare].map((Icon, idx) => (
                                                                <div key={idx} className="flex flex-col items-center gap-1">
                                                                    <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-white/40">
                                                                        <Icon size={12} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="w-full space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-white/60 uppercase italic">Estadísticas</span>
                                                            <span className="text-[7px] text-white/20 uppercase font-bold">Últimos 30 días</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {[
                                                                { label: 'Tasa de resp.', val: '0%', status: 'Crítico', icon: MessageSquare },
                                                                { label: 'Tiempo resp.', val: 'N/A', status: 'Rápido', icon: Clock }
                                                            ].map((stat, idx) => (
                                                                <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <stat.icon size={10} className="text-[#FF7939]" />
                                                                        <span className="text-[7px] font-black text-white/30 uppercase">{stat.label}</span>
                                                                    </div>
                                                                    <p className="text-sm font-black text-white">{stat.val}</p>
                                                                    <span className="text-[7px] text-white/20 font-bold uppercase">{stat.status}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-auto p-4 bg-black/80 backdrop-blur-md border-t border-white/5 flex justify-around items-center">
                                                    <Users size={18} className="text-white/20" />
                                                    <PlusCircle size={18} className="text-white/20" />
                                                    <BarChart3 size={18} className="text-white/20" />
                                                    <User size={18} className="text-[#FF7939]" />
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Phone 3: Products */}
                                        <motion.div
                                            onClick={() => setCoachMockupType('products')}
                                            animate={{
                                                scale: coachMockupType === 'products' ? 1.05 : 0.85,
                                                x: coachMockupType === 'products' ? "-50%" : "100%",
                                                y: coachMockupType === 'products' ? 0 : 20,
                                                zIndex: coachMockupType === 'products' ? 20 : 5,
                                                rotateZ: coachMockupType === 'products' ? 0 : 10,
                                                opacity: coachMockupType === 'products' ? 1 : 0.3,
                                                filter: coachMockupType === 'products' ? 'blur(0px)' : 'blur(4px)',
                                            }}
                                            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                            className="absolute top-0 left-1/2 w-[280px] aspect-[9/19] rounded-[48px] border-[6px] border-[#1a1a1a] overflow-hidden bg-[#050505] shadow-2xl cursor-pointer"
                                        >
                                            <div className="h-full flex flex-col bg-black overflow-y-auto hide-scrollbar pointer-events-none">
                                                <div className="h-7 flex justify-center bg-black relative z-50">
                                                    <div className="w-14 h-4 bg-black rounded-b-xl" />
                                                </div>

                                                <div className="px-5 py-4 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-white italic uppercase tracking-tighter">Content Studio</span>
                                                        <PlusCircle size={16} className="text-cyan-400" />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            {mockActivities.slice(0, 2).map((act) => (
                                                                <div key={act.id} className="scale-[0.8] origin-top py-2 border-b border-white/5">
                                                                    <ActivityCard
                                                                        activity={act}
                                                                        size="small"
                                                                        variant="blurred"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-auto p-4 bg-black/80 backdrop-blur-md border-t border-white/5 flex justify-around items-center">
                                                    <Users size={18} className="text-white/20" />
                                                    <ShoppingCart size={18} className="text-cyan-400" />
                                                    <BarChart3 size={18} className="text-white/20" />
                                                    <User size={18} className="text-white/20" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* 2. iPad Integrated Experience (Multi-Device Coach) */}
                                <div className="space-y-12">
                                    <div className="text-center space-y-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                                            <Monitor size={12} className="text-cyan-400" />
                                            <span className="text-[10px] font-black text-cyan-400 uppercase italic">Workspace de Alto Rendimiento</span>
                                        </div>
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Diseño sin <br /><span className="text-white/30 text-xl tracking-normal lowercase">fricción técnica.</span></h3>
                                        <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
                                            Construí rutinas complejas arrastrando elementos. Nuestra IA te sugiere cargas y descansos basados en el historial de tu alumno.
                                        </p>
                                    </div>

                                    <div className="flex justify-center relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />

                                        <div className="w-full max-w-[850px] aspect-[11/8] bg-[#0a0a0a] rounded-[32px] border-[12px] border-[#1a1a1a] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                                            <div className="flex h-full">
                                                {/* Left Panel: Exercise Assets */}
                                                <div className="w-[30%] bg-[#121212] border-r border-white/5 flex flex-col p-5">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <span className="text-[10px] font-black text-white uppercase italic">Biblioteca</span>
                                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><PlusCircle size={10} /></div>
                                                    </div>
                                                    <div className="space-y-4 overflow-y-auto hide-scrollbar">
                                                        {[1, 2, 3, 4].map((i) => (
                                                            <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 flex gap-3 group/item hover:border-cyan-500/30 transition-all cursor-move">
                                                                <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden">
                                                                    <img src={`https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&q=80`} className="w-full h-full object-cover opacity-40 group-hover/item:opacity-100 transition-opacity" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-white uppercase">{i === 1 ? 'Sentadilla' : 'Peso Muerto'}</span>
                                                                    <span className="text-[6px] text-white/30 uppercase font-bold">Piernas</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Main Panel: Program Builder */}
                                                <div className="flex-1 bg-black p-8 flex flex-col">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-[14px] font-black text-white italic uppercase leading-none">Rutina: Volumen Pro G-1</h4>
                                                            <p className="text-[8px] text-cyan-400 font-bold uppercase tracking-[0.2em] mt-1">Editando ahora</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[8px] font-bold text-white/60">Semana 1</div>
                                                            <div className="px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30 text-[8px] font-black text-cyan-400">Día A</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        <div className="p-6 bg-white/[0.03] border border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-3 group-hover:border-cyan-500/20 transition-all">
                                                            <div className="p-4 bg-white/5 rounded-full"><PlusCircle size={24} className="text-white/10" /></div>
                                                            <p className="text-[9px] font-black text-white/20 uppercase italic">Arrastrá un ejercicio aquí</p>
                                                        </div>
                                                        <div className="p-5 bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/10 rounded-[24px] flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center font-black text-cyan-500 italic text-[16px]">01</div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-white uppercase italic">Press de Banca</p>
                                                                    <p className="text-[8px] text-white/30 font-bold uppercase font-black">4 Series x 10-12 Reps</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4].map(s => <div key={s} className="w-2 h-2 rounded-full bg-cyan-500" />)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button className="mt-auto w-full py-4 bg-cyan-500 text-black text-[10px] font-black uppercase italic rounded-xl tracking-[0.3em] shadow-[0_20px_40px_rgba(6,182,212,0.2)]">
                                                        Publicar Programa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 pt-12 border-t border-white/5">
                                    <ShowcaseFeatureCard title="Pro Analytics" type="coach" icon={TrendingUp} />
                                    <ShowcaseFeatureCard title="Program Architect" type="coach" icon={PlusCircle} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div >

            {/* Final CTA Overlay */}
            < section className="text-center py-20 relative" >
                <div className="absolute -inset-10 bg-[#FF7939]/5 blur-[100px] -z-10" />
                <div className="w-16 h-1 w-full bg-gradient-to-r from-transparent via-[#FF7939]/30 to-transparent mx-auto mb-10" />
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight">
                    ¿Estás listo para <br />
                    <span className="text-[#FF7939]">la evolución?</span>
                </h2>
                <Button className="bg-white text-black hover:bg-white/90 rounded-full px-16 py-8 h-auto text-sm font-black italic uppercase shadow-[0_0_50px_rgba(255,255,255,0.1)] border-none">
                    Unirme a la comunidad
                </Button>
            </section >
        </div >
    )
}
