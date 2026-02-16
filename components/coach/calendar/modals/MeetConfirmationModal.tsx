import React, { useState, useMemo } from 'react'
import { format, addMinutes, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Clock, Calendar, User, Send, Search, BadgeDollarSign, CreditCard, Info } from 'lucide-react'

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
        isFree: boolean
        price: number | null
    }) => Promise<void>
    availableClients?: Array<{
        id: string
        full_name?: string
        name?: string
        avatar_url?: string
        meet_credits_available?: number
    }>
    isRescheduling?: boolean
    originalMeet?: {
        title: string
        start_time: string
        end_time: string
        description?: string
        clientIds?: string[]
        isFree?: boolean
        price?: number | string
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
    const [description, setDescription] = useState(originalMeet?.description || '')
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>(originalMeet?.clientIds || [])
    const [isFree, setIsFree] = useState(originalMeet?.isFree ?? true)
    const [price, setPrice] = useState<string>(originalMeet?.price ? String(originalMeet.price) : '')
    const [searchTerm, setSearchTerm] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const startDateTime = parse(startTime, 'HH:mm', selectedDate)
    const endDateTime = addMinutes(startDateTime, durationMinutes)
    const creditsCost = Math.ceil(durationMinutes / 15)

    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return availableClients
        return availableClients.filter(c => {
            const name = c.full_name || c.name || ''
            return name.toLowerCase().includes(searchTerm.toLowerCase())
        })
    }, [availableClients, searchTerm])

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await onConfirm({
                title: title.trim() || 'Meet',
                description: description.trim(),
                clientIds: selectedClientIds,
                isFree,
                price: isFree ? null : Number(price)
            })
            onClose()
        } catch (error) {
            console.error('Error in confirmation:', error)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-[340px] bg-zinc-950 border border-white/10 rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header Ultra-Compacto */}
                <div className="px-3.5 py-3 flex items-center justify-between border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FF7939]/10 border border-[#FF7939]/20 flex items-center justify-center text-[#FF7939]">
                            <Calendar size={14} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-white leading-none">
                                {isRescheduling ? 'Reprogramar' : 'Confirmar Meet'}
                            </h2>
                            <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 transition-colors">
                        <X size={16} className="text-white/30" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Time & Credits Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-900 border border-white/5 rounded-xl p-2.5 flex items-center gap-2">
                            <Clock size={14} className="text-white/40" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-white leading-none">
                                    {format(startDateTime, 'HH:mm')} - {format(endDateTime, 'HH:mm')}
                                </span>
                                <span className="text-[9px] text-white/30 font-medium">{durationMinutes} min</span>
                            </div>
                        </div>
                        <div className={`rounded-xl p-2.5 flex items-center gap-2 transition-all ${isFree ? 'bg-white/5 border border-white/5' : 'bg-[#FF7939]/5 border border-[#FF7939]/10'}`}>
                            <CreditCard size={14} className={isFree ? 'text-white/20' : 'text-[#FF7939]'} />
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-bold leading-none ${isFree ? 'text-white/40' : 'text-[#FFB366]'}`}>
                                    {isFree ? 'Sesión Gratis' : `${creditsCost} ${creditsCost === 1 ? 'Crédito' : 'Créditos'}`}
                                </span>
                                <span className={`text-[9px] font-bold uppercase leading-none mt-0.5 ${isFree ? 'text-white/20' : 'text-[#FF7939]/60'}`}>
                                    {isFree ? 'Sin consumo de créditos' : (price && price !== '0' ? `Monto: $${price}` : 'Consumo de créditos')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Selector Tighter */}
                    <div className="bg-white/2 border border-white/5 rounded-xl p-1 flex gap-1 items-center">
                        <button
                            onClick={() => setIsFree(true)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isFree ? 'bg-[#FF7939] text-black shadow-inner shadow-white/20' : 'text-white/30 hover:text-white/50'}`}
                        >
                            Gratis
                        </button>
                        <button
                            onClick={() => setIsFree(false)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!isFree ? 'bg-[#FF7939] text-black shadow-inner shadow-white/20' : 'text-white/30 hover:text-white/50'}`}
                        >
                            Cobrar
                        </button>
                        {!isFree && (
                            <div className="px-2 flex items-center gap-1 border-l border-white/5 ml-1">
                                <span className="text-[10px] font-bold text-[#FFB366]">$</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                    className="w-12 bg-transparent text-[11px] font-bold text-white focus:outline-none placeholder:text-white/10"
                                />
                            </div>
                        )}
                    </div>

                    {/* Title and Notes Combined */}
                    <div className="space-y-2">
                        <div className="relative group">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Tema de la reunión"
                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/30 transition-all font-bold"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] text-white/20 font-bold uppercase tracking-tighter">Título</span>
                            </div>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Notas adicionales (opcional)"
                            rows={1}
                            className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-[11px] text-white/60 placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/20 transition-all resize-none font-medium min-h-[36px]"
                        />
                    </div>

                    {/* Participants Section - Fixed Height to keep modal small */}
                    <div className="flex flex-col bg-white/2 border border-white/5 rounded-xl overflow-hidden px-2 py-2">
                        <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full pl-7 pr-3 py-1.5 bg-zinc-900/50 border border-white/5 rounded-lg text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/20 transition-all font-medium"
                            />
                            {selectedClientIds.length > 0 && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#FF7939] text-black text-[8px] font-bold">
                                    {selectedClientIds.length}
                                </div>
                            )}
                        </div>

                        <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredClients.map((client) => {
                                const isSelected = selectedClientIds.includes(client.id)
                                const hasCredits = (client.meet_credits_available || 0) >= creditsCost
                                return (
                                    <button
                                        key={client.id}
                                        onClick={() => toggleClient(client.id)}
                                        className={`w-full flex items-center gap-2 p-1.5 rounded-lg border transition-all ${isSelected ? 'bg-[#FF7939]/10 border-[#FF7939]/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                                    >
                                        <div className="relative">
                                            {client.avatar_url ? (
                                                <img src={client.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover grayscale-[0.5]" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10">
                                                    <User size={10} className="text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col text-left min-w-0 flex-1">
                                            <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-[#FFB366]' : 'text-white/60'}`}>
                                                {client.full_name || client.name}
                                            </span>
                                            <span className={`text-[8px] font-bold ${hasCredits ? 'text-green-500/60' : 'text-red-400/80'}`}>
                                                Saldo: {client.meet_credits_available || 0} Créditos
                                            </span>
                                        </div>
                                        {isSelected && <div className="w-3 h-3 rounded-full bg-[#FF7939] flex items-center justify-center"><Send size={6} className="text-black ml-0.5" /></div>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Small Legend */}
                    <div className="flex items-start gap-1.5 px-1">
                        <Info size={10} className="text-[#FF7939] flex-shrink-0 mt-0.5 opacity-60" />
                        <p className="text-[8px] text-white/30 leading-tight">
                            Consume créditos o paga por sesión. El saldo insuficiente generará un pago pendiente por la diferencia. (Acepta valor 0 para consumo de créditos).
                        </p>
                    </div>
                </div>

                {/* Footer Compacto */}
                <div className="px-3.5 py-3 border-t border-white/5 flex gap-2 bg-white/2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold text-white/30 hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim() || (!isFree && (price === '' || price === null || Number(price) < 0))}
                        className={`flex-[2] py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${isSubmitting || !title.trim() || (!isFree && (price === '' || price === null || Number(price) < 0)) ? 'bg-white/5 text-white/10 opacity-50 cursor-not-allowed' : 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {isSubmitting ? (
                            <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={12} />
                                <span>{isRescheduling ? 'Reprogramar' : 'Confirmar Meet'}</span>
                            </>
                        )}
                    </button>
                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                `}</style>
            </div>
        </div>
    )
}
