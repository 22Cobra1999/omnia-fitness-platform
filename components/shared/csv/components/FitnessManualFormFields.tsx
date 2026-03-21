import React from 'react'
import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFormState } from '../types'
import { exerciseTypeOptions, intensityLevels } from '../constants'

interface FitnessManualFormFieldsProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
}

export function FitnessManualFormFields({ formState, onChange }: FitnessManualFormFieldsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Nombre del Ejercicio</Label>
                <Input
                    value={formState.nombre}
                    onChange={(e) => onChange('nombre', e.target.value)}
                    placeholder="Ej: Press de Banca"
                />
            </div>
            <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                    value={formState.tipo_ejercicio}
                    onValueChange={(val) => onChange('tipo_ejercicio', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Fuerza, Cardio..." />
                    </SelectTrigger>
                    <SelectContent>
                        {exerciseTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Intensidad</Label>
                <Select
                    value={formState.nivel_intensidad}
                    onValueChange={(val) => onChange('nivel_intensidad', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Bajo, Medio, Alto" />
                    </SelectTrigger>
                    <SelectContent>
                        {intensityLevels.map(lvl => (
                            <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Equipo Necesario</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {formState.equipo_necesario?.split(';').filter(Boolean).map((item, idx) => (
                        <div key={idx} className="bg-zinc-800 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 border border-zinc-700">
                            {item}
                            <button
                                onClick={() => {
                                    const items = formState.equipo_necesario?.split(';').filter(Boolean) || []
                                    items.splice(idx, 1)
                                    onChange('equipo_necesario', items.join(';'))
                                }}
                                className="hover:text-red-400"
                            >
                                <X className="h-2 w-2" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-1">
                    <Input
                        id="new-eq"
                        placeholder="Mancuernas..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const val = (e.target as HTMLInputElement).value.trim()
                                if (val) {
                                    const current = formState.equipo_necesario || ''
                                    onChange('equipo_necesario', current ? `${current};${val}` : val)
                                    ;(e.target as HTMLInputElement).value = ''
                                }
                            }
                        }}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                        onClick={() => {
                            const input = document.getElementById('new-eq') as HTMLInputElement
                            const val = input.value.trim()
                            if (val) {
                                const current = formState.equipo_necesario || ''
                                onChange('equipo_necesario', current ? `${current};${val}` : val)
                                input.value = ''
                            }
                        }}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                    type="number"
                    value={formState.duracion_min}
                    onChange={(e) => onChange('duracion_min', e.target.value)}
                    placeholder="Ej: 15"
                />
            </div>

            <div className="space-y-2">
                <Label>Calorías</Label>
                <Input
                    type="number"
                    value={formState.calorias}
                    onChange={(e) => onChange('calorias', e.target.value)}
                    placeholder="Ej: 100"
                />
            </div>

            <div className="col-span-2 space-y-2">
                <Label>Partes del Cuerpo</Label>
                <Input
                    value={formState.partes_cuerpo}
                    onChange={(e) => onChange('partes_cuerpo', e.target.value)}
                    placeholder="Ej: Pecho; Hombros"
                />
            </div>

            {/* P-R-S Section */}
            <div className="col-span-2 space-y-3 p-4 bg-zinc-900/40 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                    <Label className="text-[#FF7939] font-bold">P-R-S (Detalle de Series)</Label>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Añadir detalle por serie</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Peso</Label>
                        <Input id="prs-peso" placeholder="10kg" className="h-9 bg-black/40" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Reps</Label>
                        <Input id="prs-reps" placeholder="12" className="h-9 bg-black/40" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Series</Label>
                        <Input id="prs-series" placeholder="3" className="h-9 bg-black/40" />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-xs h-8 border border-zinc-700"
                        onClick={() => {
                            const p = (document.getElementById('prs-peso') as HTMLInputElement).value || '0'
                            const r = (document.getElementById('prs-reps') as HTMLInputElement).value || '0'
                            const s = (document.getElementById('prs-series') as HTMLInputElement).value || '1'
                            const newPrs = `(${p}-${r}-${s})`
                            const current = formState.detalle_series || ''
                            onChange('detalle_series', current ? `${current};${newPrs}` : newPrs)
                            
                            // Reset inputs
                            ;(document.getElementById('prs-peso') as HTMLInputElement).value = ''
                            ;(document.getElementById('prs-reps') as HTMLInputElement).value = ''
                            ;(document.getElementById('prs-series') as HTMLInputElement).value = ''
                        }}
                    >
                        <Plus className="h-3 w-3 mr-1" /> Añadir Serie
                    </Button>
                </div>

                {formState.detalle_series && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formState.detalle_series.split(';').filter(Boolean).map((prs, idx) => (
                            <div key={idx} className="bg-[#FF7939]/10 px-2 py-1 rounded text-[10px] text-[#FF7939] flex items-center gap-2 border border-[#FF7939]/20 font-bold">
                                {prs}
                                <button
                                    onClick={() => {
                                        const items = formState.detalle_series.split(';').filter(Boolean)
                                        items.splice(idx, 1)
                                        onChange('detalle_series', items.join(';'))
                                    }}
                                    className="hover:text-red-400 text-xs"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="col-span-2 space-y-2">
                <Label>Descripción / Técnica</Label>
                <Textarea
                    value={formState.descripcion}
                    onChange={(e) => onChange('descripcion', e.target.value)}
                    placeholder="Cómo realizar el ejercicio..."
                    rows={2}
                />
            </div>
        </div>
    )
}
