import React from 'react'
import { Plus, X, User, Search, Trash2, Video, CreditCard } from 'lucide-react'
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

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    )

    const selectedClients = clients.filter(c => selectedClientIds.includes(c.id))

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogPortal>
                <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
                <DialogContent className="max-w-xl bg-zinc-950 border-white/10 p-0 overflow-hidden rounded-3xl gap-0 shadow-2xl">
                    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">
                                {mode === 'create' ? 'Nueva Meet' : 'Editar Meet'}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-zinc-500">
                                {mode === 'create' ? 'Crea una nueva solicitud de reunión con tus clientes.' : 'Modifica los detalles de la reunión programada.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Título/Tema */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Tema de la Meet</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Revisión de progreso"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] transition-all"
                                />
                            </div>

                            {/* Clientes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Integrantes</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {selectedClients.map(client => (
                                        <div key={client.id} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                                            {client.avatar_url ? (
                                                <img src={client.avatar_url} alt={client.name} className="w-5 h-5 rounded-full" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-zinc-500" />
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-white">{client.name}</span>
                                            <button
                                                onClick={() => setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))}
                                                className="text-zinc-500 hover:text-[#FF7939]"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setShowClientPicker(!showClientPicker)}
                                        className="w-8 h-8 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/20 flex items-center justify-center text-[#FF7939] hover:bg-[#FF7939]/20 transition-all font-bold"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {showClientPicker && (
                                    <div className="mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-2 max-h-60 overflow-auto shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="relative mb-2">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type="text"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                placeholder="Buscar cliente..."
                                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            {filteredClients.map(client => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => {
                                                        if (selectedClientIds.includes(client.id)) {
                                                            setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))
                                                        } else {
                                                            setSelectedClientIds([...selectedClientIds, client.id])
                                                        }
                                                    }}
                                                    className={`
                                            w-full flex items-center justify-between p-2 rounded-xl transition-all
                                            ${selectedClientIds.includes(client.id) ? 'bg-[#FF7939]/20 ring-1 ring-[#FF7939]/30' : 'hover:bg-white/5'}
                                        `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {client.avatar_url ? (
                                                            <img src={client.avatar_url} alt={client.name} className="w-8 h-8 rounded-full" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-zinc-500" />
                                                            </div>
                                                        )}
                                                        <div className="text-left">
                                                            <div className="text-xs font-bold text-white leading-none mb-1">{client.name}</div>
                                                            <div className="text-[10px] text-zinc-500 font-medium">{client.meet_credits_available} créditos</div>
                                                        </div>
                                                    </div>
                                                    {selectedClientIds.includes(client.id) && <div className="w-2 h-2 rounded-full bg-[#FF7939]" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fecha y Hora */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Inicio</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Fin</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Precio / Créditos */}
                            <div className="space-y-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-white">Es una meet gratuita?</span>
                                    </div>
                                    <button
                                        onClick={() => setIsFree(!isFree)}
                                        className={`
                                w-12 h-6 rounded-full p-1 transition-all duration-300
                                ${isFree ? 'bg-[#FF7939]' : 'bg-zinc-800'}
                            `}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${isFree ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {!isFree && (
                                    <div className="space-y-2 animate-in fade-in duration-300">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Precio por Meet (ARS)</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="Ej: 5000"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Notas adicionales</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Detalles sobre la sesión..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] resize-none"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3">
                                {mode === 'edit' && onDelete && (
                                    <Button
                                        variant="ghost"
                                        onClick={onDelete}
                                        className="flex-1 h-12 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 font-bold"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Eliminar
                                    </Button>
                                )}
                                <Button
                                    onClick={onSave}
                                    disabled={loading}
                                    className={`flex-1 h-12 rounded-2xl font-bold ${mode === 'edit' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#FF7939] text-black hover:bg-[#FF7939]/90'}`}
                                >
                                    {loading ? 'Procesando...' : mode === 'create' ? 'Crear Solicitud' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
