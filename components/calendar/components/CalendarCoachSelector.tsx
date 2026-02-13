
import React from 'react'
import Image from "next/image"
import { Video, Zap, Utensils, GraduationCap } from "lucide-react"

interface CalendarCoachSelectorProps {
    showCoachRow: boolean
    selectedCoachId: string | null
    coachProfiles: any[]
    meetCreditsByCoachId: Record<string, number>
    handlePickCoachForMeet: (coachId: string) => void
    handleClearCoachForMeet: () => void
    isPaidMeetFlow: boolean
    selectedConsultationType: 'express' | 'puntual' | 'profunda'
    applyConsultationSelection: (type: 'express' | 'puntual' | 'profunda') => void
    coachConsultations: any
}

export function CalendarCoachSelector({
    showCoachRow,
    selectedCoachId,
    coachProfiles,
    meetCreditsByCoachId,
    handlePickCoachForMeet,
    handleClearCoachForMeet,
    isPaidMeetFlow,
    selectedConsultationType,
    applyConsultationSelection,
    coachConsultations
}: CalendarCoachSelectorProps) {

    if (!showCoachRow && !selectedCoachId) return null

    return (
        <div className="mb-3">
            {coachProfiles.length === 0 ? (
                <div className="text-sm text-gray-400">
                    {selectedCoachId ? 'Cargando coach...' : 'No tenés coaches asociados a compras.'}
                </div>
            ) : (
                <div className="flex items-center gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
                    {coachProfiles.map((coach) => {
                        const isSelected = !!selectedCoachId && coach.id === selectedCoachId
                        const isDimmed = !!selectedCoachId && coach.id !== selectedCoachId
                        const availableMeets = meetCreditsByCoachId[coach.id] ?? 0

                        return (
                            <div key={coach.id} className="flex items-center gap-4 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isSelected) {
                                            handleClearCoachForMeet()
                                        } else {
                                            handlePickCoachForMeet(coach.id)
                                        }
                                    }}
                                    className={
                                        `relative py-2.5 px-3 rounded-[20px] border backdrop-blur-md transition-all duration-300 flex flex-col items-center gap-2 active:scale-95 ` +
                                        (isSelected
                                            ? 'bg-white/10 border-white/30 shadow-lg ring-1 ring-[#FF7939]/20'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20')
                                    }
                                >
                                    <div className={
                                        `relative w-11 h-11 rounded-full transition-all duration-300 ` +
                                        (isSelected
                                            ? 'ring-1 ring-[#FF7939] ring-offset-1 ring-offset-zinc-900 scale-105'
                                            : 'ring-1 ring-white/10') +
                                        (isDimmed ? ' opacity-40 grayscale blur-[0.5px]' : '')
                                    }>
                                        <Image
                                            src={coach.avatar_url || '/placeholder.svg?height=160&width=160&query=coach'}
                                            alt={coach.full_name}
                                            fill
                                            className="rounded-full object-cover"
                                            sizes="44px"
                                        />
                                    </div>

                                    <div className="flex flex-col items-center gap-1.5 leading-none">
                                        <div className="relative">
                                            <div className={
                                                `flex items-center justify-center transition-all duration-300 ` +
                                                (isSelected ? 'opacity-100 scale-110' : 'opacity-40')
                                            }>
                                                <Video className="w-3.5 h-3.5 text-[#FF7939]" />
                                            </div>
                                            {availableMeets > 0 && (
                                                <div className="absolute -top-1.5 -right-2 bg-[#FF7939] text-black text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                                                    {availableMeets}
                                                </div>
                                            )}
                                        </div>

                                        <div className={
                                            `text-[9px] font-medium leading-[1.1] text-center max-w-[60px] transition-colors ` +
                                            (isSelected ? 'text-white' : 'text-white/40')
                                        }>
                                            {coach.full_name.split(' ').map((part: string, i: number) => (
                                                <div key={i} className="capitalize">{part.toLowerCase()}</div>
                                            ))}
                                        </div>
                                    </div>
                                </button>

                                {isPaidMeetFlow && isSelected && (
                                    <div className="flex items-center gap-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 ml-1 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <button
                                            type="button"
                                            onClick={() => applyConsultationSelection('express')}
                                            className={
                                                `flex flex-col items-center transition-opacity ` +
                                                (selectedConsultationType === 'express' ? 'opacity-100' : 'opacity-60 hover:opacity-100')
                                            }
                                        >
                                            <Zap className="w-4 h-4 text-[#FF7939]" />
                                            <div className="mt-1 text-white text-[9px] font-bold uppercase tracking-wider">Express</div>
                                            <div className="text-gray-400 text-[8px]">15 min</div>
                                            <div className="mt-0.5 text-[#FF7939] text-[11px] font-bold">${coachConsultations.express.price}</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyConsultationSelection('puntual')}
                                            className={
                                                `flex flex-col items-center transition-opacity ` +
                                                (selectedConsultationType === 'puntual' ? 'opacity-100' : 'opacity-60 hover:opacity-100')
                                            }
                                        >
                                            <Utensils className="w-4 h-4 text-[#FF7939]" />
                                            <div className="mt-1 text-white text-[9px] font-bold uppercase tracking-wider">Puntual</div>
                                            <div className="text-gray-400 text-[8px]">30 min</div>
                                            <div className="mt-0.5 text-[#FF7939] text-[11px] font-bold">${coachConsultations.puntual.price}</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyConsultationSelection('profunda')}
                                            className={
                                                `flex flex-col items-center transition-opacity ` +
                                                (selectedConsultationType === 'profunda' ? 'opacity-100' : 'opacity-60 hover:opacity-100')
                                            }
                                        >
                                            <GraduationCap className="w-4 h-4 text-[#FF7939]" />
                                            <div className="mt-1 text-white text-[9px] font-bold uppercase tracking-wider">Profunda</div>
                                            <div className="text-gray-400 text-[8px]">60 min</div>
                                            <div className="mt-0.5 text-[#FF7939] text-[11px] font-bold">${coachConsultations.profunda.price}</div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
