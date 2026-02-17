import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { X, ClipboardList, Search } from "lucide-react"

interface ClientSurveyDialogProps {
    isOpen: boolean
    setIsOpen: (val: boolean) => void
    clientDetail: any
}

export function ClientSurveyDialog({
    isOpen,
    setIsOpen,
    clientDetail
}: ClientSurveyDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md bg-[#0F0F0F] border-zinc-800 text-white rounded-3xl overflow-hidden p-0 max-h-[85vh] flex flex-col shadow-2xl">
                <DialogHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-[#FF7939]" />
                        Onboarding del Cliente
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Detalles de las respuestas a la encuesta de onboarding del cliente.
                    </DialogDescription>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="h-5 w-5 text-zinc-500" />
                    </button>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {clientDetail?.client?.onboarding ? (
                        <>
                            <div className="space-y-4">
                                <h4 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Contexto y Objetivos</h4>
                                <div className="grid gap-3">
                                    {[
                                        { label: 'Nivel de Exigencia', value: clientDetail.client.onboarding.intensity_level, color: 'text-orange-400' },
                                        { label: 'Deseo de Cambio', value: clientDetail.client.onboarding.change_goal, color: 'text-blue-400' },
                                        { label: 'Horizonte Temporal', value: clientDetail.client.onboarding.progress_horizon, color: 'text-purple-400' },
                                        { label: 'Constancia', value: clientDetail.client.onboarding.consistency_level, color: 'text-green-400' },
                                        { label: 'Modalidad', value: clientDetail.client.onboarding.training_modality, color: 'text-white' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-zinc-800/50">
                                            <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">{item.label}</span>
                                            <span className={`text-sm font-bold capitalize ${item.color}`}>{item.value?.replace(/_/g, ' ') || 'No especificado'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Intereses</h4>
                                <div className="flex flex-wrap gap-2">
                                    {clientDetail.client.onboarding.interests?.map((interest: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-bold capitalize border border-orange-500/20">
                                            {interest}
                                        </span>
                                    )) || <span className="text-zinc-600 text-xs italic">Sin intereses declarados</span>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Comentarios Adicionales</h4>
                                <div className="p-4 bg-white/5 rounded-2xl border border-zinc-800/50 italic text-sm text-zinc-300 leading-relaxed">
                                    {clientDetail.client.onboarding.additional_notes || 'El cliente no dejó comentarios adicionales.'}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                <Search className="h-8 w-8 text-zinc-700" />
                            </div>
                            <p className="text-zinc-400 text-sm font-medium">No se encontraron respuestas de onboarding para este cliente.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
