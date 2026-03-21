import React from 'react'
import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFormState } from '../types'
import { exerciseTypeOptions, intensityLevels } from '../constants'
import { DictionaryAutocomplete } from '@/components/shared/ui/dictionary-autocomplete'

interface FitnessManualFormFieldsProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
    activeSection?: 'series' | 'musculos' | 'tecnica'
}

export function FitnessManualFormFields({ formState, onChange, activeSection }: FitnessManualFormFieldsProps) {
    if (activeSection === 'musculos') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Intensidad</Label>
                    <Select
                        value={formState.nivel_intensidad}
                        onValueChange={(val) => onChange('nivel_intensidad', val)}
                    >
                        <SelectTrigger className="bg-zinc-900 border-none rounded-xl h-11">
                            <SelectValue placeholder="Nivel" />
                        </SelectTrigger>
                        <SelectContent>
                            {intensityLevels.map(lvl => (
                                <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <DictionaryAutocomplete
                        label="Equipo Necesario"
                        value={formState.equipo_necesario}
                        onChange={(val) => onChange('equipo_necesario', val)}
                        categoria="equipo_fitness"
                        placeholder="Ej: Mancuernas..."
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <DictionaryAutocomplete
                        label="Partes del Cuerpo"
                        value={formState.partes_cuerpo}
                        onChange={(val) => onChange('partes_cuerpo', val)}
                        categoria="parte_cuerpo"
                        placeholder="Ej: Pecho, Espalda..."
                    />
                </div>
            </div>
        )
    }

    if (activeSection === 'series') {
        return (
            <div className="space-y-6">
                <div className="space-y-4 p-6 bg-[#FF7939]/5 rounded-[2rem] border border-[#FF7939]/10 shadow-inner">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-[#FF7939]" />
                            <Label className="text-[#FF7939] font-black uppercase text-[11px] tracking-widest italic">Gestionar Series</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase font-bold ml-1">Peso</Label>
                            <Input id="prs-peso" placeholder="10kg" className="h-11 bg-black/40 border-white/5 rounded-xl text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase font-bold ml-1">Reps</Label>
                            <Input id="prs-reps" placeholder="12" className="h-11 bg-black/40 border-white/5 rounded-xl text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase font-bold ml-1">Series</Label>
                            <Input id="prs-series" placeholder="3" className="h-11 bg-black/40 border-white/5 rounded-xl text-white font-bold" />
                        </div>
                    </div>

                    <Button
                        className="w-full bg-[#FF7939] hover:bg-[#FF6B35] text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
                        onClick={() => {
                            const p = (document.getElementById('prs-peso') as HTMLInputElement).value || '0'
                            const r = (document.getElementById('prs-reps') as HTMLInputElement).value || '0'
                            const s = (document.getElementById('prs-series') as HTMLInputElement).value || '1'
                            const newPrs = `(${p}-${r}-${s})`
                            const current = formState.detalle_series || ''
                            onChange('detalle_series', current ? `${current};${newPrs}` : newPrs)

                            // Reset inputs
                            ; (document.getElementById('prs-peso') as HTMLInputElement).value = ''
                            ; (document.getElementById('prs-reps') as HTMLInputElement).value = ''
                            ; (document.getElementById('prs-series') as HTMLInputElement).value = ''
                        }}
                    >
                        Añadir Serie al Preview
                    </Button>

                    {formState.detalle_series && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {formState.detalle_series.split(';').filter(Boolean).map((prs, idx) => (
                                <div key={idx} className="bg-zinc-900 px-3 py-2 rounded-xl text-[10px] text-zinc-300 flex items-center gap-3 border border-white/5 font-bold">
                                    <span className="text-[#FF7939] opacity-50">#{idx + 1}</span>
                                    {prs}
                                    <button
                                        onClick={() => {
                                            const items = formState.detalle_series.split(';').filter(Boolean)
                                            items.splice(idx, 1)
                                            onChange('detalle_series', items.join(';'))
                                        }}
                                        className="hover:text-red-400 p-1 rounded-lg hover:bg-red-400/10 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}
