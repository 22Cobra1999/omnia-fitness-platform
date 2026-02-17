"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, UtensilsCrossed, Lock, Monitor, Users, ChevronRight } from 'lucide-react'
import { ProgramSubType, DeliveryModality } from '../product-constants'
import { Switch } from '@/components/ui/switch'

interface StepProgramTypeProps {
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
}

export const StepProgramType: React.FC<StepProgramTypeProps> = ({
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
    onChangeLocationUrl
}) => {
    return (
        <div className="space-y-8 max-w-xl mx-auto py-4">
            {/* Categoría */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white px-2">¿En qué categoría se enfoca tu producto?</h2>
                <div className="flex gap-4 px-2">
                    <button
                        onClick={() => onSelectCategory('fitness')}
                        className={`flex-1 py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 font-black transition-all duration-300 backdrop-blur-md ${selectedCategory === 'fitness'
                            ? 'border-[#FF7939] bg-[#FF7939]/15 text-white shadow-[0_0_20px_rgba(255,121,57,0.15)] ring-1 ring-[#FF7939]/30'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                            }`}
                    >
                        <div className={`p-2 rounded-lg ${selectedCategory === 'fitness' ? 'bg-[#FF7939]/20' : 'bg-white/5'}`}>
                            <Flame className={`h-6 w-6 ${selectedCategory === 'fitness' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                        </div>
                        <span className="text-xs uppercase tracking-widest">Fitness</span>
                    </button>
                    <button
                        onClick={() => onSelectCategory('nutrition')}
                        className={`flex-1 py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 font-black transition-all duration-300 backdrop-blur-md ${selectedCategory === 'nutrition'
                            ? 'border-[#FF7939] bg-[#FF7939]/15 text-white shadow-[0_0_20px_rgba(255,121,57,0.15)] ring-1 ring-[#FF7939]/30'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                            }`}
                    >
                        <div className={`p-2 rounded-lg ${selectedCategory === 'nutrition' ? 'bg-[#FF7939]/20' : 'bg-white/5'}`}>
                            <UtensilsCrossed className={`h-6 w-6 ${selectedCategory === 'nutrition' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                        </div>
                        <span className="text-xs uppercase tracking-widest">Nutrición</span>
                    </button>
                </div>
            </div>

            {/* Visibilidad */}
            <div className="px-2">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <Lock className="h-5 w-5 text-[#FF7939]" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Visibilidad</h3>
                            <p className="text-xs text-gray-500 max-w-[180px]">Privado: luego se comparte por link de invitación.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-400">Privado</span>
                        <Switch
                            checked={isPrivate}
                            onCheckedChange={onTogglePrivate}
                        />
                    </div>
                </div>
            </div>

            {/* Modalidad */}
            <div className="space-y-4 px-2">
                <div>
                    <h3 className="text-base font-bold text-white">Modalidad</h3>
                    <p className="text-xs text-gray-500">Cómo lo recibe tu cliente.</p>
                </div>

                <div className="grid gap-4">
                    <button
                        onClick={() => onSelectModality('online')}
                        className={`p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${modality === 'online'
                            ? 'border-[#FF7939] bg-[#FF7939]/10 ring-1 ring-[#FF7939]/30 shadow-[0_0_20px_rgba(255,121,57,0.1)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${modality === 'online' ? 'bg-[#FF7939]/20' : 'bg-white/5 border border-white/5'}`}>
                                <Monitor className={`h-6 w-6 ${modality === 'online' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white tracking-wide">100% Online</h4>
                                <p className="text-xs text-gray-500">Acceso desde Omnia.</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelectModality('presencial')}
                        className={`p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${modality === 'presencial'
                            ? 'border-[#FF7939] bg-[#FF7939]/10 ring-1 ring-[#FF7939]/30 shadow-[0_0_20px_rgba(255,121,57,0.1)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${modality === 'presencial' ? 'bg-[#FF7939]/20' : 'bg-white/5 border border-white/5'}`}>
                                <Users className={`h-6 w-6 ${modality === 'presencial' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white tracking-wide">Presencial</h4>
                                <p className="text-xs text-gray-500">Se realiza en persona.</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelectModality('hibrido')}
                        className={`p-5 rounded-2xl border text-left transition-all duration-300 backdrop-blur-md ${modality === 'hibrido'
                            ? 'border-[#FF7939] bg-[#FF7939]/10 ring-1 ring-[#FF7939]/30 shadow-[0_0_20px_rgba(255,121,57,0.1)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${modality === 'hibrido' ? 'bg-[#FF7939]/20' : 'bg-white/5 border border-white/5'}`}>
                                <Monitor className={`h-6 w-6 ${modality === 'hibrido' ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white tracking-wide">Híbrido</h4>
                                <p className="text-xs text-gray-500">Sesiones presenciales y online.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Campos adicionales para Presencial o Híbrido */}
            {(modality === 'presencial' || modality === 'hibrido') && (
                <div className="space-y-4 px-2">
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Nombre Ubicación</label>
                            <input
                                value={locationName}
                                onChange={(e) => onChangeLocationName(e.target.value)}
                                placeholder="Ej: Gimnasio Central, Parque..."
                                className="w-full bg-[#0A0A0A] border-white/10 text-white h-12 rounded-xl focus:border-[#FF7939]/50 transition-all px-4 outline-none border"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Link Google Maps</label>
                            <input
                                value={locationUrl}
                                onChange={(e) => onChangeLocationUrl(e.target.value)}
                                placeholder="https://maps.google.com/..."
                                className="w-full bg-[#0A0A0A] border-white/10 text-white h-12 rounded-xl focus:border-[#FF7939]/50 transition-all px-4 outline-none border"
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Créditos del Coach */}
            <div className="px-2">
                <div className="p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <Users className="h-5 w-5 text-[#FF7939]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Sesiones Meet</h3>
                                <p className="text-xs text-gray-500">Créditos que ofrece el coach.</p>
                                <p className="text-[10px] text-[#FF7939] font-bold mt-0.5">1 crédito equivale a una Meet de 15 minutos</p>
                            </div>
                        </div>
                        <Switch
                            checked={includedMeetCredits > 0}
                            onCheckedChange={(checked) => onUpdateMeetCredits(checked ? 1 : 0)}
                        />
                    </div>

                    {includedMeetCredits > 0 && (
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                            <span className="text-sm text-gray-400">Cantidad de créditos</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onUpdateMeetCredits(Math.max(1, includedMeetCredits - 1))}
                                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white"
                                >-</button>
                                <span className="text-lg font-bold text-white w-4 text-center">{includedMeetCredits}</span>
                                <button
                                    onClick={() => onUpdateMeetCredits(includedMeetCredits + 1)}
                                    className="w-8 h-8 rounded-lg bg-[#FF7939]/20 text-[#FF7939] flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
