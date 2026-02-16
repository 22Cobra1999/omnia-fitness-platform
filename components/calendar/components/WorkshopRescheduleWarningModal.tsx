import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface WorkshopRescheduleWarningModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    workshopTitle: string
    participantCount: number
}

export function WorkshopRescheduleWarningModal({
    isOpen,
    onClose,
    onConfirm,
    workshopTitle,
    participantCount
}: WorkshopRescheduleWarningModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Reprogramar Taller</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="text-sm text-white/70 leading-relaxed">
                        <p className="mb-3">
                            Estás a punto de reprogramar el taller <span className="font-bold text-white">"{workshopTitle}"</span> que tiene {participantCount} {participantCount === 1 ? 'participante inscripto' : 'participantes inscriptos'}.
                        </p>
                        <p className="mb-3 font-medium text-orange-400">
                            Al reprogramar este taller:
                        </p>
                        <ul className="space-y-2 ml-4 text-white/60">
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>Se notificará automáticamente a todos los participantes</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>Los participantes que no puedan asistir al nuevo horario recibirán devolución de créditos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>Reprogramar con menos de 24hs de anticipación puede impactar tu reputación</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50 leading-relaxed">
                            <span className="font-bold text-white/70">Recordatorio:</span> Los talleres tienen fecha y modalidad predeterminadas acordadas al momento de la compra. Solo reprograma si es necesario.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    )
}
