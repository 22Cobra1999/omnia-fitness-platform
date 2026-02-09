import React from 'react'
import { Zap, MessageSquare, Target, Edit, MessageCircle, Video } from "lucide-react"

interface ConsultationSectionProps {
    type: 'express' | 'puntual' | 'profunda'
    consultation: any
    sales: any[]
    isEditing: boolean
    isToggling: boolean
    onToggle: (type: any) => void
    onUpdatePrice: (type: any, price: number) => void
    onSetEditingPrice: (type: any) => void
    onSetConsultationError: (error: string | null) => void
    onSetConsultations: (updater: any) => void
    onWhatsAppClick: (sale: any) => void
    onMeetClick: (sale: any) => void
}

export const ConsultationSection: React.FC<ConsultationSectionProps> = ({
    type,
    consultation,
    sales,
    isEditing,
    isToggling,
    onToggle,
    onUpdatePrice,
    onSetEditingPrice,
    onSetConsultationError,
    onSetConsultations,
    onWhatsAppClick,
    onMeetClick
}) => {
    const totalSales = sales.length
    const totalIncome = sales.reduce((sum, sale) => sum + (sale.price || consultation.price), 0)

    return (
        <div className="py-3 border-b border-gray-700/30 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    {type === 'express' ? (
                        <Zap className="w-5 h-5 text-[#FF7939]" />
                    ) : type === 'puntual' ? (
                        <MessageSquare className="w-5 h-5 text-[#FF7939]" />
                    ) : (
                        <Target className="w-5 h-5 text-[#FF7939]" />
                    )}
                    <div>
                        <h4 className="text-white font-semibold text-sm leading-tight">{consultation.name}</h4>
                        <p className="text-gray-400 text-xs">{consultation.time} min</p>
                    </div>
                </div>

                <button
                    onClick={() => onToggle(type)}
                    disabled={isToggling}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${consultation.active ? 'bg-[#FF7939]' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${consultation.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
            </div>

            <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">Ventas: <span className="text-white font-semibold">{totalSales}</span></span>
                    <span className="text-gray-400">Ingresos: <span className="text-[#FF7939] font-semibold">${totalIncome}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-base">$</span>
                            <input
                                type="number"
                                value={consultation.price}
                                onChange={(e) => {
                                    const newPrice = parseInt(e.target.value) || 0
                                    onSetConsultations((prev: any) => ({ ...prev, [type]: { ...prev[type], price: newPrice } }))
                                }}
                                className="bg-transparent border-none text-[#FF7939] font-bold text-lg focus:outline-none w-20 text-right"
                                autoFocus
                                onBlur={() => {
                                    onUpdatePrice(type, consultation.price)
                                    onSetEditingPrice(null)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onUpdatePrice(type, consultation.price)
                                        onSetEditingPrice(null)
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-1">
                                <span className="text-gray-400 text-base">$</span>
                                <span className="text-[#FF7939] font-bold text-lg">{consultation.price}</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (consultation.active) {
                                        onSetConsultationError('Desactiva la consulta para editar el precio')
                                    } else {
                                        onSetEditingPrice(type)
                                    }
                                }}
                                className="text-gray-400 hover:text-[#FF7939]"
                            >
                                <Edit className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {totalSales > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700/30 max-h-24 overflow-y-auto">
                    <div className="space-y-1.5">
                        {sales.map((sale, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                                <div>
                                    <p className="text-white">{sale.userName || 'Cliente'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onWhatsAppClick(sale)} className="p-1 hover:bg-green-500/10 rounded">
                                        <MessageCircle className="w-3 h-3 text-green-500" />
                                    </button>
                                    <button onClick={() => onMeetClick(sale)} className="p-1 hover:bg-blue-500/10 rounded">
                                        <Video className="w-3 h-3 text-blue-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
