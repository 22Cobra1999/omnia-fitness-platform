"use client"

import { useState } from "react"
import { CSVManagerEnhanced } from "@/components/shared/csv/csv-manager-enhanced"
import { useUser } from "@/contexts/user-context"
import { Dumbbell, UtensilsCrossed } from "lucide-react"

export default function ExercisesPlatesManagementScreen() {
  const { user } = useUser()
  const [activeSubTab, setActiveSubTab] = useState<'fitness' | 'nutrition'>('fitness')

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-1">Mis Ejercicios/Platos</h2>
        <p className="text-gray-400 text-sm">Administra tu biblioteca de ejercicios y platos</p>
      </div>

      {/* Sub-tabs: Fitness / Nutrición - Centrados y más separados */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 shadow-inner gap-2">
          <button
            onClick={() => setActiveSubTab('fitness')}
            className={`px-8 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'fitness'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Fitness
          </button>
          <button
            onClick={() => setActiveSubTab('nutrition')}
            className={`px-8 py-2.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'nutrition'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Nutrición
          </button>
        </div>
      </div>

      {/* Contenido según sub-tab activo */}
      <div key={activeSubTab}>
        <CSVManagerEnhanced
          activityId={0} // 0 = modo genérico (sin actividad específica)
          coachId={user?.id || ""}
          productCategory={activeSubTab === 'fitness' ? 'fitness' : 'nutricion'}
          onSuccess={() => {
            console.log('Ejercicios/platos actualizados exitosamente')
          }}
        />
      </div>
    </div>
  )
}


