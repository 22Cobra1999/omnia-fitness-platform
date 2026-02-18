import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { UNIT_OPTIONS } from "../../hooks/useObjectivesLogic"
import { TimeInput } from "./TimeInput"

interface ObjectiveAddFormProps {
    onClose: () => void
    newExercise: {
        title: string
        unit: string
        current_value: string
    }
    setNewExercise: (val: any) => void
    timeValue: {
        hours: number
        minutes: number
        seconds: number
    }
    setTimeValue: (val: any) => void
    handleAddExercise: () => void
    isLoading: boolean
}

export function ObjectiveAddForm({
    onClose,
    newExercise,
    setNewExercise,
    timeValue,
    setTimeValue,
    handleAddExercise,
    isLoading
}: ObjectiveAddFormProps) {
    const isTime = newExercise.unit === "tiempo"
    const isInvalid = !newExercise.title || !newExercise.unit ||
        (isTime ? (timeValue.hours === 0 && timeValue.minutes === 0 && timeValue.seconds === 0) : !newExercise.current_value)

    return (
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Nueva Meta de Rendimiento</h3>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                    <X className="h-4 w-4 text-gray-400" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide ml-1">Ejercicio</Label>
                    <Input
                        placeholder="Ej: Press Banca, Correr 5k..."
                        value={newExercise.title}
                        onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                        className="bg-[#0F1012] border-white/10 text-white h-11 rounded-xl focus-visible:ring-[#FF6A00]/50 focus-visible:border-[#FF6A00]/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide ml-1">Unidad</Label>
                        <Select value={newExercise.unit} onValueChange={(value) => setNewExercise({ ...newExercise, unit: value })}>
                            <SelectTrigger className="bg-[#0F1012] border-white/10 text-white h-11 rounded-xl focus:ring-[#FF6A00]/50 focus:border-[#FF6A00]/50">
                                <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1C1F] border-white/10 text-white rounded-xl">
                                {UNIT_OPTIONS.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value} className="text-white hover:bg-white/10 cursor-pointer">
                                        {unit.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide ml-1">Valor Inicial</Label>
                        {isTime ? (
                            <TimeInput value={timeValue} onChange={setTimeValue} />
                        ) : (
                            <Input
                                type="number"
                                placeholder="0"
                                value={newExercise.current_value}
                                onChange={(e) => setNewExercise({ ...newExercise, current_value: e.target.value })}
                                className="bg-[#0F1012] border-white/10 text-white h-11 rounded-xl focus-visible:ring-[#FF6A00]/50 focus-visible:border-[#FF6A00]/50"
                            />
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAddExercise}
                        disabled={isInvalid || isLoading}
                        className="flex-1 h-11 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white shadow-lg shadow-[#FF6A00]/20"
                    >
                        {isLoading ? "Guardando..." : "Crear"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
