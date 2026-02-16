import React from 'react'
import { Plus, X, User, Search, Trash2, Video, CreditCard, Clock, Calendar, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogPortal,
    DialogOverlay
} from '@/components/ui/dialog'

interface MeetCreateEditModalProps {
    open: boolean
    onClose: () => void
    mode: 'create' | 'edit'
    loading: boolean
    title: string
    setTitle: (t: string) => void
    notes: string
    setNotes: (n: string) => void
    date: string
    setDate: (d: string) => void
    startTime: string
    setStartTime: (t: string) => void
    endTime: string
    setEndTime: (t: string) => void
    isFree: boolean
    setIsFree: (f: boolean) => void
    price: string
    setPrice: (p: string) => void
    clients: any[]
    selectedClientIds: string[]
    setSelectedClientIds: (ids: string[]) => void
    showClientPicker: boolean
    setShowClientPicker: (s: boolean) => void
    clientSearch: string
    setClientSearch: (s: string) => void
    onSave: () => void
    onDelete?: () => void
}

export function MeetCreateEditModal({
    open,
    onClose,
    mode,
    loading,
    title,
    setTitle,
    notes,
    setNotes,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isFree,
    setIsFree,
    price,
    setPrice,
    clients,
    selectedClientIds,
    setSelectedClientIds,
    showClientPicker,
    setShowClientPicker,
    clientSearch,
    setClientSearch,
    onSave,
    onDelete
}: MeetCreateEditModalProps) {
    const [originalNotes, setOriginalNotes] = React.useState('')

    // Capture original notes when modal opens in edit mode
    React.useEffect(() => {
        if (open && mode === 'edit') {
            setOriginalNotes(notes)
        }
    }, [open, mode])

    const filteredClients = clients.filter(c =>
        (c.full_name || c.name || '').toLowerCase().includes(clientSearch.toLowerCase())
    )

    const selectedClients = clients.filter(c => selectedClientIds.includes(c.id))

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogPortal>
                <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
                <DialogContent className="max-w-xl bg-zinc-950 border border-white/10 p-0 overflow-hidden rounded-[32px] gap-0 shadow-2xl">
                    <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <DialogHeader>
                            <div className="flex items-center justify-between mb-2">
                                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#FF7939]/10 border border-[#FF7939]/20 flex items-center justify-center text-[#FF7939]">
                                        <Video size={20} />
                                    </div>
                                    {mode === 'create' ? 'Nueva Meet' : 'Editar Meet'}
                                </DialogTitle>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <DialogDescription className="text-zinc-500 font-medium">
                                {mode === 'create' ? 'Programa una nueva sesión con tus clientes.' : 'Modifica los detalles de la sesión programada.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8">
                            {/* Título/Tema */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Título de la Meet</label>
                                <div className="group relative">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ej: Revisión Mensual de Objetivos"
                                        disabled={mode === 'edit'}
                                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'}`}
                                    />
                                    {mode === 'edit' && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold uppercase">Solo Lectura</div>}
                                </div>
                            </div>

                            {/* Selección de Clientes */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1 flex justify-between">
                                    Clientes Seleccionados
                                    <span className="text-[#FF7939]">{selectedClientIds.length} seleccionados</span>
                                </label>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedClients.map(client => (
                                        <div key={client.id} className="bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-xl px-3 py-2 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                            {client.avatar_url ? (
                                                <img src={client.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                                                    <User size={10} className="text-white/40" />
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-white">{client.full_name || client.name}</span>
                                            {mode === 'create' && (
                                                <button
                                                    onClick={() => setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))}
                                                    className="hover:text-red-400 text-white/30 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {mode === 'create' && (
                                        <button
                                            onClick={() => setShowClientPicker(!showClientPicker)}
                                            className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 hover:border-[#FF7939]/30 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={14} />
                                            {selectedClientIds.length > 0 ? 'Agregar más' : 'Seleccionar Cliente'}
                                        </button>
                                    )}
                                </div>

                                {showClientPicker && mode === 'create' && (
                                    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-3 border-b border-white/5 bg-white/2 flex items-center gap-3">
                                            <Search size={14} className="text-white/20" />
                                            <input
                                                type="text"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                placeholder="Buscar cliente por nombre..."
                                                className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder:text-white/10 font-medium"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(client => (
                                                    <button
                                                        key={client.id}
                                                        onClick={() => {
                                                            const isSelected = selectedClientIds.includes(client.id)
                                                            if (isSelected) {
                                                                setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))
                                                            } else {
                                                                setSelectedClientIds([...selectedClientIds, client.id])
                                                            }
                                                        }}
                                                        className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all ${selectedClientIds.includes(client.id) ? 'bg-[#FF7939]/20 text-[#FF7939]' : 'hover:bg-white/5 text-white/60'}`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                                                            {client.avatar_url ? (
                                                                <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <User size={14} className="text-white/20" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-bold flex-1 text-left">{client.full_name || client.name}</span>
                                                        {selectedClientIds.includes(client.id) && <Plus size={16} className="rotate-45" />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-white/20 text-xs italic">No se encontraron clientes</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fecha y Hora */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Fecha de la Sesión</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#FF7939] transition-colors" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all hover:border-white/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Horarios</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative group flex-1">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#FF7939] transition-colors" />
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all hover:border-white/20"
                                            />
                                        </div>
                                        <span className="text-white/20 font-bold">a</span>
                                        <div className="relative group flex-1">
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all hover:border-white/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Configuración de Pago */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Configuración de Pago</label>
                                <div className="p-4 bg-white/2 border border-white/5 rounded-[24px] space-y-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsFree(true)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl text-xs font-bold transition-all ${isFree ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isFree ? 'bg-black/10' : 'bg-white/5'}`}>
                                                {isFree ? <Plus size={12} className="rotate-45" /> : null}
                                            </div>
                                            Sesión Gratis
                                        </button>
                                        <button
                                            onClick={() => setIsFree(false)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl text-xs font-bold transition-all ${!isFree ? 'bg-[#FF7939] text-black shadow-lg shadow-[#FF7939]/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${!isFree ? 'bg-black/10' : 'bg-white/5'}`}>
                                                {!isFree ? <CreditCard size={12} /> : null}
                                            </div>
                                            Cobrar Sesión
                                        </button>
                                    </div>

                                    {!isFree && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#FFB366] group-focus-within:scale-110 transition-transform">$</div>
                                                <input
                                                    type="number"
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-5 py-5 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all group-hover:border-white/20"
                                                />
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Monto ARS</span>
                                                    {Number(price) === 0 && <span className="text-[10px] text-[#FFB366] font-black uppercase mt-1">Consumo de Créditos</span>}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-start gap-2 px-1">
                                                <Info size={14} className="text-[#FF7939] flex-shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-white/30 font-medium leading-relaxed italic">
                                                    Consume créditos o paga por sesión. El saldo insuficiente generará un pago pendiente por la diferencia. (Acepta valor 0 para consumo de créditos).
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notas */}
                            <div className="space-y-4">
                                {mode === 'edit' && originalNotes && (
                                    <div className="space-y-3 animate-in fade-in duration-500">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Notas del Historial</label>
                                        <div className="w-full bg-white/2 border border-white/5 rounded-[24px] px-5 py-4 text-xs text-white/40 italic leading-loose whitespace-pre-wrap border-dashed">
                                            {originalNotes}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">
                                        {mode === 'edit' ? 'Añadir Nueva Nota' : 'Observaciones y Notas'}
                                    </label>
                                    <NoteInput
                                        mode={mode}
                                        notes={notes}
                                        setNotes={setNotes}
                                        originalNotes={originalNotes}
                                    />
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-4 pt-4">
                                {mode === 'edit' && onDelete && (
                                    <Button
                                        variant="ghost"
                                        onClick={onDelete}
                                        disabled={loading}
                                        className="h-16 px-6 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-black uppercase tracking-widest text-xs transition-all flex-shrink-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                )}
                                <Button
                                    onClick={onSave}
                                    disabled={loading || !title.trim() || selectedClientIds.length === 0 || (!isFree && price === '')}
                                    className={`flex-1 h-16 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl ${mode === 'edit' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#FF7939] text-black hover:bg-[#FF7939]/90 shadow-[#FF7939]/20 hover:scale-[1.01] active:scale-[0.99]'}`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : mode === 'create' ? (
                                        'Crear Meet'
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </DialogPortal>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </Dialog>
    )
}

function NoteInput({ mode, notes, setNotes, originalNotes }: { mode: 'create' | 'edit', notes: string, setNotes: (n: string) => void, originalNotes?: string }) {
    const [localValue, setLocalValue] = React.useState('')

    if (mode === 'create') {
        return (
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Detalles adicionales, temas a tratar o consignas para el cliente..."
                className="w-full bg-white/5 border border-white/10 rounded-[24px] px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all resize-none hover:border-white/20 font-medium"
            />
        )
    }

    return (
        <textarea
            value={localValue}
            onChange={(e) => {
                const val = e.target.value
                setLocalValue(val)
                setNotes(originalNotes ? (originalNotes + (val ? '\n\n' + val : '')) : val)
            }}
            rows={4}
            placeholder="Escribe aquí para añadir una nueva nota al historial..."
            className="w-full bg-white/5 border border-white/10 rounded-[24px] px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF7939]/50 transition-all resize-none hover:border-white/20 font-medium"
        />
    )
}
