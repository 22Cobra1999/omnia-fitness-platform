import React from 'react'
import { Label } from '@/components/ui/label'
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
                <Label>Equipo</Label>
                <Input
                    value={formState.equipo_necesario}
                    onChange={(e) => onChange('equipo_necesario', e.target.value)}
                    placeholder="Mancuernas, Banco..."
                />
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
