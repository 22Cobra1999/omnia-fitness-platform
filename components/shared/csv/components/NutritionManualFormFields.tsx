import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFormState } from '../types'
import { mealTypes } from '../constants'

interface NutritionManualFormFieldsProps {
    formState: ManualFormState
    onChange: (field: keyof ManualFormState, value: string) => void
}

export function NutritionManualFormFields({ formState, onChange }: NutritionManualFormFieldsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Nombre del Plato</Label>
                <Input
                    value={formState.nombre}
                    onChange={(e) => onChange('nombre', e.target.value)}
                    placeholder="Ej: Ensalada César con Pollo"
                />
            </div>
            <div className="col-span-2 space-y-2">
                <Label>Receta / Instrucciones</Label>
                <Textarea
                    value={formState.receta}
                    onChange={(e) => onChange('receta', e.target.value)}
                    placeholder="Paso a paso..."
                    rows={3}
                />
            </div>

            <div className="col-span-2 space-y-2">
                <Label>Ingredientes (Uno por línea o separados por punto y coma)</Label>
                <Textarea
                    value={formState.ingredientes}
                    onChange={(e) => onChange('ingredientes', e.target.value)}
                    placeholder="Ej: 200g Pollo; 100g Lechuga..."
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-2">
                <div className="space-y-1">
                    <Label className="text-xs">Porciones</Label>
                    <Input
                        type="number"
                        value={formState.porciones}
                        onChange={(e) => onChange('porciones', e.target.value)}
                        placeholder="1"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Minutos</Label>
                    <Input
                        type="number"
                        value={formState.minutos}
                        onChange={(e) => onChange('minutos', e.target.value)}
                        placeholder="20"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Calorías</Label>
                    <Input type="number" value={formState.calorias} onChange={(e) => onChange('calorias', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Proteínas (g)</Label>
                    <Input type="number" value={formState.proteinas} onChange={(e) => onChange('proteinas', e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 col-span-2">
                <div className="space-y-1">
                    <Label className="text-xs">Carbos (g)</Label>
                    <Input type="number" value={formState.carbohidratos} onChange={(e) => onChange('carbohidratos', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Grasas (g)</Label>
                    <Input type="number" value={formState.grasas} onChange={(e) => onChange('grasas', e.target.value)} />
                </div>
            </div>
        </div>
    )
}
