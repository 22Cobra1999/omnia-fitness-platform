"use client"

import { useState } from "react"
import { CSVManagerEnhanced } from "@/components/shared/csv/csv-manager-enhanced"
import { useUser } from "@/contexts/user-context"
import { Zap, UtensilsCrossed } from "lucide-react"
import { motion } from "framer-motion"

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

      {/* Sub-tabs: Fitness / Nutrición - Elongated Design */}
      <div className="mb-4 flex justify-center">
        <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg gap-6">
          <button
            onClick={() => setActiveSubTab('fitness')}
            className={`relative flex items-center justify-center w-24 h-11 rounded-full transition-all duration-300 ${activeSubTab === 'fitness'
              ? 'bg-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.3)] z-10'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <Zap className={`${activeSubTab === 'fitness' ? 'w-5 h-5' : 'w-4 h-4 opacity-50'}`} />
            {activeSubTab === 'fitness' && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-full border border-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('nutrition')}
            className={`relative flex items-center justify-center w-24 h-11 rounded-full transition-all duration-300 ${activeSubTab === 'nutrition'
              ? 'bg-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.3)] z-10'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <UtensilsCrossed className={`${activeSubTab === 'nutrition' ? 'w-5 h-5' : 'w-4 h-4 opacity-50'}`} />
            {activeSubTab === 'nutrition' && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-full border border-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Contenido según sub-tab activo */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CSVManagerEnhanced
          activityId={0} // 0 = modo genérico (sin actividad específica)
          coachId={user?.id || ""}
          productCategory={activeSubTab === 'fitness' ? 'fitness' : 'nutricion'}
          onSuccess={() => {
            console.log('Ejercicios/platos actualizados exitosamente')
          }}
        />
      </motion.div>
    </div>
  )
}
