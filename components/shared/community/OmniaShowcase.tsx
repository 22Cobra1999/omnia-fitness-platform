"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, MotionValue, useMotionValue } from 'framer-motion'
import { Flame, Star, Zap, ShoppingCart, Users, User, Briefcase, ChevronRight, ChevronLeft, Play, Utensils, Globe, Layers, Video, ShieldAlert, Scale, MapPin, ArrowLeft, ArrowRight, Edit2, Clock, X, Maximize2, FileText, Monitor, Laptop, Cloud, TrendingUp, BarChart3, PlusCircle, Mic, MicOff, VideoOff, PhoneOff, Hand, MoreVertical, MessageSquare, Info, LayoutGrid, ShieldCheck, Wifi, Calendar, Award, Settings, Search, SlidersHorizontal, ShoppingBag, BookOpen, Book, RotateCcw, Printer } from 'lucide-react'
import { ShowcaseBubble, ShowcaseProgressRing, ShowcaseFeatureCard, ShowcaseIngredients, MockCalendar, ShowcaseShelf, ShowcaseConcept, ShowcaseActivityRings, ShowcaseWeeklyMiniRings } from './ShowcaseComponents'
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
    const [clientMockupType, setClientMockupType] = useState<'fitness' | 'nutrition' | 'profile'>('fitness')
    const [coachMockupType, setCoachMockupType] = useState<'clients' | 'profile' | 'products'>('clients')
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

    const PhoneMockup = ({ type, role = 'coach', children, active, onClick }: { type: string, role?: 'client' | 'coach', children: React.ReactNode, active: boolean, onClick: () => void }) => (
        <motion.div
            onClick={onClick}
            initial={false}
            animate={{
                scale: active ? 1 : 0.95,
                x: active ? "-50%" : (type === 'clients' || type === 'fitness') ? "-110%" : "60%",
                y: 0,
                zIndex: active ? 20 : 10,
                rotateZ: 0,
                opacity: active ? 1 : 0.3,
                filter: active ? 'blur(0px)' : 'blur(8px)',
            }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="absolute top-0 left-1/2 w-[280px] aspect-[9/19] rounded-[48px] border-[6px] border-[#1a1a1a] overflow-hidden bg-[#050505] shadow-2xl cursor-pointer"
        >
            {/* The iPhone Notch - No blue dot */}
            <div className="absolute top-0 inset-x-0 mx-auto w-[90px] h-[18px] bg-[#1a1a1a] rounded-b-[12px] z-[100] border-b border-x border-[#222]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#010101] rounded-full flex items-center justify-center ring-1 ring-white/5 shadow-inner">
                    <div className="w-[3px] h-[3px] bg-white/10 rounded-full blur-[0.5px]" />
                </div>
            </div>

            <div className="h-full flex flex-col bg-[#050505] overflow-y-auto hide-scrollbar pointer-events-none pt-[12px] relative">
                {/* Header within Phone - Sticky to stay visible */}
                <div className="sticky top-0 h-10 w-full px-4 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/5 z-[60]">
                    <div className="p-1.5 text-white/20"><Settings size={14} /></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[#FF7939] font-black tracking-[0.2em] italic text-[11px] uppercase">omnia</span>
                    </div>
                    <div className="p-1.5 text-white/20 relative">
                        <MessageSquare size={14} />
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#FF7939] rounded-full border border-black" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={type}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="flex-1 flex flex-col"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Shared App Navigation Footer within Phone */}
                <div className="absolute bottom-0 w-full h-16 bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-2 z-[70]">
                    {role === 'coach' ? (
                        <>
                            <div className={cn("flex flex-col items-center gap-1", (type === 'clients') ? "text-[#FF7939]" : "opacity-40")}>
                                <Users size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Clientes</span>
                            </div>
                            <div className={cn("flex flex-col items-center gap-1 opacity-40")}>
                                <Utensils size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Nutrición</span>
                            </div>
                            <div className="relative -top-3 w-12 h-12 bg-[#FF7939]/30 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-orange-500/10 border-4 border-white/5">
                                <Flame size={20} fill="white" className="text-white" />
                            </div>
                            <div className={cn("flex flex-col items-center gap-1 opacity-40")}>
                                <Calendar size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Calendario</span>
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", (type === 'profile') ? "text-[#FF7939]" : "opacity-40")}>
                                <User size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Perfil</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={cn("flex flex-col items-center gap-1 opacity-40")}>
                                <Search size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Buscar</span>
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", (type === 'fitness') ? "text-[#FF7939]" : "opacity-40")}>
                                <Zap size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Actividades</span>
                            </div>
                            <div className="relative -top-3 w-12 h-12 bg-[#FF7939]/30 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-orange-500/10 border-4 border-white/5">
                                <Flame size={20} fill="white" className="text-white" />
                            </div>
                            <div className={cn("flex flex-col items-center gap-1 opacity-40")}>
                                <Calendar size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Calendario</span>
                            </div>
                            <div className={cn("flex flex-col items-center gap-1", (type === 'profile') ? "text-[#FF7939]" : "opacity-40")}>
                                <User size={18} />
                                <span className="text-[8px] font-black uppercase text-center leading-none">Perfil</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div >
    );


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

                <div className="relative z-10 scale-[1.3] transform-none">
                    <OmniaLogo width={180} />
                </div>
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
                    <div className="flex flex-col gap-4 px-3">
                        <h2 className="text-[10px] font-black text-white/40 italic uppercase tracking-[0.2em] mb-1">Explora lo Nuevo</h2>

                        {/* Unified Filters Row (Type + Category) */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 px-1 -mx-1">
                            {/* Category Filters */}
                            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5 mr-1 flex-shrink-0">
                                <button
                                    onClick={() => handleManualInteraction(() => setFilterCategory('fitness'))}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        filterCategory === 'fitness' ? "bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20" : "text-white/20 hover:text-white/40 bg-white/[0.01]"
                                    )}
                                >
                                    <Zap size={16} fill={filterCategory === 'fitness' ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={() => handleManualInteraction(() => setFilterCategory('nutricion'))}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        filterCategory === 'nutricion' ? "bg-orange-300 text-black shadow-lg shadow-orange-300/20" : "text-white/20 hover:text-white/40 bg-white/[0.01]"
                                    )}
                                >
                                    <Utensils size={16} fill={filterCategory === 'nutricion' ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            {/* Type Filters */}
                            {[
                                { id: 'workshop', label: 'Taller' },
                                { id: 'document', label: 'Doc' },
                                { id: 'program', label: 'Programa' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleManualInteraction(() => setFilterType(t.id as any))}
                                    className={cn(
                                        "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase italic transition-all whitespace-nowrap border flex-shrink-0",
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
                    <div className="grid grid-cols-2 gap-2 lg:gap-6 items-stretch min-h-[760px] lg:min-h-[500px] relative px-1">
                        {/* Fake Floating Comments (Desktop only) - Positioned in the void between columns */}
                        <div className="hidden lg:block absolute top-[10%] left-[32%] w-60 h-full z-20 pointer-events-none">
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
                                    className="relative w-full h-[600px]"
                                >
                                    {(() => {
                                        const comments = filterCategory === 'nutricion'
                                            ? [{ text: "¡Súper rico!", x: -40, y: 0 }, { text: "Fácil de hacer", x: 20, y: 140 }, { text: "10/10 sano", x: -30, y: 280 }]
                                            : filterType === 'workshop'
                                                ? [{ text: "Clase increíble", x: -40, y: 0 }, { text: "Maru es lo más", x: 20, y: 140 }, { text: "Pura paz", x: -30, y: 280 }]
                                                : [{ text: "¡Increíble!", x: -40, y: 0 }, { text: "10/10 brutal", x: 20, y: 140 }, { text: "Pura calidad", x: -30, y: 280 }];

                                        return comments.map((c, i) => (
                                            <motion.div
                                                key={i}
                                                variants={{
                                                    hidden: { opacity: 0, scale: 0.5, x: c.x - 20 },
                                                    visible: { opacity: 1, scale: 1, x: c.x, transition: { type: "spring", bounce: 0.4 } }
                                                }}
                                                style={{ top: c.y }}
                                                className="absolute bg-white/[0.07] backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl"
                                            >
                                                <div className="flex gap-1.5 text-[#FF7939] mb-1.5">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                                                </div>
                                                <p className="text-[16px] text-white font-black italic">"{c.text}"</p>
                                            </motion.div>
                                        ));
                                    })()}
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
                        <div className="flex flex-col justify-start self-start gap-6 lg:gap-6 p-2 lg:p-6 bg-transparent relative z-10 order-2 -mr-2">

                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] lg:text-[10px] font-black text-[#FF7939] uppercase italic tracking-[0.2em]">
                                        {filterType === 'workshop' ? 'Taller' : filterType === 'document' ? 'Doc' : 'Programa'}
                                    </span>
                                </div>
                                {/* Title & Interactive Mode Badge - Fixed height to avoid jumps */}
                                <div className="flex flex-col min-h-[54px] justify-center">
                                    <h3 className="text-[17px] lg:text-xl font-black text-white italic uppercase leading-[1.1]">
                                        {filterType === 'workshop' ? 'Experiencia Viva' : filterType === 'document' ? 'Conocimiento Directo' : 'Plan Maestro'}
                                    </h3>
                                    <p className="text-[13px] text-white/50 font-semibold leading-tight mt-1 truncate">
                                        {filterType === 'workshop'
                                            ? (workshopMode === 'grupal' ? 'Sesiones grupales.' : 'Atención exclusiva.')
                                            : filterType === 'document'
                                                ? 'PDFs para aplicar hoy.'
                                                : 'Transformación total.'}
                                    </p>
                                </div>
                            </div>

                            {/* Meet Feature (Compact Single Row) */}
                            <div className="pt-2 border-t border-white/5">
                                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <Video size={12} className="text-[#FF7939]" />
                                        <span className="text-[9px] font-black text-white uppercase italic tracking-wider">Meet Incluida</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-white/10 uppercase italic">Opcional</span>
                                </div>
                            </div>

                            {/* Intensity Selector */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-white/40 uppercase italic">Nivel</span>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map((lvl) => {
                                            const IconMatch = filterCategory === 'nutricion' ? Utensils : Flame;
                                            return (
                                                <button key={lvl} onClick={() => handleManualInteraction(() => setIntensity(lvl))}>
                                                    <IconMatch size={16} className={cn(intensity >= lvl ? (intensity === 1 ? "text-[#F7E16B]" : intensity === 2 ? "text-[#FF7939]" : "text-[#FF4D4D]") : "text-white/[0.03]")} fill="none" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Modality Section & Workshop Filters (Fixed size container to avoid UI jumps) */}
                            <div className="flex flex-col pt-3 border-t border-white/5 min-h-[105px]">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-white/40 uppercase italic">Modalidad</span>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'online', icon: Globe },
                                                { id: 'hybrid', icon: Scale },
                                                { id: 'presencial', icon: MapPin }
                                            ].map((m) => (
                                                <button key={m.id} onClick={() => handleManualInteraction(() => setModality(m.id as any))} className={cn("p-2 rounded-lg border", modality === m.id ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.02] border-white/5 text-white/20")}>
                                                    <m.icon size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Workshop Modes (Grupal / 1:1) - Controlled height area */}
                                    <div className="h-[38px] flex items-center">
                                        <AnimatePresence mode="popLayout">
                                            {filterType === 'workshop' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className="flex items-center gap-2 w-full"
                                                >
                                                    {[
                                                        { id: 'grupal', label: 'Grupal', icon: Users },
                                                        { id: 'individual', label: '1:1', icon: User }
                                                    ].map((m) => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => handleManualInteraction(() => setWorkshopMode(m.id as any))}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all border",
                                                                workshopMode === m.id
                                                                    ? "bg-[#FF7939]/10 border-[#FF7939]/40 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)]"
                                                                    : "bg-white/[0.02] border-white/5 text-white/30"
                                                            )}
                                                        >
                                                            <m.icon size={12} className={workshopMode === m.id ? "text-[#FF7939]" : "text-white/20"} />
                                                            <span className="text-[10px] font-black uppercase italic">{m.label}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Staggered Dynamic Comments - Serpentines & Overlapping - POSITIONED BELOW MODALITY */}
                            <div className="flex lg:hidden flex-col gap-0 relative mt-4 pt-2 border-t border-white/5">
                                <div className="space-y-4">
                                    {(() => {
                                        const comments = filterCategory === 'nutricion'
                                            ? ["¡Súper rico!", "Fácil de hacer", "10/10 sano"]
                                            : filterType === 'workshop'
                                                ? ["Clase increíble", "Maru es lo más", "Pura paz"]
                                                : ["¡Me encantó!", "Súper claro", "Brutal 10/10"];

                                        // Stagger logic based on filter to vary horizontal positions - COMPACT
                                        const offsets = filterType === 'workshop' ? ['ml-8', 'ml-0', 'ml-4'] : ['ml-0', 'ml-12', 'ml-2'];

                                        return comments.map((text, i) => (
                                            <motion.div
                                                key={`${filterType}-${filterCategory}-${i}`}
                                                initial={{ opacity: 0, x: i % 2 === 0 ? 10 : -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={cn(
                                                    "self-start relative",
                                                    offsets[i],
                                                    i === 1 ? "z-[40] -translate-y-1 scale-105" : "z-[20]"
                                                )}
                                            >
                                                <div className="flex gap-0.5 text-[#FF7939] mb-0">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} fill="currentColor" />)}
                                                </div>
                                                <p className="text-[11px] text-white font-black italic leading-tight drop-shadow-2xl">"{text}"</p>
                                            </motion.div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Client Specific Restrictions & Goals (Phrase Mode) */}
                            <div className="pt-4 mt-auto border-t border-white/5">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <ShieldCheck size={14} className="text-[#FF7939]" />
                                    <p className="text-[10px] text-white/50 font-black italic tracking-wide">
                                        <span className="text-[#FF7939] uppercase">Restricciones</span> y <span className="text-[#FF7939] uppercase">objetivos</span> <br /> acordes a cada cliente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Preview */}
                    <div className="space-y-4 -mt-20 lg:-mt-10">
                        <div className="flex items-center justify-between px-2">
                            <div className="w-8 h-px bg-white/10" />
                            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Agenda tu Progreso</h2>
                            <div className="w-8 h-px bg-white/10" />
                        </div>
                        <MockCalendar />
                    </div>
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
                        {(() => {
                            if (role === 'client') return (
                                <>
                                    <div className="space-y-32">
                                        {/* 1. Integrated Mobile Experience (iPhone) */}
                                        <div className="space-y-8">
                                            <div className="flex flex-col items-center text-center space-y-4">
                                                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Tu Libertad <br /><span className="text-white/30 text-xl tracking-normal lowercase">en un solo lugar.</span></h3>
                                                <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed mt-2">
                                                    Una experiencia móvil diseñada para la acción. Todo tu entrenamiento y nutrición integrados en una interfaz fluida. Toca para ver detalle.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-12 mt-6 justify-center">
                                                {[
                                                    { type: 'fitness', icon: Zap, label: 'Fitness' },
                                                    { type: 'nutrition', icon: Utensils, label: 'Nutri' },
                                                    { type: 'profile', icon: User, label: 'Perfil' }
                                                ].map((nav) => (
                                                    <button
                                                        key={nav.type}
                                                        onClick={() => setClientMockupType(nav.type as any)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 transition-all duration-300",
                                                            clientMockupType === nav.type
                                                                ? "text-[#FF7939]"
                                                                : "text-white/20 hover:text-white/40 font-bold"
                                                        )}
                                                    >
                                                        <nav.icon size={28} fill={clientMockupType === nav.type ? "currentColor" : "none"} />
                                                        <span className="text-[10px] font-black uppercase italic tracking-widest leading-none">{nav.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex justify-center relative h-[620px] w-full max-w-sm mx-auto perspective-[2000px] mt-12 mb-12 select-none">
                                                {/* Glow Backgrounds */}
                                                <div className={cn(
                                                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000",
                                                    clientMockupType === 'fitness' ? "bg-[#FF7939]/20" : "bg-orange-300/20"
                                                )} />

                                                {/* Phone 1: Fitness */}
                                                <PhoneMockup type="fitness" role="client" active={clientMockupType === 'fitness'} onClick={() => setClientMockupType('fitness')}>
                                                    <div className="px-5 py-2 flex items-center justify-between">
                                                        <ArrowLeft size={16} className="text-white/80" />
                                                        <Flame size={18} className="text-[#FF7939] fill-[#FF7939]" />
                                                    </div>

                                                    <h4 className="px-6 text-[12px] font-black text-white text-center uppercase italic leading-tight mb-3">
                                                        Press con mancuernas <br /> en banco plano
                                                    </h4>

                                                    {/* Video Player Mockup with Real Image - Aspect ratio adjusted */}
                                                    <div className="mx-4 aspect-[4/3] bg-zinc-900 rounded-[20px] relative group/video overflow-hidden border border-white/10 shadow-xl">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"
                                                            alt="Exercise Preview"
                                                            className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale transition-all duration-700"
                                                        />
                                                        {/* Central Play Button */}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/10 transition-colors">
                                                            <div className="p-3 bg-[#FF7939] rounded-full shadow-[0_0_25px_rgba(255,121,57,0.5)] scale-90 group-hover/video:scale-100 transition-transform">
                                                                <Play size={18} fill="white" className="text-white ml-0.5" />
                                                            </div>
                                                        </div>

                                                        <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5 bg-gradient-to-t from-black to-transparent">
                                                            <div className="w-full h-1 bg-white/20 rounded-full relative overflow-hidden">
                                                                <div className="absolute left-0 top-0 h-full w-[45%] bg-[#FF7939]" />
                                                            </div>
                                                            <div className="flex items-center justify-between text-[8px] font-bold text-white/80">
                                                                <span>00:32 / 01:15</span>
                                                                <Maximize2 size={10} className="opacity-60" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex justify-center">
                                                        <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-3xl">
                                                            <div className="flex items-center gap-1.5"><Clock size={10} className="text-white/30" /><span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">12 min</span></div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1.5"><Flame size={10} className="text-[#FF7939]" /><span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">~70 kcal</span></div>
                                                                <div className="px-2 py-0.5 bg-[#FF7939]/10 border border-[#FF7939]/30 rounded-lg italic">
                                                                    <span className="text-[7.5px] font-black text-[#FF7939] uppercase tracking-tighter leading-none">Fuerza</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 px-6 flex items-center justify-between border-b border-white/5 pb-2">
                                                        {['Series', 'Músculos', 'Técnica'].map((tab, i) => (
                                                            <span key={tab} className={cn(
                                                                "text-[9px] font-black uppercase italic tracking-tighter",
                                                                i === 0 ? "text-white border-b-2 border-[#FF7939]" : "text-white/20"
                                                            )}>{tab}</span>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 px-4 space-y-2 flex-1">
                                                        {[1, 2, 3].map((s) => (
                                                            <div key={s} className={cn(
                                                                "p-2.5 rounded-2xl border flex items-center justify-between transition-all duration-500",
                                                                s <= 2 ? "bg-white/[0.04] border-white/10" : "bg-transparent border-white/5 opacity-20"
                                                            )}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black", s <= 2 ? "bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20" : "bg-white/5 text-white/10")}>{s}</div>
                                                                    <div className="flex gap-4">
                                                                        <div className="flex flex-col"><span className="text-[10px] font-black text-white">{s <= 2 ? '3' : ''}</span><span className="text-[6px] text-white/30 uppercase font-bold">SERIES</span></div>
                                                                        <div className="flex flex-col"><span className="text-[10px] font-black text-white">{s <= 2 ? '12' : ''}</span><span className="text-[6px] text-white/30 uppercase font-bold">REPS</span></div>
                                                                        <div className="flex flex-col"><span className="text-[10px] font-black text-white">{s <= 2 ? '40kg' : ''}</span><span className="text-[6px] text-white/30 uppercase font-bold">PESO</span></div>
                                                                    </div>
                                                                </div>
                                                                {s <= 2 && (
                                                                    <div className="p-1.5 bg-[#FF7939]/10 border border-[#FF7939]/30 rounded-[8px] transition-all hover:bg-[#FF7939]/20 group/edit cursor-pointer">
                                                                        <Edit2 size={10} className="text-[#FF7939]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-auto p-5 flex justify-between absolute bottom-16 inset-x-0">
                                                        <div className="p-2.5 rounded-full border border-white/10 bg-white/5"><ArrowLeft size={14} className="text-white/20" /></div>
                                                        <div className="p-2.5 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 shadow-[0_0_20px_rgba(255,121,57,0.15)]"><ArrowRight size={14} className="text-[#FF7939]" /></div>
                                                    </div>
                                                </PhoneMockup>

                                                {/* Phone 2: Nutrition */}
                                                <PhoneMockup type="nutrition" role="client" active={clientMockupType === 'nutrition'} onClick={() => setClientMockupType('nutrition')}>
                                                    <div className="px-5 py-3 flex items-center justify-between">
                                                        <ArrowLeft size={16} className="text-white/80" />
                                                        <span className="text-orange-300 text-[10px] font-black uppercase italic tracking-widest">MENÚ DEL DÍA</span>
                                                        <div className="w-4" />
                                                    </div>

                                                    <div className="px-6 flex flex-col items-center">
                                                        <div className="relative w-full aspect-square max-w-[170px] group/nutrition-image">
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7939]/20 to-transparent rounded-full blur-3xl animate-pulse" />
                                                            <img
                                                                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
                                                                alt="Healthy Plate"
                                                                className="absolute inset-0 w-full h-full object-cover rounded-full border-4 border-black shadow-2xl transition-transform duration-700 group-hover/nutrition-image:scale-105"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                                <div className="p-3 bg-orange-300 rounded-full shadow-[0_0_30px_rgba(253,186,116,0.5)]">
                                                                    <Play size={18} fill="white" className="text-white ml-0.5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 text-center">
                                                            <h5 className="text-[14px] font-black text-white italic uppercase tracking-tighter">Bowl Mediterráneo</h5>
                                                            <p className="text-[9px] font-bold text-[#FF7939] tracking-[0.15em] uppercase mt-0.5">450 kcal reales</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 px-5 space-y-4">
                                                        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-[28px] backdrop-blur-2xl">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-[11px] font-black text-white uppercase italic tracking-tighter">Macros</span>
                                                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Balanceado</span>
                                                            </div>
                                                            <div className="flex h-2 gap-1.5 mb-6 overflow-hidden rounded-full">
                                                                <div className="w-[45%] bg-[#FF7939] shadow-[0_0_10px_rgba(255,121,57,0.4)]" />
                                                                <div className="w-[30%] bg-orange-200" />
                                                                <div className="w-[25%] bg-blue-300" />
                                                            </div>
                                                            <div className="flex justify-between items-center px-1">
                                                                <div className="flex flex-col items-center"><span className="text-[12px] font-black text-white italic">40g</span><span className="text-[7px] text-white/30 uppercase font-black">PROT</span></div>
                                                                <div className="flex flex-col items-center"><span className="text-[12px] font-black text-white italic">25g</span><span className="text-[7px] text-white/30 uppercase font-black">FATS</span></div>
                                                                <div className="flex flex-col items-center"><span className="text-[12px] font-black text-white italic">15g</span><span className="text-[7px] text-white/30 uppercase font-black">CARBS</span></div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-zinc-900/40 border border-white/5 rounded-[20px] overflow-hidden">
                                                            <div className="flex border-b border-white/5 bg-white/[0.02]">
                                                                <div className="flex-1 py-1.5 text-center bg-white/5">
                                                                    <span className="text-[8px] font-black text-[#FF7939] italic uppercase">Ingredientes</span>
                                                                </div>
                                                                <div className="flex-1 py-1.5 text-center opacity-30">
                                                                    <span className="text-[8px] font-black text-white italic uppercase">Receta</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2.5 space-y-1.5">
                                                                {[
                                                                    { n: 'Quinoa', q: '120g' },
                                                                    { n: 'Pollo', q: '150g' },
                                                                    { n: 'Palta', q: '1/2 un.' }
                                                                ].map((item, i) => (
                                                                    <div key={i} className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="w-1 h-1 rounded-full bg-[#FF7939]" />
                                                                            <span className="text-[9px] font-bold text-white/70">{item.n}</span>
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-white/30 italic uppercase">{item.q}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PhoneMockup>

                                                {/* Phone 3: Profile (Client View) */}
                                                <PhoneMockup type="profile" role="client" active={clientMockupType === 'profile'} onClick={() => setClientMockupType('profile')}>
                                                    <div className="px-3 pt-3 space-y-3">
                                                        {/* 1. Header Card */}
                                                        <div className="relative rounded-[32px] overflow-hidden bg-black border border-white/5 shadow-2xl min-h-[160px]">
                                                            {/* Background Image - Dynamic Blur */}
                                                            <div className="absolute inset-0 z-0 scale-110">
                                                                <img
                                                                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80"
                                                                    className="w-full h-full object-cover opacity-40 blur-[40px]"
                                                                    alt="Profile Blur"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                                            </div>

                                                            {/* Profile Info Layer */}
                                                            <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
                                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl mb-3">
                                                                    <img
                                                                        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80"
                                                                        className="w-full h-full object-cover scale-110"
                                                                        alt="Diego"
                                                                    />
                                                                </div>

                                                                <h5 className="text-[18px] font-black text-white italic tracking-tighter leading-none uppercase">Diego Omnia</h5>

                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                                                                        <Flame size={10} className="text-[#FF7939] fill-[#FF7939]" />
                                                                        <span className="text-[9px] font-black text-[#FF7939] uppercase italic tracking-tighter">15 racha</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 2. Weekly Activity Rings (Micro) */}
                                                        <div className="bg-[#09090b] border border-white/5 rounded-[32px] p-4 shadow-2xl space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7.5px] font-black text-white/20 uppercase tracking-[0.2em] italic leading-none">Actividad</span>
                                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest mt-0.5">Semanal</span>
                                                                </div>
                                                                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                                                                    <Calendar size={12} className="text-white/20" />
                                                                </div>
                                                            </div>

                                                            <ShowcaseWeeklyMiniRings
                                                                data={[
                                                                    { label: 'L', progress: 100, color: '#FF7939' },
                                                                    { label: 'M', progress: 100, color: '#FF7939' },
                                                                    { label: 'M', progress: 85, color: '#FF7939' },
                                                                    { label: 'J', progress: 100, color: '#FF7939' },
                                                                    { label: 'V', progress: 60, color: '#FF7939' },
                                                                    { label: 'S', progress: 0, color: '#FF7939' },
                                                                    { label: 'D', progress: 0, color: '#FF7939' }
                                                                ]}
                                                            />
                                                        </div>

                                                        {/* 3. Main Activity Rings */}
                                                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-4 flex items-center justify-between relative overflow-hidden">
                                                            <div className="relative">
                                                                <ShowcaseActivityRings
                                                                    days={{ completed: 25, absent: 2, total: 30 }}
                                                                    fitness={{ completed: 18, absent: 5, total: 24 }}
                                                                    nutrition={{ completed: 22, absent: 3, total: 28 }}
                                                                    size={110}
                                                                    hideStreak={true}
                                                                />
                                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#FF7939]/5 blur-3xl -z-10" />
                                                            </div>

                                                            {/* Vertical Stats */}
                                                            <div className="flex flex-col gap-3 text-right pr-1">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center justify-end gap-1 text-[#FF7939]">
                                                                        <ArrowLeft size={10} className="rotate-225" />
                                                                        <span className="text-[10px] font-black uppercase italic tracking-tighter opacity-80 leading-none">Kcal</span>
                                                                    </div>
                                                                    <span className="text-[17px] font-black text-white leading-none tracking-tighter mt-1">2049/0</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-orange-200 uppercase italic tracking-widest leading-none opacity-80">Mins</span>
                                                                    <span className="text-[17px] font-black text-white leading-none tracking-tighter mt-0.5">304/0</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Toggle Selection */}
                                                    <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                                                        <div className="flex-1 py-1.5 rounded-xl bg-zinc-800 text-white text-center border border-white/5 shadow-xl">
                                                            <span className="text-[10px] font-black uppercase italic tracking-tight">Fitness</span>
                                                        </div>
                                                        <div className="flex-1 py-1.5 rounded-xl text-white/5 text-center">
                                                            <span className="text-[10px] font-black uppercase italic tracking-tight">Nutrición</span>
                                                        </div>
                                                    </div>
                                                </PhoneMockup>

                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. iPad Integrated Experience (Multi-Device) */}
                                    <div className="space-y-12">
                                        <div className="text-center space-y-3">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF7939]/10 rounded-full border border-[#FF7939]/20">
                                                <Layers size={12} className="text-[#FF7939]" />
                                                <span className="text-[10px] font-black text-[#FF7939] uppercase italic">Poder Multi-Dispositivo</span>
                                            </div>
                                            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Tu Dashboard <br /><span className="text-white/30 text-xl tracking-normal lowercase">en todos tus equipos.</span></h3>
                                            <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
                                                Accedé a tus rutinas y documentos desde cualquier lugar. Consultá tu manual de entrenamiento y recetarios mientras controlás tu progreso con un diseño responsivo de alto rendimiento.
                                            </p>
                                        </div>

                                        <div className="flex justify-center relative w-full px-4 overflow-hidden mobile:overflow-visible">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />

                                            {/* iPad Layout: 3/4 Planificación Avanzada (Yoga) + 1/4 PDF Doc */}
                                            <div className="w-full max-w-[850px] aspect-[11/8] bg-[#0a0a0a] rounded-[32px] border-[12px] border-[#1a1a1a] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative group scale-[0.82] sm:scale-100 origin-top">
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
                                                    {/* Left Side: Planificación Avanzada */}
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
                                                                src="/showcase/https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"
                                                                alt="Yoga Workshop"
                                                                className="w-full h-full object-cover"
                                                            />

                                                            {/* Meet Header UI */}
                                                            <div className="absolute top-0 w-full p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start z-10">
                                                                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                                                    <span className="text-[#FF7939] text-[8px] animate-pulse">●</span>
                                                                    <span className="text-[10px] font-bold text-white/90">Planificador Pro: Franco</span>
                                                                </div>
                                                            </div>

                                                            {/* Google Meet Style Controls */}
                                                            <div className="absolute bottom-6 left-0 w-full px-4 flex items-center justify-between z-20">
                                                                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 min-w-0">
                                                                    <MicOff size={10} className="text-red-400 flex-shrink-0" />
                                                                    <span className="text-[9px] font-bold text-white/90 truncate max-w-[50px] sm:max-w-none">Maru Yoga</span>
                                                                </div>

                                                                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl flex-shrink-0">
                                                                    <button className="p-1.5 bg-white/5 rounded-full text-white/80"><Mic size={12} /></button>
                                                                    <button className="p-1.5 bg-white/5 rounded-full text-white/80"><Video size={12} /></button>
                                                                    <button className="p-1.5 bg-white/5 rounded-full text-white/80"><Monitor size={12} /></button>
                                                                    <button className="p-1.5 bg-white/5 rounded-full text-white/80"><Hand size={12} /></button>
                                                                    <button className="p-2 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/30"><PhoneOff size={12} /></button>
                                                                </div>

                                                                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 flex-shrink-0">
                                                                    <Users size={10} className="text-white/60" />
                                                                    <MessageSquare size={10} className="text-white/60" />
                                                                    <LayoutGrid size={10} className="text-white/60" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Manuales Interactivos */}
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
                                                                        src="/showcase/https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"
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
                                        <div className="mt-12 flex justify-center">
                                            <Button className="bg-[#FF7939] text-black hover:bg-[#FF7939]/90 rounded-full px-12 py-7 h-auto text-[11px] font-black italic uppercase shadow-[0_0_50px_rgba(255,121,57,0.2)] border-none flex items-center gap-3 group">
                                                Unirme a la comunidad <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            );

                            return (
                                <div className="space-y-32">
                                    {/* 1. Integrated Mobile Experience (iPhone Coach) */}
                                    <div className="space-y-8">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Tu Negocio <br /><span className="text-white/30 text-xl tracking-normal lowercase">en escala real.</span></h3>
                                            <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed mt-2">
                                                Gestioná tus alumnos, programas y ventas con una interfaz diseñada para coaches de alto rendimiento.
                                            </p>

                                            {/* Refined Pagination Icons for Coach - Moved Above Phones */}
                                            <div className="flex items-center gap-12 mt-6">
                                                {[
                                                    { type: 'clients', icon: Users, label: 'Clientes' },
                                                    { type: 'profile', icon: User, label: 'Perfil' }
                                                ].map((nav) => (
                                                    <button
                                                        key={nav.type}
                                                        onClick={() => setCoachMockupType(nav.type as any)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 transition-all duration-300",
                                                            coachMockupType === nav.type
                                                                ? "text-[#FF7939]"
                                                                : "text-white/20 hover:text-white/40 font-bold"
                                                        )}
                                                    >
                                                        <nav.icon size={28} fill={coachMockupType === nav.type ? "currentColor" : "none"} />
                                                        <span className="text-[10px] font-black uppercase italic tracking-widest">{nav.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
                                            <div className="flex justify-center relative h-[620px] w-full max-w-sm mx-auto perspective-[2000px] mt-12 mb-12 select-none">
                                                {/* Glow Backgrounds */}
                                                <div className={cn(
                                                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000",
                                                    coachMockupType === 'clients' ? "bg-blue-500/20" : "bg-[#FF7939]/20"
                                                )} />

                                                {/* Phone 1: Clients List */}
                                                <PhoneMockup type="clients" role="coach" active={coachMockupType === 'clients'} onClick={() => setCoachMockupType('clients')}>
                                                    <div className="px-5 pt-3 pb-2">
                                                        <h3 className="text-[16px] font-black text-white uppercase italic tracking-tighter mt-1 leading-tight">CLIENTES</h3>
                                                    </div>

                                                    <div className="px-3 py-2 space-y-4 flex-1">
                                                        {/* Simple Search Mockup */}
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl border border-white/10">
                                                            <Search size={14} className="text-white/20" />
                                                            <div className="w-full h-2 bg-white/10 rounded-full" />
                                                        </div>

                                                        {/* Client List Mockup */}
                                                        <div className="space-y-2">
                                                            {[
                                                                { name: 'Diego Omnia', plan: 'Pro Fitness', avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&q=80' },
                                                                { name: 'Maru Yoga', plan: 'Advanced', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&q=80' },
                                                                { name: 'Franco Dev', plan: 'Coach Plan', avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&q=80' }
                                                            ].map((c, i) => (
                                                                <div key={i} className="p-3 bg-white/[0.04] border border-white/5 rounded-2xl flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <img src={c.avatar} className="w-10 h-10 rounded-full border border-white/10" alt={c.name} />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[11px] font-black text-white uppercase italic">{c.name}</span>
                                                                            <span className="text-[8px] text-[#FF7939] uppercase font-bold tracking-widest">{c.plan}</span>
                                                                        </div>
                                                                    </div>
                                                                    <ChevronRight size={14} className="text-white/20" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PhoneMockup>

                                                {/* Phone 2: Coach Profile */}
                                                <PhoneMockup type="profile" role="coach" active={coachMockupType === 'profile'} onClick={() => setCoachMockupType('profile')}>
                                                    <div className="px-3 pt-3 space-y-4">
                                                        {/* Hero Profile Card - Reference Identical */}
                                                        <div className="relative rounded-[32px] overflow-hidden bg-[#0F0F0F] border border-white/10 shadow-2xl min-h-[220px] flex flex-col items-center">
                                                            {/* Background Blurred Image - Large Vertical Coverage */}
                                                            <div className="absolute inset-x-0 -top-20 -bottom-10 z-0">
                                                                <img src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&q=80" alt="Boca" className="w-full h-full object-cover opacity-30 blur-[40px]" />
                                                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0F0F0F]" />
                                                            </div>

                                                            <div className="relative z-10 w-full p-4 flex flex-col items-center text-center">
                                                                <div className="w-full flex justify-between items-start mb-2">
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full border border-white/10 backdrop-blur-xl">
                                                                        <Flame size={12} className="text-[#FF7939] fill-[#FF7939]" />
                                                                        <span className="text-[12px] font-black text-white italic">6</span>
                                                                    </div>
                                                                    <div className="p-2 rounded-xl bg-black/40 text-[#FF7939] border border-white/10"><Edit2 size={14} /></div>
                                                                </div>

                                                                <div className="w-20 h-20 rounded-full border-2 border-[#FF7939]/30 overflow-hidden bg-zinc-900 shadow-2xl mb-3 mt-1 scale-110">
                                                                    <img src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&q=80" alt="Franco" className="w-full h-full object-cover" />
                                                                </div>

                                                                <h5 className="text-[18px] font-black text-white italic tracking-tighter leading-none uppercase">Franco Pomati coach</h5>

                                                                <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-white/60 italic uppercase tracking-tighter">
                                                                    <div className="flex items-center gap-1.5"><Star size={11} className="fill-[#FF7939] text-[#FF7939]" /><span className="text-white">4.3</span></div>
                                                                    <span>1 ventas</span>
                                                                    <div className="flex items-center gap-1.5"><Award size={11} className="text-white/20" /><span>1 cert.</span></div>
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-2 text-[10px] font-black text-white/30 italic uppercase">
                                                                    <MapPin size={10} /> CABA <div className="w-1 h-1 rounded-full bg-white/10 mx-1" /> 26 años
                                                                </div>

                                                                <p className="text-[10px] font-bold text-white/50 px-4 mt-3 leading-relaxed">Profesional de futbol, preparador fisico de Boca Juniors.</p>

                                                                <div className="flex gap-2 mt-4 justify-center flex-wrap px-2">
                                                                    {['General', 'Futbol', 'Fitness General', 'CrossFit'].map((s, i) => (
                                                                        <div key={i} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[8px] font-black text-white/60 uppercase italic tracking-widest">{s}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Earnings Card - Segmented Single Bar - Photo Identical */}
                                                        <div className="bg-[#0D0D0F] border border-white/5 rounded-[32px] p-8 shadow-2xl space-y-6">
                                                            <div className="flex justify-center relative">
                                                                <div className="text-center flex flex-col items-center">
                                                                    <span className="text-[48px] font-black text-[#FF7939] tracking-tighter leading-none italic">$850</span>
                                                                    <div className="flex flex-col items-center gap-1 mt-2">
                                                                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest italic leading-none">Ganancia Bruta: $1.000</div>
                                                                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest italic leading-none">Suscripción: -$12.000</div>
                                                                    </div>
                                                                </div>
                                                                <div className="absolute right-0 top-1 p-2">
                                                                    <Printer size={18} className="text-[#FF7939]" />
                                                                </div>
                                                            </div>

                                                            <div className="h-[2px] w-full bg-white/5" />

                                                            {/* Single Segmented Bar */}
                                                            <div className="relative pt-2">
                                                                <div className="h-10 w-full bg-[#FF7939] rounded-2xl overflow-hidden flex shadow-[0_0_30px_rgba(255,121,57,0.15)]">
                                                                    <div className="h-full bg-[#FF7939] flex items-center justify-center min-w-[100%]">
                                                                        <span className="text-[14px] font-[1000] text-black italic uppercase">1k</span>
                                                                    </div>
                                                                    {/* Simulated segments - they are stacked or very fine */}
                                                                    <div className="absolute inset-y-0 left-[60%] w-0.5 bg-black/20" />
                                                                    <div className="absolute inset-y-0 left-[85%] w-0.5 bg-black/20" />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/5">
                                                                {[
                                                                    { icon: BookOpen, label: 'Programas', color: '#FF7939' },
                                                                    { icon: Users, label: 'Talleres', color: '#FFB940' },
                                                                    { icon: FileText, label: 'Documentos', color: '#D1664C' },
                                                                    { icon: MessageSquare, label: 'Consultas', color: '#FF7939' }
                                                                ].map((item, i) => (
                                                                    <div key={i} className="flex flex-col items-center gap-2">
                                                                        <div
                                                                            className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 transition-all text-white/40"
                                                                        >
                                                                            <item.icon size={18} />
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-white/30 uppercase italic">{item.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Stats Footer Mockup - Cleaned up */}
                                                        <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5 flex flex-col gap-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12px] font-black text-white/60 uppercase italic tracking-tighter">Estadísticas</span>
                                                                <SlidersHorizontal size={14} className="text-white/20" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PhoneMockup>
                                            </div>
                                        </div>

                                        {/* 2. MacBook Integrated Experience (Desktop) */}
                                        <div className="space-y-12">
                                            <div className="text-center space-y-3">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                                    <Monitor size={12} className="text-blue-400" />
                                                    <span className="text-[10px] font-black text-blue-400 uppercase italic">Tu Centro de Operaciones</span>
                                                </div>
                                                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Omnia Desktop <br /><span className="text-white/30 text-xl tracking-normal lowercase">gestión en gran pantalla.</span></h3>
                                                <p className="text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
                                                    Administrá todos tus alumnos, programas y finanzas con una interfaz de escritorio potente y centrada en la productividad.
                                                </p>
                                            </div>

                                            <div className="flex justify-center relative w-full px-2 md:px-8 overflow-hidden pt-10">
                                                {/* MacBook Base Proportional Container */}
                                                <div className="w-full max-w-[1400px] relative group/macbook">
                                                    {/* MacBook Screen */}
                                                    <div className="w-full aspect-[16/10] bg-[#0a0a0a] rounded-t-[24px] border-[8px] md:border-[12px] border-[#1a1a1a] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
                                                        {/* Camera Hole */}
                                                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/80 rounded-full border border-white/5 z-50" />

                                                        {/* Mock Desktop Content */}
                                                        <div className="h-full flex flex-col bg-[#050505]">
                                                            {/* Desktop Top Header */}
                                                            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-10 w-full overflow-hidden">
                                                                <div className="flex items-center gap-3 w-1/3">
                                                                    <X size={16} className="text-white/60 cursor-pointer hover:text-white" />
                                                                    <span className="text-white font-black italic tracking-tighter text-[13px] uppercase">Planificación</span>
                                                                </div>
                                                                <div className="flex justify-center w-1/3">
                                                                    <span className="text-[#FF7939] font-black uppercase italic tracking-[0.2em] text-[15px]">omnia</span>
                                                                </div>
                                                                <div className="flex items-center justify-end gap-1.5 w-1/3">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                    <div className="w-6 h-1.5 rounded-full bg-[#FF7939]" />
                                                                </div>
                                                            </div>

                                                            {/* Sidebar & Main Content Mockup */}
                                                            <div className="flex-1 flex overflow-hidden">
                                                                {/* Sidebar: Ejercicios List - Point Identical */}
                                                                <div className="w-[22%] border-r border-white/5 bg-black/60 flex flex-col shrink-0">
                                                                    <div className="p-6 pb-2 space-y-6 flex-1 overflow-y-auto hide-scrollbar">
                                                                        <div className="flex flex-col gap-6 mb-8">
                                                                            <span className="text-[22px] font-[1000] text-white uppercase italic tracking-tighter leading-none">Ejercicios</span>
                                                                            <div className="relative">
                                                                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Buscar..."
                                                                                    className="w-full bg-[#050505] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[12px] text-white/40 placeholder:text-white/5 outline-none focus:border-white/10 transition-all font-black italic uppercase"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {[
                                                                            { n: 'Circuito de escalera de...', c: 'FUNCIONAL', k: '70', m: '15', s: '0kg - 0r - 1s', color: '#E17B3C' },
                                                                            { n: 'Yoga restaurativo', c: 'MOVILIDAD', k: '38', m: '20', s: '0kg - 0r - 1s', color: '#888' },
                                                                            { n: 'Rotaciones de torso con...', c: 'FUNCIONAL', k: '40', m: '9', s: '0kg - 0r - 1s', color: '#E17B3C' },
                                                                            { n: 'Press militar con barra', c: 'FUERZA', k: '85', m: '11', s: '0kg - 0r - 1s', color: '#FFB940' },
                                                                            { n: 'Mountain climbers', c: 'HIIT', k: '55', m: '6', s: '0kg - 0r - 1s', color: '#D1664C' },
                                                                            { n: 'Peso muerto con kettle...', c: 'FUERZA', k: '90', m: '11', s: '0kg - 0r - 1s', color: '#FFB940' }
                                                                        ].map((ex, i) => (
                                                                            <div key={i} className="p-5 rounded-[32px] border border-white/5 bg-white/[0.015] flex flex-col gap-4 relative group hover:bg-white/[0.03] transition-all">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="w-2.5 h-2.5 rounded-full bg-white/20 mt-1.5" />
                                                                                    <div className="flex-1 space-y-2.5">
                                                                                        <div className="text-[13px] font-[1000] text-white italic tracking-tighter leading-tight uppercase">{ex.n}</div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[8px] px-2.5 py-1 rounded-lg bg-white/5 text-white/30 font-black tracking-widest uppercase italic border border-white/5">{ex.c}</span>
                                                                                            <span className="text-[8px] text-white/20 font-black uppercase tracking-widest italic">{ex.s}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-5 pl-6">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Flame size={10} className="text-[#FF7939] fill-[#FF7939]/20" />
                                                                                        <span className="text-[10px] font-black text-[#FF7939] leading-none uppercase italic">{ex.k} kcal</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Clock size={10} className="text-blue-400" />
                                                                                        <span className="text-[10px] font-black text-blue-400 leading-none uppercase italic">{ex.m}m</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {/* Sidebar Footer */}
                                                                    <div className="p-6 border-t border-white/5 shrink-0">
                                                                        <div className="flex items-center gap-2 px-5 py-3 w-fit bg-white/5 rounded-2xl border border-white/10 opacity-70 cursor-pointer hover:opacity-100 transition-all">
                                                                            <ChevronLeft size={16} className="text-white/60" />
                                                                            <span className="text-[12px] font-black italic uppercase text-white/60 tracking-tighter">Atrás</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Main: Planning Board - Photo Identical */}
                                                                <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
                                                                    {/* Summary Header - Photo Identical */}
                                                                    <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-2xl">
                                                                        <div className="flex items-center gap-14">
                                                                            <span className="text-[32px] font-[1000] text-white italic uppercase tracking-tighter">RESUMEN</span>

                                                                            <div className="flex items-center gap-4">
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em] italic leading-tight">REPETIR</span>
                                                                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em] italic leading-tight">CICLO</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 px-5 py-2 bg-black/80 rounded-full border border-white/5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]">
                                                                                    <div className="w-5 h-5 flex items-center justify-center text-[16px] text-white/30 hover:text-white cursor-pointer transition-all">-</div>
                                                                                    <span className="text-[16px] font-[1000] text-[#FF7939] italic mx-1">2x</span>
                                                                                    <div className="w-5 h-5 flex items-center justify-center text-[16px] text-white/30 hover:text-white cursor-pointer transition-all">+</div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex gap-4">
                                                                                {[
                                                                                    { l: 'SEMANAS', v: '4/4' },
                                                                                    { l: 'SESIONES', v: '24/28' },
                                                                                    { l: 'EJERCICIOS', v: '92' },
                                                                                    { l: 'ÚNICOS', v: '9' }
                                                                                ].map((s, i) => (
                                                                                    <div key={i} className="flex flex-col items-center gap-2">
                                                                                        <span className="text-[8px] text-white/10 uppercase font-black tracking-[0.2em] italic">{s.l}</span>
                                                                                        <div className="px-5 py-2.5 bg-black/80 rounded-full min-w-[70px] flex items-center justify-center border border-white/5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]">
                                                                                            <span className="text-[15px] font-[1000] text-white italic tracking-tighter">{s.v}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-8">
                                                                            <div className="flex flex-col items-end">
                                                                                <span className="text-[7px] font-black text-white/5 uppercase tracking-[0.5em] italic">CONTROL DE SEMANAS</span>
                                                                                <div className="flex items-center gap-2.5 mt-2">
                                                                                    <div className="w-7 h-7 rounded-full bg-[#FF7939] border border-black flex items-center justify-center text-black font-[1000] text-[11px] italic shadow-[0_0_15px_rgba(255,121,57,0.3)]">1</div>
                                                                                    {[2].map(n => <div key={n} className="w-7 h-7 rounded-full border border-white/5 bg-black flex items-center justify-center text-white/20 text-[11px] font-black italic hover:text-white/40 transition-all cursor-pointer">{n}</div>)}
                                                                                    <div className="w-7 h-7 rounded-full border border-white/5 bg-black flex items-center justify-center text-white/20 hover:text-white/40 transition-all cursor-pointer"><PlusCircle size={12} /></div>
                                                                                    <div className="w-7 h-7 rounded-full border border-white/5 bg-black flex items-center justify-center text-white/20 hover:text-white/40 transition-all ml-1 cursor-pointer"><X size={12} /></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Planning Grid - Photo Identical to Actual App */}
                                                                    <div className="flex-1 overflow-x-auto hide-scrollbar p-6">
                                                                        <div className="min-w-[800px] h-full bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                                                                            <div
                                                                                className="grid gap-0"
                                                                                style={{
                                                                                    gridTemplateColumns: `85px repeat(7, 1fr)`
                                                                                }}
                                                                            >
                                                                                {/* Headers de días */}
                                                                                <div className="h-14"></div>
                                                                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, di) => {
                                                                                    const cals = di === 2 ? 910 : di === 3 ? 220 : di === 4 ? 260 : 233;
                                                                                    const time = di === 2 ? 99 : di === 3 ? 28 : di === 4 ? 37 : 55;
                                                                                    return (
                                                                                        <div key={di} className="flex flex-col items-center justify-end h-14 pb-2">
                                                                                            <div className="flex flex-col items-center gap-0.5 mb-2">
                                                                                                <div className="bg-[#FF7939]/10 text-[#FF7939] px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-sm">
                                                                                                    <Flame size={9} /> {cals}
                                                                                                </div>
                                                                                                <div className="bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-sm">
                                                                                                    <Clock size={9} /> {time}m
                                                                                                </div>
                                                                                            </div>
                                                                                            <span className="text-[11px] text-white font-black">{d}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}

                                                                                {/* Contenido de la grilla */}
                                                                                {[
                                                                                    {
                                                                                        type: 'FUNCIONAL', hex: '#E17B3C', soft: '#E17B3C22', exercises: [
                                                                                            ['Circuito de escalera d...', 'Rotaciones de torso c...'],
                                                                                            ['Circuito de escalera d...', 'Rotaciones de torso c...'],
                                                                                            ['Circuito de escalera d...'],
                                                                                            ['Plancha con toques d...'],
                                                                                            ['Plancha con toques d...', 'Rotaciones de torso c...'],
                                                                                            ['Circuito de escalera d...', 'Rotaciones de torso c...'],
                                                                                            ['Circuito de escalera d...', 'Rotaciones de torso c...'],
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        type: 'FUERZA', hex: '#FFB940', soft: '#FFB94022', exercises: [
                                                                                            ['Press militar con barra'],
                                                                                            ['Press militar con barra'],
                                                                                            ['Hiit fútbol', 'Press con mancuerna...', 'Hiit fútbol', 'Press con mancuerna...'],
                                                                                            ['Remo con banda y man...'],
                                                                                            ['Remo con banda y man...'],
                                                                                            ['Press militar con barra'],
                                                                                            ['Press militar con barra'],
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        type: 'MOVILIDAD', hex: '#A0A0A0', soft: '#A0A0A022', exercises: [
                                                                                            ['Yoga restaurativo'],
                                                                                            ['Yoga restaurativo'],
                                                                                            [],
                                                                                            [],
                                                                                            [],
                                                                                            ['Yoga restaurativo'],
                                                                                            ['Yoga restaurativo'],
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        type: 'HIIT', hex: '#D1664C', soft: '#D1664C22', exercises: [
                                                                                            [],
                                                                                            [],
                                                                                            [],
                                                                                            ['Burpees explosivos'],
                                                                                            ['Burpees explosivos'],
                                                                                            [],
                                                                                            [],
                                                                                        ]
                                                                                    }
                                                                                ].map(row => (
                                                                                    <React.Fragment key={row.type}>
                                                                                        <div className="py-2 pr-2 flex items-center">
                                                                                            <span className="px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter w-full shadow-sm text-center" style={{ color: row.hex, borderColor: row.hex + '33', backgroundColor: row.soft }}>{row.type}</span>
                                                                                        </div>
                                                                                        {row.exercises.map((dayExercises, di) => {
                                                                                            const count = dayExercises.length;
                                                                                            return (
                                                                                                <div
                                                                                                    key={di}
                                                                                                    className={`m-1 min-h-[75px] p-2 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden ${count > 0 ? 'bg-white/[0.03] border-white/10 shadow-inner' : 'border-dashed border-white/5'}`}
                                                                                                >
                                                                                                    {count > 0 && (
                                                                                                        <>
                                                                                                            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: row.hex }}></div>
                                                                                                            <div className="flex flex-col gap-1 w-full relative z-10 overflow-hidden px-0.5">
                                                                                                                {dayExercises.map((ex, idx) => (
                                                                                                                    <div
                                                                                                                        key={idx}
                                                                                                                        className="text-[9.5px] leading-[1.1] font-black uppercase truncate w-full px-1.5 py-1 rounded shadow-sm italic tracking-tighter text-center"
                                                                                                                        style={{
                                                                                                                            backgroundColor: row.soft,
                                                                                                                            color: row.hex,
                                                                                                                            border: `1px solid ${row.hex}44`
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        {ex}
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </React.Fragment>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Footer Mockup */}
                                                                    <div className="mt-auto px-6 py-6 pb-2 flex justify-end items-center relative z-20">
                                                                        <div className="flex items-center gap-4 px-8 py-3.5 bg-transparent border border-[#FF7939]/30 rounded-2xl group cursor-pointer transition-all hover:bg-[#FF7939]/10">
                                                                            <span className="text-[13px] font-[1000] text-[#FF7939] italic uppercase tracking-tighter">Siguiente</span>
                                                                            <ChevronRight size={16} className="text-[#FF7939] group-hover:translate-x-1 transition-transform" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Desktop Footer Nav */}
                                                            <div className="h-[60px] w-full px-8 bg-[#060606] border-t border-white/5 flex justify-center items-center">
                                                                <div className="flex items-center justify-center gap-12 sm:gap-24 w-full h-full opacity-60">
                                                                    <Users size={18} />
                                                                    <ShoppingBag size={18} />
                                                                    <div className="w-10 h-10 bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-full flex items-center justify-center">
                                                                        <Flame size={18} className="text-[#FF7939]" />
                                                                    </div>
                                                                    <Calendar size={18} />
                                                                    <User size={18} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MacBook Stand / Base */}
                                                <div className="relative z-10 w-[104%] ml-[-2%] h-[12px] md:h-[16px] bg-gradient-to-b from-[#3f3f46] via-[#27272a] to-[#18181b] rounded-b-[16px] md:rounded-b-[24px] shadow-[0_30px_60px_rgba(0,0,0,1)] -mt-1 flex justify-center border-t border-[#111]">
                                                    {/* Opening Lip */}
                                                    <div className="w-[120px] md:w-[150px] h-[6px] md:h-[8px] bg-[#09090b] rounded-b-[6px] md:rounded-b-[8px] border-x border-b border-black/40 shadow-inner" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 flex justify-center">
                                            <Button className="bg-[#FF7939] text-black hover:bg-[#FF7939]/90 rounded-full px-12 py-7 h-auto text-[11px] font-black italic uppercase shadow-[0_0_50px_rgba(255,121,57,0.2)] border-none flex items-center gap-3 group">
                                                Crear mi perfil Coach <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

