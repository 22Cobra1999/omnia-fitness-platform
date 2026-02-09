import * as React from 'react';
import {
    FileText,
    Calendar,
    CheckCircle,
    Download,
    Clock,
    ChevronDown,
    ChevronUp,
    X,
    Edit2,
    AlignLeft,
    Star
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WorkshopTopicListProps {
    temas: any[];
    temasCubiertos: any[];
    temasPendientes: any[];
    isDocument: boolean;
    documentProgress?: Record<number, boolean>;

    // Actions
    onToggleDocumentProgress?: (topicId: number) => void;
    onSelectHorario?: (temaId: number, temaNombre: string, fecha: string, horario: any) => void;
    onEditarReservacion?: (temaId: number) => void;
    onDownloadPdf?: (url: string) => void;

    // State
    expandedTema: number | null;
    setExpandedTema: (id: number | null) => void;
    cuposOcupados: Record<string, number>;
    enrollment: any;

    // Helpers
    isTemaFinalizado: (id: number) => boolean;
    isWorkshopExpired: () => boolean;
    getAttendanceSummary: () => { totalTopics: number, attendedTopics: number };

    // Modals trigger
    onOpenRating?: () => void;
    isRated?: boolean;
}

export function WorkshopTopicList({
    temas,
    temasCubiertos,
    temasPendientes,
    isDocument,
    documentProgress = {},
    onToggleDocumentProgress,
    onSelectHorario,
    onEditarReservacion,
    onDownloadPdf,
    expandedTema,
    setExpandedTema,
    cuposOcupados,
    enrollment,
    isTemaFinalizado,
    isWorkshopExpired,
    getAttendanceSummary,
    onOpenRating,
    isRated
}: WorkshopTopicListProps) {

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr + 'T12:00:00');
            return format(date, "dd 'de' MMMM", { locale: es });
        } catch { return dateStr; }
    };

    if (!temas || temas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    {isDocument ? <FileText className="text-zinc-500" size={32} /> : <Calendar className="text-zinc-500" size={32} />}
                </div>
                <h3 className="text-white font-medium">No hay temas disponibles</h3>
                <p className="text-zinc-500 text-sm mt-1">Esta actividad aún no tiene contenido cargado.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Completion Banner */}
            {!isDocument && isWorkshopExpired() && (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-base mb-1">Taller Finalizado</h3>
                            <div className="text-gray-400 text-xs space-y-0.5 mb-3">
                                {(() => {
                                    const { totalTopics, attendedTopics } = getAttendanceSummary();
                                    return (
                                        <>
                                            <p>Total: <strong>{totalTopics}</strong> temas</p>
                                            <p>Asistencia: <strong>{attendedTopics}</strong>/{totalTopics} clases</p>
                                        </>
                                    );
                                })()}
                            </div>
                            {!isRated ? (
                                <button
                                    onClick={onOpenRating}
                                    className="border border-white/20 hover:bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 w-max"
                                >
                                    <Star className="w-3.5 h-3.5 text-[#FF7939]" />
                                    Calificar taller
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-green-500/80 text-xs font-medium">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Calificado
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Sessions */}
            {!isDocument && temasCubiertos.filter(tema => {
                if (tema.asistio) return false;
                if (!tema.fecha_seleccionada) return false;
                const date = new Date(tema.fecha_seleccionada + 'T23:59:59');
                return date >= new Date();
            }).length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4 px-2">Próximas Sesiones</h2>
                        <div className="space-y-3">
                            {temasCubiertos.filter(tema => {
                                if (tema.asistio) return false;
                                if (!tema.fecha_seleccionada) return false;
                                const date = new Date(tema.fecha_seleccionada + 'T23:59:59');
                                return date >= new Date();
                            }).map((tema) => (
                                <div key={tema.tema_id} className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-semibold mb-1">{tema.tema_nombre}</div>
                                        <div className="text-gray-400 text-xs flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-[#FF7939]" />
                                            {formatDate(tema.fecha_seleccionada)}
                                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                            <Clock className="w-3 h-3 text-[#FF7939]" />
                                            {tema.horario_seleccionado?.hora_inicio} a {tema.horario_seleccionado?.hora_fin}
                                        </div>
                                    </div>
                                    <CheckCircle className="w-6 h-6 text-[#FF7939]" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            {/* Topic List */}
            <div>
                <div className="flex items-center justify-between mb-5 pl-0 pr-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {isDocument ? <AlignLeft className="w-5 h-5 text-[#FF7939]" /> : null}
                        {isDocument ? 'Contenido' : 'Temas del Taller'}
                    </h2>
                    <div className="flex items-center gap-3 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                        <span className="text-xs font-bold text-[#FF7939]">
                            {isDocument
                                ? `${Object.values(documentProgress).filter(Boolean).length} / ${temas.length}`
                                : `${temasCubiertos.filter(t => t.asistio).length} / ${temas.length}`
                            }
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {temas.map((tema) => {
                        const isExpanded = expandedTema === tema.id;
                        const cubierto = temasCubiertos.find(t => t.tema_id === tema.id);
                        const estado = cubierto?.asistio ? 'completado' : (cubierto?.confirmo_asistencia ? 'reservado' : 'pendiente');
                        const finalizado = isTemaFinalizado(tema.id);

                        return (
                            <div key={tema.id} className="group bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-black/50">
                                <div className="p-5 cursor-pointer" onClick={() => setExpandedTema(isExpanded ? null : tema.id)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-white font-semibold text-base group-hover:text-[#FF7939] transition-colors">{tema.nombre}</h3>

                                                {!isDocument && estado === 'completado' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                                {!isDocument && finalizado && <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full border border-gray-600">Finalizado</span>}
                                                {!isDocument && estado === 'reservado' && !finalizado && <span className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-2 py-0.5 rounded-full border border-[#FF7939]/30">Reservado</span>}

                                                {isDocument && (
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); onToggleDocumentProgress?.(tema.id); }}
                                                        className={`ml-2 p-1 rounded-full border transition-all cursor-pointer ${documentProgress[tema.id]
                                                            ? 'bg-[#FF7939]/20 border-[#FF7939] text-[#FF7939]'
                                                            : 'border-gray-600 text-gray-600 hover:border-[#FF7939]/50'
                                                            }`}
                                                    >
                                                        {documentProgress[tema.id] ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full" />}
                                                    </div>
                                                )}
                                            </div>

                                            {!isDocument && (
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {!isExpanded && tema.descripcion && (
                                                        <p className="text-gray-400 text-xs line-clamp-1">{tema.descripcion}</p>
                                                    )}
                                                    {cubierto?.asistio ? (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                                            <p className="text-green-400 text-[11px] font-semibold">Asististe el {formatDate(cubierto.fecha_seleccionada!)}</p>
                                                        </div>
                                                    ) : finalizado ? (
                                                        cubierto?.fecha_seleccionada ? (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <X className="w-3.5 h-3.5 text-red-400" />
                                                                <p className="text-red-400 text-[11px] font-semibold">No asististe ({formatDate(cubierto.fecha_seleccionada)})</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <X className="w-3.5 h-3.5 text-gray-400" />
                                                                <p className="text-gray-400 text-[11px]">Clase finalizada - Ausente</p>
                                                            </div>
                                                        )
                                                    ) : (estado === 'reservado' && cubierto?.fecha_seleccionada && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                                            <p className="text-gray-500 text-[11px] font-medium">Te inscribiste para el {formatDate(cubierto.fecha_seleccionada)}</p>
                                                        </div>
                                                    ))}
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

                                            {!isDocument && !finalizado && (
                                                <div className="pt-2">
                                                    {estado === 'reservado' ? (
                                                        <div className="bg-[#FF7939]/10 rounded-xl p-3 border border-[#FF7939]/30 flex justify-between items-center">
                                                            <div className="text-sm">
                                                                <div className="font-semibold text-[#FF7939]">Tu Reserva</div>
                                                                {cubierto && <span className="text-gray-200 text-xs">{formatDate(cubierto.fecha_seleccionada!)} • {cubierto.horario_seleccionado?.hora_inicio}</span>}
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); onEditarReservacion?.(tema.id); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2">
                                                            {(() => {
                                                                const pendiente = temasPendientes.find(t => t.tema_id === tema.id);
                                                                const horarios = (pendiente as any)?.snapshot_originales?.fechas_horarios || [];
                                                                const filtered = horarios.filter((h: any) => !enrollment?.expiration_date || h.fecha <= enrollment.expiration_date.split('T')[0]);

                                                                if (filtered.length === 0) return <p className="text-gray-500 text-xs italic">No hay horarios disponibles.</p>;

                                                                return (
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Horarios Disponibles</h4>
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            {filtered.map((horario: any, idx: number) => {
                                                                                const ocupados = cuposOcupados[`${tema.id}-${horario.fecha}-${horario.hora_inicio}`] || 0;
                                                                                const disponibles = horario.cupo - ocupados;
                                                                                const isLleno = disponibles <= 0;
                                                                                return (
                                                                                    <div key={idx} onClick={() => !isLleno && onSelectHorario?.(tema.id, tema.nombre, horario.fecha, horario)}
                                                                                        className={`flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-all ${isLleno ? 'opacity-50 bg-gray-900 border-gray-800' : 'hover:border-[#FF7939] bg-white/5 border-white/5 hover:bg-[#FF7939]/5'}`}>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-white text-xs font-semibold">{formatDate(horario.fecha)}</span>
                                                                                            <span className="text-[10px] text-gray-500">{horario.hora_inicio} - {horario.hora_fin}</span>
                                                                                        </div>
                                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isLleno ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                                                                                            {disponibles} cupos
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
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
                                                            onClick={(e) => { e.stopPropagation(); onDownloadPdf?.(tema.pdf_url!); }}
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
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
