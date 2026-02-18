"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, UtensilsCrossed, Lock, Monitor, Users, ChevronRight, MapPin, Combine } from 'lucide-react'
import { ProgramSubType, DeliveryModality } from '../product-constants'
import { Switch } from '@/components/ui/switch'

interface StepProgramTypeProps {
    selectedType: 'workshop' | 'program' | 'document'
    selectedCategory: ProgramSubType | null
    onSelectCategory: (type: ProgramSubType) => void
    isPrivate: boolean
    onTogglePrivate: (val: boolean) => void
    modality: DeliveryModality
    onSelectModality: (val: DeliveryModality) => void
    includedMeetCredits: number
    onUpdateMeetCredits: (val: number) => void
    onBack: () => void
    locationName: string
    onChangeLocationName: (val: string) => void
    locationUrl: string
    onChangeLocationUrl: (val: string) => void
    workshopMode: 'individual' | 'grupal'
    onSelectWorkshopMode: (val: 'individual' | 'grupal') => void
}

export const StepProgramType: React.FC<StepProgramTypeProps> = ({
    selectedType,
    selectedCategory,
    onSelectCategory,
    isPrivate,
    onTogglePrivate,
    modality,
    onSelectModality,
    includedMeetCredits,
    onUpdateMeetCredits,
    onBack,
    locationName,
    onChangeLocationName,
    locationUrl,
    onChangeLocationUrl,
    workshopMode,
    onSelectWorkshopMode
}) => {
    return (
        <div className="space-y-6 max-w-xl mx-auto py-2">
            {/* Categoría */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold text-white px-2">¿Cuál es la categoría de tu producto?</h2>
                <div className="flex gap-3 px-2">
                    <button
                        onClick={() => onSelectCategory('fitness')}
                        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-3 font-bold transition-all duration-300 ${selectedCategory === 'fitness'
                            ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)] ring-1 ring-[#FF7939]/20'
                            : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:bg-white/10 text-xs uppercase'
                            }`}
                    >
                        <Flame className={`h-4 w-4 ${selectedCategory === 'fitness' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                        <span className="tracking-widest">Fitness</span>
                    </button>
                    <button
                        onClick={() => onSelectCategory('nutrition')}
                        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-3 font-bold transition-all duration-300 ${selectedCategory === 'nutrition'
                            ? 'border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)] ring-1 ring-[#FF7939]/20'
                            : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:bg-white/10 text-xs uppercase'
                            }`}
                    >
                        <UtensilsCrossed className={`h-4 w-4 ${selectedCategory === 'nutrition' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                        <span className="tracking-widest">Nutrición</span>
                    </button>
                </div>
            </div>

            {/* Workshop Mode (Solo para Workshop) */}
            {selectedType === 'workshop' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 px-2"
                >
                    <h3 className="text-base font-bold text-white pl-1">Tipo de Taller</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onSelectWorkshopMode('individual')}
                            className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${workshopMode === 'individual'
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : 'border-white/5 bg-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${workshopMode === 'individual' ? 'bg-[#FF7939]/20' : 'bg-white/5'}`}>
                                    <Users className={`h-4 w-4 ${workshopMode === 'individual' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-sm font-bold ${workshopMode === 'individual' ? 'text-white' : 'text-gray-400'}`}>1 : 1</span>
                                    <span className="text-[10px] text-gray-500 leading-none">Individual</span>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => onSelectWorkshopMode('grupal')}
                            className={`flex-1 p-4 rounded-xl border transition-all duration-300 ${workshopMode === 'grupal'
                                ? 'border-[#FF7939] bg-[#FF7939]/10'
                                : 'border-white/5 bg-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${workshopMode === 'grupal' ? 'bg-[#FF7939]/20' : 'bg-white/5'}`}>
                                    <Combine className={`h-4 w-4 ${workshopMode === 'grupal' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-sm font-bold ${workshopMode === 'grupal' ? 'text-white' : 'text-gray-400'}`}>Grupal</span>
                                    <span className="text-[10px] text-gray-500 leading-none">Varios alumnos</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Modalidad */}
            <div className="space-y-3 px-2">
                <h3 className="text-base font-bold text-white pl-1">Modalidad de entrega</h3>
                <div className="flex gap-2">
                    {[
                        { id: 'online', label: 'Online', icon: Monitor },
                        { id: 'presencial', label: 'Presencial', icon: MapPin },
                        { id: 'hibrido', label: 'Híbrido', icon: Combine }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelectModality(item.id as DeliveryModality)}
                            className={`flex-1 py-3 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 ${modality === item.id
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'
                                }`}
                        >
                            <item.icon className={`h-4 w-4 ${modality === item.id ? 'text-[#FF7939]' : 'text-gray-400'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Campos adicionales para Presencial o Híbrido */}
            {(modality === 'presencial' || modality === 'hibrido') && (
                <div className="px-2">
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                    >
                        <input
                            value={locationName}
                            onChange={(e) => onChangeLocationName(e.target.value)}
                            placeholder="Nombre de la ubicación (Ej: Gym Central)"
                            className="w-full bg-[#0A0A0A] border-white/5 text-white h-10 rounded-xl focus:border-[#FF7939]/50 transition-all px-4 outline-none border text-sm"
                        />
                        <input
                            value={locationUrl}
                            onChange={(e) => onChangeLocationUrl(e.target.value)}
                            placeholder="Link Google Maps"
                            className="w-full bg-[#0A0A0A] border-white/5 text-white h-10 rounded-xl focus:border-[#FF7939]/50 transition-all px-4 outline-none border text-sm"
                        />
                    </motion.div>
                </div>
            )}

            {/* Configuración inferior (Visibilidad y Sesiones) */}
            <div className="grid grid-cols-2 gap-3 px-2">
                {/* Visibilidad */}
                <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                        <Lock className="h-4 w-4 text-[#FF7939]" />
                        <span className="text-xs font-bold text-white">Privado</span>
                    </div>
                    <Switch
                        checked={isPrivate}
                        onCheckedChange={onTogglePrivate}
                        className="scale-75"
                    />
                </div>

                {/* Sesiones Meet */}
                <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                        <Users className="h-4 w-4 text-[#FF7939]" />
                        <span className="text-xs font-bold text-white">Meets</span>
                    </div>
                    <Switch
                        checked={includedMeetCredits > 0}
                        onCheckedChange={(checked) => onUpdateMeetCredits(checked ? 1 : 0)}
                        className="scale-75"
                    />
                </div>
            </div>

            {/* Meet Credits Counter (Si está activo) */}
            {includedMeetCredits > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-2"
                >
                    <div className="flex items-center justify-between bg-[#FF7939]/5 p-3 rounded-xl border border-[#FF7939]/10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-widest">Créditos Meet</span>
                            <span className="text-[9px] text-gray-500">1 crédito = 15 min</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onUpdateMeetCredits(Math.max(1, includedMeetCredits - 1))}
                                className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-sm"
                            >-</button>
                            <span className="text-base font-black text-white w-4 text-center">{includedMeetCredits}</span>
                            <button
                                onClick={() => onUpdateMeetCredits(includedMeetCredits + 1)}
                                className="w-7 h-7 rounded-lg bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/20 flex items-center justify-center font-bold text-sm"
                            >+</button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
