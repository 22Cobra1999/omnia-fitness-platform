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
        <div className="px-6 border-t border-gray-800 pt-4 space-y-4">
            <h4 className="text-white font-semibold mb-3">Temas y Horarios</h4>
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
                    <div key={tema.id || i} className="bg-gray-800/50 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-2">{tema.nombre}</h5>
                        {tema.descripcion && <p className="text-gray-400 text-sm mb-3">{tema.descripcion}</p>}
                        <div className="space-y-2">
                            {Object.keys(grouped).sort().map(fecha => (
                                <div key={fecha} className="text-gray-300 text-sm">
                                    <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-[#FF7939]" /><span>{formatFecha(fecha)}</span></div>
                                    <div className="ml-6 space-y-1">
                                        {grouped[fecha].map((h: any, j: number) => (
                                            <div key={j} className="flex items-center gap-2 text-gray-400"><Clock className="h-3 w-3" /><span>{h.hora_inicio} - {h.hora_fin}</span></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
