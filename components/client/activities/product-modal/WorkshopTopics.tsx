"use client"

import React from 'react'
import { Calendar, Clock } from 'lucide-react'

interface WorkshopTopicsProps {
    topics: any[]
    loading: boolean
}

export function WorkshopTopics({ topics, loading }: WorkshopTopicsProps) {
    if (loading) return <div className="text-gray-400 text-sm p-6">Cargando temas y horarios...</div>
    if (!topics.length) return <div className="text-gray-400 text-sm p-6">No hay temas configurados</div>

    const formatFecha = (f: string) => {
        try {
            const [y, m, d] = f.split('-').map(Number)
            return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
        } catch { return f }
    }

    return (
        <div className="px-6 border-t border-white/5 pt-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <h4 className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Temas y Horarios</h4>
            </div>

            <div className="space-y-8">
                {topics.map((tema, i) => {
                    const horarios = [...(tema.originales?.fechas_horarios || []), ...(tema.secundarios?.fechas_horarios || [])]
                    const grouped = horarios.reduce((acc: any, h: any) => {
                        if (h.fecha) {
                            if (!acc[h.fecha]) acc[h.fecha] = []
                            acc[h.fecha].push(h)
                        }
                        return acc
                    }, {})

                    return (
                        <div key={tema.id || i} className="group">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-[#FF7939] font-black text-sm tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
                                <h5 className="text-white font-bold text-base leading-tight group-hover:text-[#FF7939] transition-colors">{tema.nombre}</h5>
                            </div>

                            {tema.descripcion && (
                                <p className="text-gray-500 text-[11px] leading-relaxed mb-4 ml-8 max-w-md">
                                    {tema.descripcion}
                                </p>
                            )}

                            <div className="ml-8 space-y-2">
                                {Object.keys(grouped).sort().map(fecha => (
                                    <div key={fecha} className="flex items-center gap-4 text-[10px] tracking-wide">
                                        <div className="flex items-center gap-1.5 text-gray-400 font-bold uppercase min-w-[100px]">
                                            <Calendar className="h-3 w-3 opacity-50" />
                                            <span>{formatFecha(fecha)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {grouped[fecha].map((h: any, j: number) => (
                                                <div key={j} className="flex items-center gap-1.5 text-gray-500 font-medium bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5">
                                                    <Clock className="h-2.5 w-2.5 opacity-40" />
                                                    <span>{h.hora_inicio} - {h.hora_fin}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
