import React from 'react'
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
                                ×
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
                                        ; (e.target as HTMLInputElement).value = ''
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
                        +
                    </Button>
                </div>
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
