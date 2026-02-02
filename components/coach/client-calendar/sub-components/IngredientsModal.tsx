import React from 'react'
import { ExerciseExecution } from '../types'

interface IngredientsModalProps {
    showIngredientsModal: boolean
    setShowIngredientsModal: (show: boolean) => void
    editingNutritionExercise: ExerciseExecution | null
    editingIngredientsList: any[]
    setEditingIngredientsList: React.Dispatch<React.SetStateAction<any[]>>
    handleSaveNutrition: (ex: ExerciseExecution, extra?: any) => Promise<void>
}

export const IngredientsModal: React.FC<IngredientsModalProps> = ({
    showIngredientsModal, setShowIngredientsModal, editingNutritionExercise,
    editingIngredientsList, setEditingIngredientsList, handleSaveNutrition
}) => {
    if (!showIngredientsModal || !editingNutritionExercise) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1E1E1E] w-full max-w-lg rounded-2xl border border-[#3A3A3A] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-[#3A3A3A] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Editar Ingredientes</h3>
                    <button onClick={() => setShowIngredientsModal(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {editingIngredientsList.map((ing, idx) => (
                        <div key={ing._key || idx} className="flex gap-2 items-center">
                            <input placeholder="Cant." value={ing.cantidad} onChange={(e) => { const next = [...editingIngredientsList]; next[idx].cantidad = e.target.value; setEditingIngredientsList(next) }} className="w-16 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white" />
                            <input placeholder="Unidad" value={ing.unidad} onChange={(e) => { const next = [...editingIngredientsList]; next[idx].unidad = e.target.value; setEditingIngredientsList(next) }} className="w-16 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white" />
                            <input placeholder="Nombre" value={ing.nombre} onChange={(e) => { const next = [...editingIngredientsList]; next[idx].nombre = e.target.value; setEditingIngredientsList(next) }} className="flex-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-2 py-1 text-sm text-white" />
                            <button onClick={() => setEditingIngredientsList(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-300">✕</button>
                        </div>
                    ))}
                    <div className="pt-2">
                        <button type="button" onClick={() => { const newKey = `new_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`; setEditingIngredientsList(prev => [...prev, { _key: newKey, nombre: '', cantidad: '', unidad: '' }]) }} className="text-xs text-[#FF7939] hover:underline">+ Agregar Ingrediente</button>
                    </div>
                </div>

                <div className="p-4 border-t border-[#3A3A3A] flex justify-end gap-2">
                    <button onClick={() => setShowIngredientsModal(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                    <button onClick={async () => {
                        const ingObj: any = {}
                        editingIngredientsList.forEach((ing, i) => { const key = ing._key && !ing._key.startsWith('new_') ? ing._key : String(i); ingObj[key] = { nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad } })
                        await handleSaveNutrition(editingNutritionExercise, { ingredientes: ingObj })
                        setShowIngredientsModal(false)
                    }} className="px-4 py-2 rounded-lg bg-[#FF7939] text-white font-medium hover:bg-[#ff8a50] transition-colors shadow-lg shadow-[#FF7939]/20">Guardar Ingredientes</button>
                </div>
            </div>
        </div>
    )
}
