
import React from 'react'
import { Calendar as CalendarIcon, Clock } from "lucide-react"

interface CalendarSuccessModalProps {
    show: boolean
    onClose: () => void
    data: {
        coachName: string
        duration: number
        date: string
        time: string
        message?: string
    } | null
}

export function CalendarSuccessModal({ show, onClose, data }: CalendarSuccessModalProps) {
    if (!show || !data) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="max-w-sm w-full bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-green-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">¡Solicitud Enviada!</h3>

                    {data.message ? (
                        <p className="text-white/70 text-sm leading-relaxed mb-6">
                            {data.message}
                        </p>
                    ) : (
                        <p className="text-white/70 text-sm leading-relaxed mb-6">
                            Tu solicitud fue enviada a <span className="text-white font-medium">{data.coachName}</span> para un meet de {data.duration} min el día {data.date} a las {data.time} hs.
                        </p>
                    )}

                    <div className="bg-white/5 rounded-xl p-3 mb-6 w-full">
                        <div className="flex items-center gap-3 text-xs text-white/50">
                            <Clock className="w-4 h-4 text-[#FF7939]" />
                            <span>El coach suele responder en promedio en <span className="text-white">2 horas</span>.</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-[#FF7939] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    )
}
