"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Flame, Star, Zap, ShoppingCart, Users, Briefcase, ChevronRight, Play, Utensils } from 'lucide-react'
import { ShowcaseBubble, ShowcaseProgressRing, ShowcaseFeatureCard, ShowcaseIngredients, MockCalendar, ShowcaseShelf, ShowcaseConcept } from './ShowcaseComponents'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { OmniaLogo, OmniaLogoText } from '@/components/shared/ui/omnia-logo'
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { Activity } from "@/types/activity"

export function OmniaShowcase() {
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
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    })

    const logoScale = useTransform(scrollYProgress, [0, 0.1], [1.8, 0.45])
    const logoOpacity = useTransform(scrollYProgress, [0, 0.12, 0.15], [1, 1, 0])
    const logoY = useTransform(scrollYProgress, [0, 0.12], [0, -118])

    // Stepped Tagline movement (more pronounced offsets for a 'stepped' feel)
    const titleY1 = useTransform(scrollYProgress, [0, 0.15], [0, -50])
    const titleY2 = useTransform(scrollYProgress, [0, 0.08, 0.22], [0, 0, -90])
    const titleY3 = useTransform(scrollYProgress, [0, 0.12, 0.28], [0, 0, -130])
    const titleOpacity = useTransform(scrollYProgress, [0, 0.18, 0.35], [1, 1, 0])

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
            <motion.section
                style={{ scale: logoScale, opacity: logoOpacity, y: logoY }}
                className="flex flex-col items-center justify-center py-20 relative pointer-events-none z-[1001]"
            >
                {/* Under-logo shadow for dimension */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/60 blur-xl rounded-full" />

                {/* Shadow at the feet effect */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-[#FF7939]/10 blur-3xl rounded-full" />

                <div className="relative">
                    <OmniaLogoText
                        size="text-6xl"
                        className="drop-shadow-[0_20px_25px_rgba(255,121,57,0.15)] filter"
                    />
                </div>
            </motion.section>

            {/* Scrolling Staggered Title */}
            <motion.div
                style={{ opacity: titleOpacity }}
                className="text-center -mt-10 mb-8 flex flex-col items-center"
            >
                <motion.h1
                    style={{ y: titleY1 }}
                    className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none"
                >
                    La plataforma de
                </motion.h1>
                <motion.h1
                    style={{ y: titleY2 }}
                    className="text-3xl font-black text-[#FF7939] italic uppercase tracking-tighter leading-none"
                >
                    los mejores coaches
                </motion.h1>
                <motion.h1
                    style={{ y: titleY3 }}
                    className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none"
                >
                    que siempre quisiste.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-white/40 text-[10px] font-bold uppercase mt-8 tracking-widest"
                >
                    +10k alumnos reales transformados
                </motion.p>
            </motion.div>

            {/* 1. Feature Previews: Activities & Calendar */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="space-y-12"
            >
                {/* Horizontal Activities Scroll */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest italic">Explorá lo Nuevo</h2>
                        <div className="w-12 h-px bg-white/10" />
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x px-2 items-stretch">
                        <AnimatePresence mode="wait">
                            {isLoadingReal ? (
                                // Quick skeleton
                                [...Array(4)].map((_, i) => (
                                    <div key={`skeleton-${i}`} className="w-64 h-96 bg-white/5 animate-pulse rounded-[32px] border border-white/10 shrink-0" />
                                ))
                            ) : realActivities.length > 0 ? (
                                realActivities.map((act, i) => (
                                    <motion.div
                                        key={`search-${act.id}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="snap-start h-full"
                                    >
                                        <ActivityCard
                                            activity={act}
                                            size="small"
                                            variant="blurred"
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-white/40 text-sm font-bold uppercase py-10 px-4">No hay actividades disponibles actualmente.</div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* New Interactive Concept Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="px-2"
                    >
                        <ShowcaseConcept />
                    </motion.div>
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
