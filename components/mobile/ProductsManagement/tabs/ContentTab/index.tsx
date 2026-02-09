import React, { memo } from 'react'
import { CSVManagerEnhanced } from '@/components/shared/csv/csv-manager-enhanced'

interface ContentTabProps {
    userId: string | undefined
    activeSubTab: 'fitness' | 'nutrition'
    setActiveSubTab: (tab: 'fitness' | 'nutrition') => void
}

export const ContentTab: React.FC<ContentTabProps> = memo(({ userId, activeSubTab, setActiveSubTab }) => {
    return (
        <div className="bg-[#0F0F0F] rounded-2xl border border-[#1A1A1A] overflow-hidden">
            <div className="p-4 border-b border-[#1A1A1A]">
                <div className="flex gap-2 bg-[#050505] p-1 rounded-xl w-full">
                    <button
                        onClick={() => setActiveSubTab('fitness')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'fitness' ? 'bg-[#FF7939] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        FITNESS
                    </button>
                    <button
                        onClick={() => setActiveSubTab('nutrition')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'nutrition' ? 'bg-[#FF7939] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        NUTRICIÓN
                    </button>
                </div>
            </div>

            <div className="p-4 min-h-[400px]">
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
