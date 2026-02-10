import React, { useState } from 'react'
import { format, addMinutes, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Clock, Calendar, User, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MeetConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    startTime: string // "HH:mm"
    durationMinutes: number
    onConfirm: (data: {
        title: string
        description: string
        clientIds: string[]
    }) => Promise<void>
    availableClients?: Array<{
        id: string
        full_name: string
        avatar_url?: string
    }>
    isRescheduling?: boolean
    originalMeet?: {
        title: string
        start_time: string
        end_time: string
    }
    onEditTime?: () => void
}

export function MeetConfirmationModal({
    isOpen,
    onClose,
    selectedDate,
    startTime,
    durationMinutes,
    onConfirm,
    availableClients = [],
    isRescheduling = false,
    originalMeet,
    onEditTime
}: MeetConfirmationModalProps) {
    const [title, setTitle] = useState(originalMeet?.title || 'Meet')
    const [description, setDescription] = useState('')
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    // Calculate end time
    const startDateTime = parse(startTime, 'HH:mm', selectedDate)
    const endDateTime = addMinutes(startDateTime, durationMinutes)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await onConfirm({
                title: title.trim() || 'Meet',
                description: description.trim(),
                clientIds: selectedClientIds
            })
            onClose()
        } catch (error) {
            console.error('Error creating meet:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleClient = (clientId: string) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[28px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                            {isRescheduling ? 'Reprogramar' : 'Confirmar Meet'}
                        </h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                            {isRescheduling ? 'Nuevo horario sugerido' : 'Revisa los detalles'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 -mr-2 -mt-1"
                    >
                        <X className="w-5 h-5 text-white/40" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 pb-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Time Summary */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-[#FF7939] flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white capitalize truncate">
                                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-white/60">
                                    {format(startDateTime, 'HH:mm')} – {format(endDateTime, 'HH:mm')}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-tighter">
                                    {durationMinutes} MIN
                                </span>
                            </div>
                        </div>
                        {onEditTime && (
                            <button
                                onClick={onEditTime}
                                className="ml-auto p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#FF7939] transition-all border border-white/5"
                            >
                                <Clock size={16} />
                            </button>
                        )}
                    </div>

                    {/* Quick Inputs Group */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 block">
                                Título de la reunión
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Evaluación inicial"
                                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/30 focus:bg-white/10 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 block">
                                {isRescheduling ? 'Razón de reprogramación' : 'Notas adicionales'}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={isRescheduling ? 'Explica por qué necesitas reprogramar...' : 'Agrega detalles sobre la meet...'}
                                rows={2}
                                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/30 focus:bg-white/10 transition-all resize-none font-medium"
                            />
                        </div>
                    </div>

                    {/* Client Selector */}
                    {availableClients.length > 0 && (
                        <div>
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-3 block">
                                Participantes
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {availableClients.map((client) => {
                                    const isSelected = selectedClientIds.includes(client.id)
                                    return (
                                        <button
                                            key={client.id}
                                            onClick={() => toggleClient(client.id)}
                                            className={`
                                                flex items-center gap-3 p-2.5 rounded-2xl border transition-all
                                                ${isSelected
                                                    ? 'bg-[#FF7939]/10 border-[#FF7939]/30'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                }
                                            `}
                                        >
                                            <div className="relative">
                                                {client.avatar_url ? (
                                                    <img
                                                        src={client.avatar_url}
                                                        alt={client.full_name}
                                                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                        <User className="w-5 h-5 text-white/20" />
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF7939] border-2 border-zinc-950 flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className={`text-[13px] font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                                    {client.full_name}
                                                </span>
                                                <span className="text-[10px] text-white/30 font-medium">{isSelected ? 'Seleccionado' : 'Toca para invitar'}</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 bg-zinc-950 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 h-12 rounded-2xl text-[13px] font-bold text-white/40 bg-white/5 border border-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim()}
                        className={`
                            flex-[2] h-12 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center gap-2
                            ${isSubmitting || !title.trim()
                                ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                                : 'bg-[#FF7939] text-black hover:opacity-90 shadow-lg shadow-[#FF7939]/10'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={16} />
                                <span>{isRescheduling ? 'Reprogramar' : 'Crear Meet'}</span>
                            </>
                        )}
                    </button>
                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                `}</style>
            </div>
        </div>
    )
}
