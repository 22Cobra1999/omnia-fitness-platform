import React, { memo } from 'react'
import { Zap, UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'
import { CSVManagerEnhanced } from '@/components/shared/csv/csv-manager-enhanced'

interface ContentTabProps {
    userId: string | undefined
    activeSubTab: 'fitness' | 'nutrition'
    setActiveSubTab: (tab: 'fitness' | 'nutrition') => void
}

export const ContentTab: React.FC<ContentTabProps> = memo(({ userId, activeSubTab, setActiveSubTab }) => {
    return (
        <div className="bg-transparent overflow-hidden">
            {/* Sub-tabs: Fitness / Nutrición - Elongated Design */}
            <div className="mb-6 flex justify-center">
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
                                layoutId="active-tab-content"
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
                                layoutId="active-tab-content"
                                className="absolute inset-0 rounded-full border border-white/10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            <div className="p-0 min-h-[400px]">
                {userId ? (
                    <CSVManagerEnhanced
                        activityId={0} // 0 indica carga general de librería
                        coachId={userId}
                        productCategory={activeSubTab === 'nutrition' ? 'nutricion' : 'fitness'}
                    />
                ) : (
                    <div className="text-center text-gray-500 py-20 text-sm">Cargando perfil del coach...</div>
                )}
            </div>
        </div>
    )
})

ContentTab.displayName = 'ContentTab'
