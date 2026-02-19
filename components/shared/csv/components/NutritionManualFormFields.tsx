import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
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
                    value={formState.receta || ''}
                    onChange={(e) => onChange('receta', e.target.value)}
                    placeholder="Paso a paso..."
                    rows={3}
                />
            </div>

            <div className="col-span-2 space-y-2">
                <Label>Ingredientes</Label>
                <div className="space-y-2 mb-3">
                    {formState.ingredientes?.split(';').filter(Boolean).map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-zinc-900/40 p-2 rounded border border-zinc-800">
                            <span className="text-xs flex-1 text-white">{ing}</span>
                            <button
                                onClick={() => {
                                    const items = formState.ingredientes?.split(';').filter(Boolean) || []
                                    items.splice(idx, 1)
                                    onChange('ingredientes', items.join(';'))
                                }}
                                className="text-zinc-500 hover:text-red-400"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-12 gap-1 items-end">
                    <div className="col-span-6">
                        <Input id="ing-name" placeholder="Pollo" className="h-8 text-xs bg-zinc-950" />
                    </div>
                    <div className="col-span-3">
                        <Input id="ing-amount" placeholder="200" className="h-8 text-xs bg-zinc-950" />
                    </div>
                    <div className="col-span-2">
                        <Input id="ing-unit" placeholder="g" className="h-8 text-xs bg-zinc-950" />
                    </div>
                    <div className="col-span-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full p-0 bg-[#FF7939] hover:bg-[#FF6B35] text-white border-0"
                            onClick={() => {
                                const name = (document.getElementById('ing-name') as HTMLInputElement).value.trim()
                                const amount = (document.getElementById('ing-amount') as HTMLInputElement).value.trim()
                                const unit = (document.getElementById('ing-unit') as HTMLInputElement).value.trim()

                                if (name) {
                                    const combo = `${amount}${unit} ${name}`.trim()
                                    const current = formState.ingredientes || ''
                                    onChange('ingredientes', current ? `${current};${combo}` : combo)

                                        ; (document.getElementById('ing-name') as HTMLInputElement).value = ''
                                        ; (document.getElementById('ing-amount') as HTMLInputElement).value = ''
                                        ; (document.getElementById('ing-unit') as HTMLInputElement).value = ''
                                }
                            }}
                        >
                            +
                        </Button>
                    </div>
                </div>
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
