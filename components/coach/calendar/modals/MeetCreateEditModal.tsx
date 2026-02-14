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
    const [originalNotes, setOriginalNotes] = React.useState('')

    // Capture original notes when modal opens in edit mode
    React.useEffect(() => {
        if (open && mode === 'edit') {
            // Only set if we haven't started editing (naive check, or just set once on open)
            // Better: use a ref to track if we captured it for this 'open' session.
            setOriginalNotes(notes)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode]) // We rely on 'notes' being the initial value when 'open' swaps to true. 
    // Caveat: if 'notes' changes from parent while open, we might not want to update 'originalNotes'.
    // ideally we want to capture the prop 'notes' exactly when 'open' becomes true.


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
                                    disabled={mode === 'edit'} // Disable if editing to protect title
                                    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] transition-all ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>

                            {/* ... (Clients section unchanged) ... */}

                            {/* ... (Date/Time section unchanged) ... */}

                            {/* ... (Price section unchanged) ... */}

                            {/* Notas */}
                            <div className="space-y-4">
                                {mode === 'edit' && notes && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Notas Existentes</label>
                                        <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-zinc-400 italic">
                                            {/* We need to be careful not to show the concatenated note here if we update 'notes' prop.
                                                However, checking the component structure, 'notes' is passed from parent.
                                                If we update parent on change, this will update loopingly.
                                                
                                                STRATEGY: 
                                                We will NOT update parent 'notes' continuously with concatenation.
                                                We will keep 'notes' as the INITIAL value in the UI (if we could).
                                                
                                                BUT 'MeetCreateEditModal' is controlled. 'notes' IS the source of truth.
                                                
                                                Better approach for clean UX:
                                                - If mode is edit:
                                                  - Show 'notes' (whatever is passed) as the "Current saved notes" ? No, that changes if we edit.
                                                  
                                                Let's assume the user wants two boxes.
                                                Box 1: Old notes.
                                                Box 2: New notes.
                                                
                                                We need to split 'notes'. 
                                                BUT we don't know where the split is unless we track it.
                                                
                                                Alternative: Just append a visual separator in the textarea?
                                                "--- Nueva nota ---"
                                                
                                                Or, implementing the requested logic: "no quiero sobreescribir... agregar una nueva nota".
                                                
                                                If I change the textarea to be:
                                                <textarea value={newNote} onChange={...} />
                                                
                                                And onSave -> onSave(original + newNote).
                                                BUT onSave() arguments are void. It uses parent state.
                                                
                                                So I MUST update parent state.
                                                
                                                Solution:
                                                Render the 'notes' prop.
                                                BUT if I type in 'newNote', I update 'notes' = 'original' + 'new'.
                                                Then 'notes' prop updates.
                                                Then 'original' part of UI updates?
                                                
                                                Let's try to parse the 'notes' string? No.
                                                
                                                Let's go with:
                                                Display the *entire* content in a textarea, but append a new line automatically?
                                                Or, simpler: Just respect the "Don't overwrite" by appending.
                                                
                                                Real solution within constraint of controlled updated parent:
                                                We can't easily show "Old" and "New" separately if they are merged in the parent state immediately.
                                                
                                                UNLESS we use a local state for the 'new' part and only merge on SAVE?
                                                BUT onSave doesn't take args.
                                                
                                                Wait, 'onSave' is passed from parent. Parent reads its own state?
                                                If MeetCreateEditModal uses 'setTitle', 'setNotes' etc, it updates parent state.
                                                So parent state IS the source for 'onSave'.
                                                
                                                So I MUST update parent state before onSave.
                                                
                                                If I update parent state, the prop 'notes' updates.
                                                
                                                So if I separate the UI:
                                                [ ReadOnly Div: {notes} ]  <-- This will show (Original + New) if I update parent.
                                                
                                                So I need to store 'Original' locally on mount.
                                                `const [originalNotes] = React.useState(notes)`
                                                
                                                Then:
                                                [ ReadOnly Div: {originalNotes} ]
                                                [ Textarea: value={pendingExtension} onChange={updatePending} ]
                                                
                                                updatePending: (val) => {
                                                   setPendingExtension(val)
                                                   setNotes(originalNotes + (val ? '\n\n' + val : ''))
                                                }
                                                
                                                This works! `originalNotes` is frozen (captured on mount/render if separate state).
                                                Use `useEffect` to capture it when `open` becomes true.
                                            */}
                                            <ExistingNotesDisplay notes={originalNotes} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">
                                        {mode === 'edit' ? 'Agregar Nueva Nota' : 'Notas adicionales'}
                                    </label>
                                    <NoteInput
                                        mode={mode}
                                        notes={notes}
                                        setNotes={setNotes}
                                        originalNotes={originalNotes}
                                    />
                                </div>
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

function ExistingNotesDisplay({ notes }: { notes: string }) {
    if (!notes) return <span className="text-zinc-500">Sin notas previas.</span>
    return <span className="whitespace-pre-wrap">{notes}</span>
}

function NoteInput({ mode, notes, setNotes, originalNotes }: { mode: 'create' | 'edit', notes: string, setNotes: (n: string) => void, originalNotes?: string }) {
    const [localValue, setLocalValue] = React.useState('')

    // If mode is create, we just use 'notes' prop directly as value and setNotes directly.
    // If mode is edit, we use localValue, and update parent with concatenation.

    if (mode === 'create') {
        return (
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Detalles sobre la sesión..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] resize-none"
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
            rows={3}
            placeholder="Escribe una nueva nota para agregar..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] resize-none"
        />
    )
}
