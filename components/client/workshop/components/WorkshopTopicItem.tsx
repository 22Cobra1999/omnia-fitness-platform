import { ChevronDown, CheckCircle, FileText, Download, Edit2, Clock, Calendar, X } from "lucide-react"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TallerDetalle, TemaEstado, CuposMap } from "../types"

interface WorkshopTopicItemProps {
    tema: TallerDetalle
    isExpanded: boolean
    setExpanded: (val: boolean) => void
    isDocument: boolean
    documentProgress: boolean
    toggleDocumentTopic: () => void
    temaEstado: 'completado' | 'reservado' | 'pendiente'
    isTemaFinalizado: boolean
    temaCubierto?: TemaEstado
    temaPendiente?: TemaEstado
    handleSelectHorario: (temaId: number, temaNombre: string, fecha: string, horario: any) => void
    editarReservacion: (temaId: number) => void
    cuposOcupados: CuposMap
    expirationDate?: string
}

export function WorkshopTopicItem({
    tema,
    isExpanded,
    setExpanded,
    isDocument,
    documentProgress,
    toggleDocumentTopic,
    temaEstado,
    isTemaFinalizado,
    temaCubierto,
    temaPendiente,
    handleSelectHorario,
    editarReservacion,
    cuposOcupados,
    expirationDate
}: WorkshopTopicItemProps) {

    const formatDate = (d: string) => {
        if (!d) return d
        try {
            const date = d.includes('-') ? new Date(d + 'T12:00:00') : new Date(d)
            return format(date, "dd 'de' MMMM", { locale: es })
        } catch { return d }
    }

    const handleDownloadPdf = (url: string) => {
        window.open(url, '_blank')
    }

    return (
        <div className="group bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-black/50">
            <div className="p-5 cursor-pointer" onClick={() => setExpanded(!isExpanded)}>
                <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-semibold text-base group-hover:text-[#FF7939] transition-colors">{tema.nombre}</h3>
                            {!isDocument && temaEstado === 'completado' && <CheckCircle className="w-4 h-4 text-green-400" />}
                            {!isDocument && isTemaFinalizado && <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full border border-gray-600">Finalizado</span>}
                            {!isDocument && temaEstado === 'reservado' && !isTemaFinalizado && <span className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-2 py-0.5 rounded-full border border-[#FF7939]/30">Reservado</span>}

                            {isDocument && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleDocumentTopic(); }}
                                    className={`ml-2 p-1 rounded-full border transition-all cursor-pointer ${documentProgress
                                        ? 'bg-[#FF7939]/20 border-[#FF7939] text-[#FF7939]'
                                        : 'border-gray-600 text-gray-600 hover:border-[#FF7939]/50'
                                        }`}
                                >
                                    {documentProgress ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full" />}
                                </div>
                            )}
                        </div>

                        {!isDocument && (
                            <div className="flex flex-col gap-1 mt-1">
                                {!isExpanded && tema.descripcion && (
                                    <p className="text-gray-400 text-xs line-clamp-1">{tema.descripcion}</p>
                                )}
                                {temaCubierto?.asistio && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                        <p className="text-green-400 text-[11px] font-semibold">Asististe el {formatDate(temaCubierto.fecha_seleccionada!)}</p>
                                    </div>
                                )}
                                {isTemaFinalizado && !temaCubierto?.asistio && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <X className={`w-3.5 h-3.5 ${temaCubierto?.fecha_seleccionada ? 'text-red-400' : 'text-gray-400'}`} />
                                        <p className={`${temaCubierto?.fecha_seleccionada ? 'text-red-400' : 'text-gray-400'} text-[11px] font-semibold`}>
                                            {temaCubierto?.fecha_seleccionada ? `No asististe (${formatDate(temaCubierto.fecha_seleccionada)})` : 'Clase finalizada - Ausente'}
                                        </p>
                                    </div>
                                )}
                                {temaEstado === 'reservado' && !isTemaFinalizado && temaCubierto?.fecha_seleccionada && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                        <p className="text-gray-500 text-[11px] font-medium">Te inscribiste para el {formatDate(temaCubierto.fecha_seleccionada)}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {isDocument && !isExpanded && tema.descripcion && (
                            <p className="text-gray-400 text-xs line-clamp-1 mt-1">{tema.descripcion}</p>
                        )}
                    </div>
                    <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform duration-300 bg-white/5 p-1 rounded-full">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 pt-0">
                    <div className="px-1 text-gray-300 text-sm leading-relaxed space-y-4">
                        {tema.descripcion && <p>{tema.descripcion}</p>}

                        {!isDocument && !isTemaFinalizado && (
                            <div className="pt-2">
                                {temaEstado === 'reservado' ? (
                                    <div className="flex flex-col gap-2 bg-[#FF7939]/10 rounded-xl p-3 border border-[#FF7939]/30">
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm">
                                                <div className="font-semibold text-[#FF7939]">Tu Reserva</div>
                                                {temaCubierto && <span className="text-gray-200 text-xs">{formatDate(temaCubierto.fecha_seleccionada!)} • {temaCubierto.horario_seleccionado?.hora_inicio}</span>}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); editarReservacion(tema.id); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-[#FF7939]/70 italic border-t border-[#FF7939]/20 pt-2 mt-1">
                                            ℹ️ Política: Solo se permiten cambios hasta 48hs antes.
                                        </p>
                                    </div>
                                ) : (
                                    temaEstado === 'pendiente' && (
                                        <div className="mt-2">
                                            {(() => {
                                                const horarios = (temaPendiente as any)?.snapshot_originales?.fechas_horarios || []
                                                const filtered = horarios.filter((h: any) => !expirationDate || h.fecha <= expirationDate.split('T')[0])
                                                if (filtered.length === 0) return null
                                                return (
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Horarios Disponibles</h4>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {filtered.map((horario: any, idx: number) => {
                                                                const disponibles = horario.cupo - (cuposOcupados[`${tema.id}-${horario.fecha}-${horario.hora_inicio}`] || 0)
                                                                const isLleno = disponibles <= 0
                                                                return (
                                                                    <div key={idx} onClick={() => !isLleno && handleSelectHorario(tema.id, tema.nombre, horario.fecha, horario)}
                                                                        className={`flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-all ${isLleno ? 'opacity-50 bg-gray-900 border-gray-800' : 'hover:border-[#FF7939] bg-white/5 border-white/5 hover:bg-[#FF7939]/5'}`}>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-white text-xs font-semibold">{formatDate(horario.fecha)}</span>
                                                                            <span className="text-[10px] text-gray-500">{horario.hora_inicio} - {horario.hora_fin}</span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isLleno ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                                                                            {disponibles} cupos
                                                                        </span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {tema.pdf_url && (
                            <div className="pt-2">
                                <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 flex items-center justify-between hover:border-[#FF7939]/30 transition-colors group/pdf">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-4 h-4 text-red-500/80" />
                                        <span className="text-xs text-gray-400 truncate group-hover/pdf:text-gray-200 transition-colors">
                                            {tema.pdf_file_name || 'Material PDF'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(tema.pdf_url!); }}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF7939] hover:text-[#FF9F70] transition-colors bg-[#FF7939]/10 px-2 py-1 rounded-lg"
                                    >
                                        <Download className="w-3 h-3" />
                                        DESCARGAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
