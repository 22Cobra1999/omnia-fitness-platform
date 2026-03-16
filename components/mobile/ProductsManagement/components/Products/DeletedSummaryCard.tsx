import React from 'react'
import { Trash2, Star, Globe, MapPin, Zap, UtensilsCrossed } from 'lucide-react'
import { Product } from '../../types'

interface DeletedSummaryCardProps {
    deletedProducts: Product[]
}

export const DeletedSummaryCard: React.FC<DeletedSummaryCardProps> = ({ deletedProducts }) => {
    if (deletedProducts.length === 0) return null

    return (
        <div className="flex-shrink-0 w-44 md:w-52 bg-[#0A0A0A] rounded-[2rem] border border-white/5 p-4 flex flex-col shadow-2xl overflow-hidden relative min-h-[380px]">
            {/* Header Mini */}
            <div className="flex items-center gap-2 mb-5 relative z-10 px-1 border-b border-white/5 pb-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest opacity-60">Archivo Muerto</h3>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar relative z-10">
                <div className="space-y-4">
                    {deletedProducts.map((p) => (
                        <div key={p.id} className="border-b border-white/5 pb-3 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-1">
                            {/* Fila 1: Nombre (Amarillo pastel claro muy suave y traslúcido) */}
                            <div className="mb-3 text-center">
                                <span className="text-yellow-100/60 font-bold text-[12px] tracking-tight leading-tight block uppercase" title={p.title}>
                                    {p.title}
                                </span>
                            </div>

                            {/* Fila 2: Todo lo demás (Iconos y Stats juntos en una fila) */}
                            <div className="flex items-center justify-between gap-1">
                                {/* Grupo Iconos de Tipo */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {p.modality === 'presencial' ? 
                                        <MapPin size={12} className="text-red-500" /> : 
                                        <Globe size={12} className="text-white" />
                                    }
                                    {(p.categoria === 'nutrition' || p.categoria === 'nutricion') ? 
                                        <UtensilsCrossed size={12} className="text-yellow-400" /> : 
                                        <Zap size={12} className="text-[#FF7939]" />
                                    }
                                </div>

                                {/* Grupo Stats (Ventas con $ y Rating - Smooth Style) */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Ventas con logo $ */}
                                    <div className="flex items-center gap-1 opacity-90">
                                        <span className="text-[#FF7939] font-bold text-[13px]">$</span>
                                        <span className="text-white font-bold text-[13px] tracking-tight leading-none">
                                            {p.sales ?? 0}
                                        </span>
                                    </div>
                                    {/* Rating */}
                                    <div className="flex items-center gap-1 opacity-90">
                                        <Star size={11} className="text-[#FF7939] fill-[#FF7939]" />
                                        <span className="text-white font-bold text-[12px] tracking-tight leading-none">
                                            5.0
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Compacto */}
            <div className="mt-auto pt-4 border-t border-white/5 relative z-10 text-center">
                 <span className="text-[8px] font-black text-red-500 uppercase tracking-widest opacity-40">
                    {deletedProducts.length} Actividades
                 </span>
            </div>
        </div>
    )
}
