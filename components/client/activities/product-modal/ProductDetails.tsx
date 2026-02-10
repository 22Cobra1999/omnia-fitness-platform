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
        <div className="px-6 space-y-6">
            {/* Title and Coach */}
            <div>
                <h3 className="text-xl font-semibold text-white/85 mb-3">{product.title}</h3>
                <div
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${!navigationContext?.fromCoachProfile ? 'hover:bg-gray-800/50 cursor-pointer' : 'cursor-default opacity-75'}`}
                    onClick={handleCoachClick}
                >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF7939]/50">
                        <Image src={product.coach_avatar_url || '/placeholder.svg'} alt="Coach" width={40} height={40} className="object-cover" />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                        <div>
                            <p className="text-white/80 font-medium">{product.coach_name || product.coach?.name || 'Coach'}</p>
                            {product.coach_experience_years && <p className="text-gray-400 text-xs">{product.coach_experience_years} años de experiencia</p>}
                        </div>
                        <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-white font-medium text-sm">{product.coach_avg_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                    </div>
                    {!navigationContext?.fromCoachProfile && <ChevronRight className="h-4 w-4 text-gray-400" />}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 items-start w-full">
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-2">
                        {product.type === 'document' ? <Zap className="h-5 w-5 text-[#FF7939]" /> : <Calendar className="h-5 w-5 text-[#FF7939]" />}
                        <span className="text-white/60 font-medium">{product.type === 'document' ? 'Temas' : 'Sesiones'}</span>
                    </div>
                    <div className="text-white/75 font-medium">{product.type === 'document' ? (product.items_unicos || 0) : (statsLoading ? '...' : totalSessions)}</div>
                </div>

                <div className={`flex flex-col items-center gap-1 text-center ${exceedsWeeks ? 'border-2 border-red-500 rounded-lg p-1' : ''}`}>
                    <div className="flex items-center gap-2">
                        {product.type === 'document' ? <Calendar className="h-5 w-5 text-[#FF7939]" /> : <Clock className={`h-5 w-5 ${exceedsWeeks ? 'text-red-500' : 'text-[#FF7939]'}`} />}
                        <span className={exceedsWeeks ? 'text-red-500 font-bold' : 'text-white/60 font-medium'}>{product.type === 'document' ? 'Duración' : 'Semanas'}</span>
                    </div>
                    <div className={exceedsWeeks ? 'text-red-500 font-bold' : 'text-white font-semibold'}>
                        {product.type === 'document' ? '-' : (product.type === 'workshop' ? (loadingWorkshopTopics ? '...' : calculateWorkshopWeeks) : (planningStatsLoading ? '...' : weeksCount))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-[#FF7939]" />
                        <span className="text-white/60 font-medium">Ejercicios</span>
                    </div>
                    <div className="text-white font-semibold">{exercisesCount}</div>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="h-5 flex items-center justify-center">
                        {['nutricion', 'nutrition'].includes(product.categoria) ? getDietTypeDisplay(product.dieta) : getDifficultyFires(difficulty)}
                    </div>
                    <div className="text-gray-300 text-sm font-medium h-5">
                        {!['nutricion', 'nutrition'].includes(product.categoria) && (
                            difficulty === 'beginner' ? 'Principiante' : difficulty === 'advanced' ? 'Avanzado' : 'Intermedio'
                        )}
                    </div>
                </div>

                {product.capacity ? (
                    <div className={`flex flex-col items-center gap-1 text-center ${exceedsStock ? 'border-2 border-red-500 rounded-lg p-1' : ''}`}>
                        <div className="flex items-center gap-2">
                            <Users className={`h-5 w-5 ${exceedsStock ? 'text-red-500' : 'text-[#FF7939]'}`} />
                            <span className={exceedsStock ? 'text-red-500 font-bold' : 'text-white/60 font-medium'}>Cupos</span>
                        </div>
                        <div className={exceedsStock ? 'text-red-500 font-bold' : 'text-white font-semibold'}>
                            {parseInt(product.capacity) >= 999 ? 'Ilimitados' : product.capacity}
                        </div>
                    </div>
                ) : <div />}

                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="h-5 flex items-center justify-center"><ModalityIcon className="h-5 w-5 text-white" /></div>
                    <div className="text-gray-300 text-sm font-medium">{productModality === 'online' ? 'Online' : 'Presencial'}</div>
                </div>

                {includedMeetCredits > 0 && (
                    <div className="col-span-3 flex justify-center mt-2">
                        <div className="flex items-center gap-2"><Video className="h-5 w-5 text-rose-100/90" /><span className="text-gray-300">{includedMeetCredits} meets</span></div>
                    </div>
                )}
            </div>

            {/* Goals */}
            {product.objetivos?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {product.objetivos.map((o: string, i: number) => (
                        <span key={i} className="bg-[#FF7939]/20 text-[#FF7939] text-sm px-3 py-1.5 rounded-full border border-[#FF7939]/30 whitespace-nowrap">{o}</span>
                    ))}
                </div>
            )}

            {/* Description */}
            <div>
                <h3 className="text-lg font-medium mb-2 text-white/80">Descripción</h3>
                <div className="text-white/65 font-light leading-relaxed">
                    <p className={!isDescriptionExpanded ? "line-clamp-3" : ""}>{product.description}</p>
                    {product.description?.length > 150 && (
                        <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-[#FF7939] hover:text-[#FF6B00] text-sm mt-2">
                            {isDescriptionExpanded ? 'ver menos' : '...ver más'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
