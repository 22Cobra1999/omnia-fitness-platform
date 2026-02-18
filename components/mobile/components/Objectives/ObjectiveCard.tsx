import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit, X } from "lucide-react"
import { ObjectiveExercise } from "../../hooks/useObjectivesLogic"

interface ObjectiveCardProps {
    exercise: ObjectiveExercise
    getUnitLabel: (unit: string) => string
    handleDeleteExercise: (id: string) => void
    formatValueForDisplay: (val: any, unit: string) => string
    formatDate: (date: string) => string
    editingRecord: string | null
    setEditingRecord: (id: string | null) => void
    editRecord: any
    setEditRecord: (val: any) => void
    handleEditValue: (exId: string, index: number, val: string) => void
    newRecord: any
    setNewRecord: (val: any) => void
    handleAddValue: (exId: string, val: string) => void
}

export function ObjectiveCard({
    exercise,
    getUnitLabel,
    handleDeleteExercise,
    formatValueForDisplay,
    formatDate,
    editingRecord,
    setEditingRecord,
    editRecord,
    setEditRecord,
    handleEditValue,
    newRecord,
    setNewRecord,
    handleAddValue
}: ObjectiveCardProps) {
    const values = [exercise.value_1, exercise.value_2, exercise.value_3, exercise.value_4]
    const dates = [exercise.date_1, exercise.date_2, exercise.date_3, exercise.date_4]
    const hasEmptySlot = values.some(v => v === null || v === undefined)

    return (
        <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white capitalize">
                        {exercise.exercise_title}
                    </h3>
                    <p className="text-xs text-[#FF6A00] font-medium uppercase tracking-wider mt-0.5">
                        {getUnitLabel(exercise.unit)}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExercise(exercise.id)}
                    className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg h-8 w-8 p-0"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Progress Grid */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1 col-span-1 text-left">Actual</div>
                <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 1</div>
                <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 2</div>
                <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 3</div>
                <div className="text-gray-500 font-medium uppercase tracking-wider text-[10px] mb-1">Registro 4</div>

                {/* Current Value */}
                <div className="col-span-1 text-left font-bold text-white text-base">
                    {formatValueForDisplay(values[0], exercise.unit) || '-'}
                    <span className="text-[10px] text-gray-500 font-normal ml-1">{exercise.unit !== 'tiempo' ? exercise.unit : ''}</span>
                </div>

                {/* Records */}
                {values.map((value, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] border border-white/5 relative group">
                        {editingRecord === `${exercise.id}-${index}` ? (
                            <div className="absolute inset-0 bg-[#1A1C1F] z-10 flex items-center justify-center gap-1 p-1 rounded-lg border border-[#FF6A00]/50">
                                <Input
                                    type="text"
                                    value={editRecord.current_value}
                                    onChange={(e) => setEditRecord({ ...editRecord, current_value: e.target.value })}
                                    className="h-full w-full bg-transparent border-none text-center text-xs p-0 focus-visible:ring-0 text-white"
                                    autoFocus
                                />
                                <div className="flex flex-col gap-0.5">
                                    <button onClick={() => handleEditValue(exercise.id, index + 1, editRecord.current_value)} className="text-green-500 hover:text-green-400">✓</button>
                                    <button onClick={() => setEditingRecord(null)} className="text-red-500 hover:text-red-400">✕</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="text-white font-medium">{value !== undefined && value !== null ? formatValueForDisplay(value, exercise.unit) : "-"}</span>
                                {dates[index] && <span className="text-[8px] text-gray-500 mt-0.5">{formatDate(dates[index])}</span>}

                                {value !== undefined && value !== null && (
                                    <button
                                        onClick={() => {
                                            setEditingRecord(`${exercise.id}-${index}`)
                                            setEditRecord({
                                                id: `${exercise.id}-${index}`,
                                                current_value: value?.toString() || "",
                                                notes: ""
                                            })
                                        }}
                                        className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#FF6A00] transition-opacity"
                                    >
                                        <Edit className="w-2 h-2" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* New record input */}
            {hasEmptySlot && (
                <div className="mt-4 pt-3 border-t border-white/5">
                    {newRecord.exercise_title === exercise.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <div className="flex-1 relative">
                                <Input
                                    type="number"
                                    placeholder={exercise.unit === 'tiempo' ? "Segundos totales" : "Nuevo valor"}
                                    value={newRecord.current_value}
                                    onChange={(e) => setNewRecord({ ...newRecord, current_value: e.target.value })}
                                    className="bg-[#0F1012] border-[#FF6A00]/50 text-white h-10 rounded-lg pr-12 focus-visible:ring-[#FF6A00]/20"
                                    autoFocus
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {exercise.unit}
                                </span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleAddValue(exercise.id, newRecord.current_value)}
                                className="h-10 px-4 bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white rounded-lg"
                            >
                                Guardar
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setNewRecord({ exercise_title: "", current_value: "", notes: "" })}
                                className="h-10 w-10 p-0 text-gray-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setNewRecord({ ...newRecord, exercise_title: exercise.id, current_value: "" })}
                            variant="ghost"
                            className="w-full h-10 border border-dashed border-white/10 hover:bg-white/5 text-gray-400 hover:text-[#FF6A00] rounded-xl text-xs font-medium uppercase tracking-wide transition-all"
                        >
                            + Registrar nuevo progreso
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
