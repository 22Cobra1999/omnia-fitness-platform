
import React, { Dispatch, SetStateAction } from 'react'
import { FileUp, Trash } from 'lucide-react'
import { WorkshopMaterialState, PdfSelectionContext } from '../product-constants'

interface WorkshopMaterialStepProps {
    workshopMaterial: WorkshopMaterialState
    setWorkshopMaterial: Dispatch<SetStateAction<WorkshopMaterialState>>
    workshopSchedule: any[]
    openPdfGallery: (context: PdfSelectionContext) => void
}

export function WorkshopMaterialStep({
    workshopMaterial,
    setWorkshopMaterial,
    workshopSchedule,
    openPdfGallery
}: WorkshopMaterialStepProps) {

    // Simple helper to truncate long filenames
    const truncateLabel = (label: string, maxLength = 25) => {
        if (label.length <= maxLength) return label
        return label.substring(0, maxLength - 3) + '...'
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {/* Type Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            setWorkshopMaterial(prev => ({
                                ...prev,
                                pdfType: 'none',
                                pdfFile: null,
                                pdfUrl: null,
                                topicPdfs: {}
                            }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition-all ${workshopMaterial.pdfType === 'none'
                            ? 'border-[#FF7939] bg-[#FF7939]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <div className="text-sm font-semibold text-white">Sin PDF</div>
                        <div className="text-xs text-gray-400">No agregar material.</div>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setWorkshopMaterial(prev => ({
                                ...prev,
                                pdfType: 'general',
                                topicPdfs: {}
                            }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition-all ${workshopMaterial.pdfType === 'general'
                            ? 'border-[#FF7939] bg-[#FF7939]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <div className="text-sm font-semibold text-white">Un PDF para todos</div>
                        <div className="text-xs text-gray-400">El mismo archivo en cada tema.</div>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setWorkshopMaterial(prev => ({
                                ...prev,
                                pdfType: 'by-topic',
                                pdfFile: null,
                                pdfUrl: null
                            }))
                        }
                        className={`rounded-lg border px-3 py-3 text-left transition-all ${workshopMaterial.pdfType === 'by-topic'
                            ? 'border-[#FF7939] bg-[#FF7939]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <div className="text-sm font-semibold text-white">PDF por tema</div>
                        <div className="text-xs text-gray-400">Un archivo distinto para cada tema.</div>
                    </button>
                </div>

                {/* General PDF Option */}
                {workshopMaterial.pdfType === 'general' && (
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-white">PDF general</div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => openPdfGallery({ scope: 'general' })}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                                title="Seleccionar PDF"
                            >
                                <FileUp className="w-4 h-4 text-[#FF7939]" />
                            </button>
                            {(workshopMaterial.pdfFile || workshopMaterial.pdfUrl) ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setWorkshopMaterial(prev => ({
                                            ...prev,
                                            pdfFile: null,
                                            pdfUrl: null
                                        }))
                                    }
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                                    title="Quitar PDF"
                                >
                                    <Trash className="w-4 h-4 text-red-400" />
                                </button>
                            ) : (
                                <div className="text-xs text-gray-500">Sin archivos seleccionados</div>
                            )}
                        </div>
                        {(workshopMaterial.pdfUrl || workshopMaterial.pdfFile) && (
                            <div className="text-xs text-gray-500">
                                {truncateLabel(workshopMaterial.pdfFile?.name || workshopMaterial.pdfUrl || '')}
                            </div>
                        )}
                    </div>
                )}

                {/* By Topic PDF Option */}
                {workshopMaterial.pdfType === 'by-topic' && (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-white">PDFs por tema</div>
                        <div className="space-y-3">
                            {Array.from(
                                new Set(
                                    (workshopSchedule || [])
                                        .map((s: any) => String(s?.title || '').trim())
                                        .filter(Boolean)
                                )
                            ).map((topicTitle, idx) => {
                                const current = workshopMaterial.topicPdfs?.[topicTitle]
                                return (
                                    <div
                                        key={`${topicTitle}-${idx}`}
                                        className="py-2"
                                    >
                                        <div className="text-sm font-semibold text-white mb-2">{topicTitle}</div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openPdfGallery({ scope: 'topic', topicTitle })}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                                                title="Seleccionar PDF"
                                            >
                                                <FileUp className="w-4 h-4 text-[#FF7939]" />
                                            </button>

                                            {(current?.file || current?.url) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWorkshopMaterial(prev => {
                                                            const next = { ...(prev.topicPdfs || {}) }
                                                            delete (next as any)[topicTitle]
                                                            return {
                                                                ...prev,
                                                                topicPdfs: next
                                                            }
                                                        })
                                                    }}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 bg-white/10 hover:bg-white/15 transition-all"
                                                    title="Quitar PDF"
                                                >
                                                    <Trash className="w-4 h-4 text-red-400" />
                                                </button>
                                            ) : (
                                                <div className="text-xs text-gray-500">Sin archivos seleccionados</div>
                                            )}
                                        </div>

                                        {(current?.url || current?.file) && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {truncateLabel(current?.file?.name || current?.url || '')}
                                            </div>
                                        )}

                                        <div className="mt-3 h-px w-full bg-white/10" />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
