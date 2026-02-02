import React from 'react'
import { Trash2 } from 'lucide-react'

interface NutritionDeleteModalProps {
    confirmDeleteNutritionId: string | null
    setConfirmDeleteNutritionId: (id: string | null) => void
    handleDeleteNutrition: (id: string) => Promise<void>
}

export const NutritionDeleteModal: React.FC<NutritionDeleteModalProps> = ({
    confirmDeleteNutritionId, setConfirmDeleteNutritionId, handleDeleteNutrition
}) => {
    if (!confirmDeleteNutritionId) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700/30">
                <div className="flex items-center gap-2 mb-4">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-lg text-white">Eliminar Nutrición</h3>
                </div>
                <div className="text-sm text-gray-300 mb-6">¿Estás seguro de que quieres eliminar este plato? Esta acción no se puede deshacer.</div>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmDeleteNutritionId(null)} className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors">Cancelar</button>
                    <button onClick={() => handleDeleteNutrition(confirmDeleteNutritionId)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Eliminar</button>
                </div>
            </div>
        </div>
    )
}
