import { ChevronDown, ChevronUp, CheckCircle, Star } from "lucide-react"

interface WorkshopHeaderProps {
    activityTitle: string
    activityDescription?: string
    isDescriptionExpanded: boolean
    setIsDescriptionExpanded: (val: boolean) => void
    isDocument: boolean
    isWorkshopExpired: boolean
    attendanceSummary: { totalTopics: number; attendedTopics: number }
    isRated: boolean
    setIsRatingModalOpen: (val: boolean) => void
}

export function WorkshopHeader({
    activityTitle,
    activityDescription,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    isDocument,
    isWorkshopExpired,
    attendanceSummary,
    isRated,
    setIsRatingModalOpen
}: WorkshopHeaderProps) {
    const MAX_DESCRIPTION_LENGTH = 150

    return (
        <>
            <div className="mb-8 p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">{activityTitle}</h1>

                {activityDescription && (
                    <div className="text-gray-300 text-sm leading-relaxed">
                        <p className={isDescriptionExpanded ? '' : 'line-clamp-3'}>
                            {activityDescription}
                        </p>
                        {activityDescription.length > MAX_DESCRIPTION_LENGTH && (
                            <button
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="mt-2 text-[#FF7939] text-xs font-semibold hover:text-[#FF9F70] flex items-center gap-1"
                            >
                                {isDescriptionExpanded ? 'Mostrar menos' : 'Ver más'}
                                {isDescriptionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!isDocument && isWorkshopExpired && (
                <div className="mb-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-base mb-1">Taller Finalizado</h3>
                            <div className="text-gray-400 text-xs space-y-0.5 mb-3">
                                <p>Total: <strong>{attendanceSummary.totalTopics}</strong> temas</p>
                                <p>Asistencia: <strong>{attendanceSummary.attendedTopics}</strong>/{attendanceSummary.totalTopics} clases</p>
                            </div>
                            {!isRated ? (
                                <button
                                    onClick={() => setIsRatingModalOpen(true)}
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
        </>
    )
}
