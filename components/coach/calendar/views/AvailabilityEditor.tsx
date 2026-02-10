import React, { useState } from 'react'
import { Clock, Plus, Trash2, Calendar, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AvailabilityRule } from '../../hooks/calendar/useCoachAvailability'

interface AvailabilityEditorProps {
    rules: AvailabilityRule[]
    drafts: Record<string, any>
    isSaving: boolean
    onAddRule: () => void
    onDeleteRule: (id: string) => void
    onUpdateDraft: (id: string, data: any) => void
    onSave: () => void
    onCancel: () => void
}

const WEEKDAYS = [
    { label: 'Dom', value: 0 },
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mié', value: 3 },
    { label: 'Jue', value: 4 },
    { label: 'Vie', value: 5 },
    { label: 'Sáb', value: 6 }
]

const MONTHS = [
    { label: 'Ene', value: 0 }, { label: 'Feb', value: 1 }, { label: 'Mar', value: 2 },
    { label: 'Abr', value: 3 }, { label: 'May', value: 4 }, { label: 'Jun', value: 5 },
    { label: 'Jul', value: 6 }, { label: 'Ago', value: 7 }, { label: 'Sep', value: 8 },
    { label: 'Oct', value: 9 }, { label: 'Nov', value: 10 }, { label: 'Dic', value: 11 }
]

export function AvailabilityEditor({
    rules,
    drafts,
    isSaving,
    onAddRule,
    onDeleteRule,
    onUpdateDraft,
    onSave,
    onCancel
}: AvailabilityEditorProps) {
    const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)

    const toggleDay = (ruleId: string, day: number) => {
        const current = drafts[ruleId]?.days || []
        const next = current.includes(day)
            ? current.filter((d: number) => d !== day)
            : [...current, day]
        onUpdateDraft(ruleId, { days: next })
    }

    const toggleMonth = (ruleId: string, month: number) => {
        const current = drafts[ruleId]?.months || []
        const next = current.includes(month)
            ? current.filter((m: number) => m !== month)
            : [...current, month]
        onUpdateDraft(ruleId, { months: next })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">Gestionar Disponibilidad</h2>
                    <p className="text-sm text-zinc-500">Configura tus horarios para que los clientes puedan agendar Meets.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-white rounded-full">
                        Cancelar
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-[#FF7939] hover:bg-[#FF7939]/90 text-black font-bold rounded-full px-6"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Todo'}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {rules.map((rule) => {
                    const draft = drafts[rule.id] || {
                        start: rule.start,
                        end: rule.end,
                        days: rule.days,
                        months: rule.months || Array.from({ length: 12 }, (_, i) => i)
                    }
                    const isExpanded = expandedRuleId === rule.id

                    return (
                        <div
                            key={rule.id}
                            className={`
                bg-white/5 border border-white/5 rounded-3xl overflow-hidden transition-all duration-300
                ${isExpanded ? 'ring-1 ring-[#FF7939]/30 bg-white/[0.07]' : ''}
              `}
                        >
                            {/* Header de la Regla */}
                            <div
                                className="p-4 sm:p-6 flex items-center justify-between cursor-pointer group"
                                onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[#FF7939]/10 border border-[#FF7939]/20 flex items-center justify-center text-[#FF7939]">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            {draft.start} — {draft.end}
                                            {!isExpanded && (
                                                <span className="text-xs font-medium text-zinc-500 px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                                                    {draft.days.length === 7 ? 'Todos los días' : `${draft.days.length} días`}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 font-medium">
                                            {draft.months?.length === 12 ? 'Todo el año' : `${draft.months?.length} meses seleccionados`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteRule(rule.id)
                                        }}
                                        className="w-10 h-10 rounded-full text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Contenido Expandido */}
                            {isExpanded && (
                                <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Hora Inicio</label>
                                            <input
                                                type="time"
                                                value={draft.start}
                                                onChange={(e) => onUpdateDraft(rule.id, { start: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Hora Fin</label>
                                            <input
                                                type="time"
                                                value={draft.end}
                                                onChange={(e) => onUpdateDraft(rule.id, { end: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#FF7939] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Días de la semana</label>
                                        <div className="flex flex-wrap gap-2">
                                            {WEEKDAYS.map(day => (
                                                <button
                                                    key={day.value}
                                                    onClick={() => toggleDay(rule.id, day.value)}
                                                    className={`
                                    px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border
                                    ${draft.days.includes(day.value)
                                                            ? 'bg-[#FF7939] border-[#FF7939] text-black shadow-[0_4px_12px_rgba(255,121,57,0.3)]'
                                                            : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                                        }
                                `}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Meses</label>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {MONTHS.map(month => (
                                                <button
                                                    key={month.value}
                                                    onClick={() => toggleMonth(rule.id, month.value)}
                                                    className={`
                                    py-2 rounded-xl text-[10px] font-bold transition-all duration-300 border
                                    ${draft.months.includes(month.value)
                                                            ? 'bg-white/20 border-white/20 text-white'
                                                            : 'bg-white/5 border-white/5 text-zinc-600 hover:text-zinc-400'
                                                        }
                                `}
                                                >
                                                    {month.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                <Button
                    onClick={onAddRule}
                    variant="ghost"
                    className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl hover:bg-white/5 hover:border-[#FF7939]/30 text-zinc-500 hover:text-[#FF7939] transition-all group"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FF7939]/10 group-hover:scale-110 transition-all">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm tracking-wide">Añadir Nueva Regla</span>
                    </div>
                </Button>
            </div>

            {/* Aviso de funcionamiento */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl flex gap-4">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-200 leading-relaxed font-medium">
                    Tus horarios definen las opciones de reserva que ven tus clientes.
                    Si un horario no aparece aquí, no podrán invitarte a Meets en ese momento.
                    Los eventos de Google Calendar sincronizados funcionarán como bloqueos automáticos.
                </p>
            </div>
        </div>
    )
}

function ChevronDown(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    )
}
