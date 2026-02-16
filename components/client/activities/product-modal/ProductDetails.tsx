"use client"

import React from 'react'
import Image from 'next/image'
import { Calendar, Star, ChevronRight, Zap, Clock, Dumbbell, Users, Video, MapPin, UtensilsCrossed, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductDetailsProps {
    product: any
    logic: any
}

export function ProductDetails({ product, logic }: ProductDetailsProps) {
    const {
        handleCoachClick,
        navigationContext,
        totalSessions,
        statsLoading,
        exceedsWeeks,
        calculateWorkshopWeeks,
        loadingWorkshopTopics,
        planningStatsLoading,
        weeksCount,
        exercisesCount,
        difficulty,
        productModality,
        modalityIcon: ModalityIcon,
        exceedsStock,
        includedMeetCredits,
        exceedsActivities,
        isDescriptionExpanded,
        setIsDescriptionExpanded
    } = logic

    const getDifficultyFires = (diff?: string) => {
        switch (diff?.toLowerCase()) {
            case 'beginner': return <Flame className="w-4 h-4 text-orange-300" />
            case 'intermediate': return <div className="flex gap-1"><Flame className="w-4 h-4 text-[#FF7939]" /><Flame className="w-4 h-4 text-[#FF7939]" /></div>
            case 'advanced': return <div className="flex gap-1"><Flame className="w-4 h-4 text-red-500" /><Flame className="w-4 h-4 text-red-500" /><Flame className="w-4 h-4 text-red-500" /></div>
            default: return <Flame className="w-4 h-4 text-orange-300" />
        }
    }

    const getDietTypeDisplay = (diet?: string) => {
        if (!diet) return null
        const friendly = {
            baja_carbohidratos: 'Baja en carbohidratos', keto: 'Keto', paleo: 'Paleo',
            vegana: 'Vegana', vegetariana: 'Vegetariana', mediterranea: 'Mediterránea', balanceada: 'Balanceada'
        }[diet.toLowerCase()] || diet
        return <div className="flex items-center gap-1 text-[#FF7939]"><UtensilsCrossed className="w-4 h-4" /><span className="text-sm font-medium">{friendly}</span></div>
    }

    return (
        <div className="px-6 space-y-5">
            {/* 1. Title - Minimalist and smaller */}
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{product.title}</h2>
            </div>

            {/* 2. Coach Intro - Very compact, below title */}
            <div
                className={`flex items-center space-x-2 py-1 transition-all ${!navigationContext?.fromCoachProfile ? 'hover:opacity-80 cursor-pointer' : 'cursor-default opacity-75'}`}
                onClick={handleCoachClick}
            >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                    <Image src={product.coach_avatar_url || '/placeholder.svg'} alt="Coach" width={24} height={24} className="object-cover" />
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-gray-300 font-bold text-xs">{product.coach_name || product.coach?.name || 'Coach'}</h3>
                    <div className="flex items-center space-x-0.5 opacity-80">
                        <Star className="h-2.5 w-2.5 text-yellow-400 fill-current" />
                        <span className="text-gray-400 font-bold text-[10px]">{product.coach_avg_rating?.toFixed(1) || '-'}</span>
                    </div>
                </div>
                {!navigationContext?.fromCoachProfile && <ChevronRight className="h-3 w-3 text-gray-600" />}
            </div>

            {/* 3. Description - Smaller text */}
            <div>
                <div className="text-gray-400 text-xs font-medium leading-relaxed">
                    <p className={!isDescriptionExpanded ? "line-clamp-2" : ""}>{product.description}</p>
                    {product.description?.length > 100 && (
                        <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-[#FF7939] hover:text-[#FF6B00] text-[10px] mt-1 font-bold uppercase tracking-wider">
                            {isDescriptionExpanded ? 'ver menos' : 'leer más'}
                        </button>
                    )}
                </div>
            </div>

            {/* 4. Stats Grid - Finer borders, more minimalist */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-2 w-full pt-2">
                <div className="flex flex-col gap-0.5 p-2.5">
                    <div className="flex items-center gap-1.5 opacity-60">
                        {product.type === 'document' ? <Zap className="h-3 w-3 text-[#FF7939]" /> : <Calendar className="h-3 w-3 text-[#FF7939]" />}
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{product.type === 'document' ? 'Temas' : 'Sesiones'}</span>
                    </div>
                    <div className="text-white font-black text-sm">{product.type === 'document' ? (product.items_unicos || 0) : (statsLoading ? '...' : totalSessions)}</div>
                </div>

                <div className={`flex flex-col gap-0.5 p-2.5 ${exceedsWeeks ? 'bg-red-500/5 rounded-xl' : ''}`}>
                    <div className="flex items-center gap-1.5 opacity-60">
                        {product.type === 'document' ? <Calendar className="h-3 w-3 text-[#FF7939]" /> : <Clock className={`h-3 w-3 ${exceedsWeeks ? 'text-red-500' : 'text-[#FF7939]'}`} />}
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${exceedsWeeks ? 'text-red-500' : 'text-gray-400'}`}>{product.type === 'document' ? 'Duración' : 'Semanas'}</span>
                    </div>
                    <div className={`font-black text-sm ${exceedsWeeks ? 'text-red-500' : 'text-white'}`}>
                        {product.type === 'document' ? '-' : (product.type === 'workshop' ? (loadingWorkshopTopics ? '...' : calculateWorkshopWeeks) : (planningStatsLoading ? '...' : weeksCount))}
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 p-2.5">
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Dumbbell className="h-3 w-3 text-[#FF7939]" />
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Temas</span>
                    </div>
                    <div className="text-white font-black text-sm">{exercisesCount}</div>
                </div>

                <div className="flex flex-col gap-0.5 p-2.5">
                    <div className="h-3 flex items-center justify-start mb-0.5 opacity-80">
                        {['nutricion', 'nutrition'].includes(product.categoria) ? getDietTypeDisplay(product.dieta) : getDifficultyFires(difficulty)}
                    </div>
                    <div className="text-gray-500 text-[9px] font-bold uppercase tracking-widest h-3 flex items-end">
                        {!['nutricion', 'nutrition'].includes(product.categoria) && (
                            difficulty === 'beginner' ? 'Principiante' : difficulty === 'advanced' ? 'Avanzado' : 'Intermedio'
                        )}
                    </div>
                </div>

                <div className={`flex flex-col gap-0.5 p-2.5 ${exceedsStock ? 'bg-red-500/5 rounded-xl' : ''}`}>
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Users className={`h-3 w-3 ${exceedsStock ? 'text-red-500' : 'text-[#FF7939]'}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${exceedsStock ? 'text-red-500' : 'text-gray-400'}`}>Cupos</span>
                    </div>
                    <div className={`font-black text-sm ${exceedsStock ? 'text-red-500' : 'text-white'}`}>
                        {parseInt(product.capacity) >= 999 ? '∞' : product.capacity}
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 p-2.5">
                    <div className="flex items-center gap-1.5 opacity-60 mb-0.5">
                        <ModalityIcon className="h-3 w-3 text-[#FF7939]" />
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Modalidad</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-white font-black text-[10px] uppercase truncate w-full">
                            {product.location_name || (productModality === 'online' ? 'Online' : 'Presencial')}
                        </div>
                        {(productModality === 'presencial' || productModality === 'hibrido') && product.location_url && (
                            <a
                                href={product.location_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FF7939] hover:text-[#FF7939]/80 text-[9px] font-bold uppercase tracking-widest flex items-center gap-0.5 w-fit"
                            >
                                <MapPin className="h-2 w-2" />
                                Ver
                            </a>
                        )}
                    </div>
                </div>

                {includedMeetCredits > 0 && (
                    <div className="col-span-3 flex justify-center mt-1 bg-[#FF7939]/5 border border-[#FF7939]/10 py-1.5 rounded-lg text-[#FF7939]">
                        <div className="flex items-center gap-2"><Video className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-widest">{includedMeetCredits} meets incluidos</span></div>
                    </div>
                )}
            </div>


            {/* 6. Objetivos / Tags - Finer */}
            {product.objetivos?.length > 0 && (
                <div className="space-y-3 pt-4">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-l-2 border-[#FF7939] pl-3">Objetivos</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.objetivos.map((o: string, i: number) => (
                            <div key={i} className="bg-[#FF7939]/15 border border-[#FF7939]/30 px-2.5 py-0.5 rounded-full">
                                <span className="text-[#FF7939] text-[9px] font-black uppercase tracking-wider">{o}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 7. Restricciones - New section */}
            {product.restricciones?.length > 0 && (
                <div className="space-y-3 pt-4 pb-8">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-l-2 border-[#FF7939] pl-3">Restricciones</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.restricciones.map((r: string, i: number) => (
                            <div key={i} className="bg-[#FF7939]/5 border border-[#FF7939]/10 px-2.5 py-0.5 rounded-full">
                                <span className="text-[#FF7939]/60 text-[9px] font-black uppercase tracking-wider">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
