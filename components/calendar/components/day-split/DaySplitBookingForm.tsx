import React from 'react'
import { Clock } from "lucide-react"

interface DaySplitBookingFormProps {
    selectedMeetRequest: any
    setSelectedMeetRequest: (req: any) => void
    rescheduleContext: any
    selectedConsultationType: 'express' | 'puntual' | 'profunda'
    setSelectedConsultationType: (t: 'express' | 'puntual' | 'profunda') => void
    coachConsultations: any
    isDurationValid: (mins: number) => boolean
    selectedMeetRsvpLoading: boolean
    handleConfirm: () => Promise<void>
    isPaidMeetFlow: boolean
}

export function DaySplitBookingForm({
    selectedMeetRequest,
    setSelectedMeetRequest,
    rescheduleContext,
    selectedConsultationType,
    setSelectedConsultationType,
    coachConsultations,
    isDurationValid,
    selectedMeetRsvpLoading,
    handleConfirm,
    isPaidMeetFlow
}: DaySplitBookingFormProps) {
    if (!selectedMeetRequest) {
        return (
            <div className="w-full md:w-1/2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full flex flex-col justify-center">
                    <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
                        <h3 className="text-white/40 font-medium">Seleccioná un horario</h3>
                        <p className="text-white/20 text-sm mt-1">Elige un bloque de la izquierda para continuar.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full md:w-1/2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-semibold text-white mb-4">
                    {rescheduleContext ? 'Reprogramar' : 'Solicitud de Meet'}
                </h3>

                {/* TITLE INPUT */}
                <div className="mb-5">
                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Título</label>
                    <input
                        type="text"
                        value={selectedMeetRequest.title}
                        readOnly={!!rescheduleContext}
                        onChange={(e) => setSelectedMeetRequest((p: any) => p ? ({ ...p, title: e.target.value }) : null)}
                        className={`w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-colors ${rescheduleContext ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Ej: Revisión de técnica"
                    />
                </div>

                {/* DURATION SELECTOR */}
                <div className="mb-5">
                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Duración</label>
                    <div className="grid grid-cols-3 gap-2">
                        {([
                            { id: 'express', label: '15 min', min: 15 },
                            { id: 'puntual', label: '30 min', min: 30 },
                            { id: 'profunda', label: '60 min', min: 60 }
                        ] as const).map((opt) => {
                            const isActive = selectedConsultationType === opt.id
                            const isValid = isDurationValid(opt.min)
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    disabled={!isValid}
                                    onClick={() => setSelectedConsultationType(opt.id)}
                                    className={`
                                        py-2 rounded-lg text-xs font-bold border transition-all
                                        ${isActive
                                            ? 'bg-white text-black border-white shadow-md'
                                            : isValid ? 'bg-transparent text-white/60 border-white/10 hover:border-white/30' : 'opacity-20 cursor-not-allowed border-transparent text-white/20'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* TIME EDITOR */}
                <div className="mb-5">
                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">Horario</label>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-[#FF7939]/50 transition-colors">
                                <Clock className="w-4 h-4 text-[#FF7939]" />
                                <input
                                    type="time"
                                    className="bg-transparent border-none text-white text-sm font-semibold focus:outline-none w-full [color-scheme:dark]"
                                    value={selectedMeetRequest.timeHHMM}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedMeetRequest((p: any) => p ? ({ ...p, timeHHMM: e.target.value }) : null)
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="text-white/30 font-medium">➔</div>
                        <div className="flex-1">
                            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-center gap-2">
                                <span className="text-white/60 text-sm font-medium">
                                    {(() => {
                                        const mins = coachConsultations[selectedConsultationType].time
                                        const [h, m] = selectedMeetRequest.timeHHMM.split(':').map((x: string) => parseInt(x) || 0)
                                        const total = h * 60 + m + mins
                                        const endH = Math.floor(total / 60) % 24
                                        const endM = total % 60
                                        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NOTE */}
                <div className="mb-6">
                    <label className="text-xs text-white/50 font-semibold mb-2 block uppercase tracking-wide">
                        {rescheduleContext ? 'Agregar detalle de cambio' : 'Nota'}
                    </label>
                    <textarea
                        value={selectedMeetRequest.description || ''}
                        onChange={(e) => setSelectedMeetRequest((p: any) => p ? ({ ...p, description: e.target.value }) : null)}
                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-colors resize-none"
                        placeholder="¿Sobre qué te gustaría hablar?"
                    />
                </div>

                {/* ACTION */}
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-white/40 text-center mb-2">
                        Se descontará {isPaidMeetFlow ? 'dinero' : `${Math.ceil(coachConsultations[selectedConsultationType].time / 15)} crédito${Math.ceil(coachConsultations[selectedConsultationType].time / 15) > 1 ? 's' : ''}`} de tu cuenta.
                    </div>
                    <button
                        type="button"
                        disabled={selectedMeetRsvpLoading || !isDurationValid(coachConsultations?.[selectedConsultationType]?.time || 0)}
                        className="w-full py-3 rounded-xl bg-[#FF7939] text-black font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(255,121,57,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
                        onClick={handleConfirm}
                    >
                        {selectedMeetRsvpLoading ? 'Cargando...' : rescheduleContext ? 'Confirmar Cambio' : 'Agendar Meet'}
                    </button>
                </div>
            </div>
        </div>
    )
}
