import React from 'react'
import { Save, ChevronRight } from 'lucide-react'
import { getDayNamePlural } from '../utils/date-helpers'

interface CascadeModalProps {
    cascadeModal: {
        isOpen: boolean
        type: 'fitness' | 'nutrition'
        mode: 'swap' | 'update'
        sourceDate: string
        sourceDayName: string
        itemName: string
        payload: any
    }
    setCascadeModal: (modal: any) => void
    handleApplyCascade: (scope: 'same_day' | 'future_all') => Promise<void>
}

export const CascadeModal: React.FC<CascadeModalProps> = ({
    cascadeModal, setCascadeModal, handleApplyCascade
}) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-[#1E1E1E] rounded-2xl p-6 w-full max-w-sm border border-[#3A3A3A] shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#FF7939]/20 flex items-center justify-center">
                        <Save className="h-5 w-5 text-[#FF7939]" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">Cambio Guardado</h3>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-gray-300 leading-relaxed">
                        Has modificado <span className="text-white font-medium">{cascadeModal.itemName}</span>.
                        <br />
                        ¿Te gustaría aplicar este cambio a otros días?
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <button onClick={() => setCascadeModal(null)} className="w-full py-3 px-4 bg-[#2A2A2A] text-gray-300 rounded-xl hover:bg-[#3A3A3A] hover:text-white transition-colors text-sm font-medium text-left flex items-center justify-between group">
                            <span>Solo este día</span>
                            <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                        </button>

                        <button onClick={() => handleApplyCascade('same_day')} className="w-full py-3 px-4 bg-[#2A2A2A] text-[#FF7939] rounded-xl hover:bg-[#FF7939] hover:text-white transition-all duration-300 text-sm font-medium text-left flex items-center justify-between group">
                            <div className="flex flex-col">
                                <span>Todos los {getDayNamePlural(new Date(cascadeModal.sourceDate + 'T00:00:00').getDay())}</span>
                                <span className="text-[10px] opacity-70 font-normal">Aplicar a futuros {cascadeModal.sourceDayName}s</span>
                            </div>
                            <Save className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button onClick={() => handleApplyCascade('future_all')} className="w-full py-3 px-4 bg-[#2A2A2A] text-gray-300 rounded-xl hover:bg-[#3A3A3A] hover:text-white transition-colors text-sm font-medium text-left flex items-center justify-between group">
                            <div className="flex flex-col">
                                <span>Todos los días futuros</span>
                                <span className="text-[10px] text-gray-500 group-hover:text-gray-400 font-normal">Donde aparezca este ejercicio/plato</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
