import React, { Dispatch, SetStateAction } from 'react'
import { FileUp, Info, Ban, LayoutGrid, FileText, ChevronDown, Plus } from 'lucide-react'
import { WorkshopMaterialState, PdfSelectionContext } from '../product-constants'
import { PdfVerticalItem } from '../components/PdfVerticalItem'

interface WorkshopMaterialStepProps {
    workshopMaterial: WorkshopMaterialState
    setWorkshopMaterial: Dispatch<SetStateAction<WorkshopMaterialState>>
    workshopSchedule: any[]
    openPdfLibrary: (context: PdfSelectionContext) => void
    uploadNewPdf: (context: PdfSelectionContext) => void
    openPdfGallery?: (context: PdfSelectionContext) => void // Deprecated
}

export function WorkshopMaterialStep({
    workshopMaterial,
    setWorkshopMaterial,
    workshopSchedule,
    openPdfLibrary,
    uploadNewPdf,
    openPdfGallery
}: WorkshopMaterialStepProps) {

    const options = [
        { id: 'none', label: 'Sin PDF', icon: Ban },
        { id: 'general', label: 'Único', icon: FileText },
        { id: 'by-topic', label: 'Por Tema', icon: LayoutGrid }
    ]

    return (
        <div className="space-y-5">
            <div className="space-y-1 px-1">
                <h3 className="text-xl font-black text-white tracking-tight">Material de Apoyo</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Configura los documentos del taller</p>
            </div>

            {/* Selector de Organización Compacto */}
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-1">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWorkshopMaterial(prev => ({ ...prev, pdfType: opt.id as any }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${workshopMaterial.pdfType === opt.id
                            ? 'bg-[#FF7939] text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <opt.icon className="h-3.5 w-3.5" />
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>

            {/* Área de PDF General */}
            {workshopMaterial.pdfType === 'general' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Archivo Maestro</div>
                    {(workshopMaterial.pdfUrl || workshopMaterial.pdfFile) ? (
                        <PdfVerticalItem
                            url={workshopMaterial.pdfUrl}
                            fileName={workshopMaterial.pdfFile?.name || null}
                            onRemove={() => setWorkshopMaterial(prev => ({ ...prev, pdfFile: null, pdfUrl: null }))}
                            onReplace={() => openPdfLibrary({ scope: 'general' })}
                        />
                    ) : (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => openPdfLibrary({ scope: 'general' })}
                                className="w-full group flex items-center gap-4 p-3.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-[#FF7939]/30 hover:bg-[#FF7939]/5 transition-all text-left"
                            >
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 group-hover:bg-[#FF7939]/10 group-hover:border-[#FF7939]/20 transition-all text-[#FF7939]">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-black text-white/90 uppercase tracking-widest leading-none mb-1">Mi Biblioteca</div>
                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">Elegir un archivo existente</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => uploadNewPdf({ scope: 'general' })}
                                className="w-full group flex items-center gap-4 p-3.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-[#FF7939]/30 hover:bg-[#FF7939]/5 transition-all text-left"
                            >
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 group-hover:bg-[#FF7939]/10 group-hover:border-[#FF7939]/20 transition-all text-[#FF7939]">
                                    <FileUp className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-black text-white/90 uppercase tracking-widest leading-none mb-1">Subir Nuevo</div>
                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">Desde tu computadora</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* By Topic PDF Option */}
            {workshopMaterial.pdfType === 'by-topic' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between px-1">
                        <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Archivos por tema</div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <Info className="h-2.5 w-2.5 text-blue-400" />
                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">Asignar en temario</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {Array.from(
                            new Set(
                                (workshopSchedule || [])
                                    .map((s: any) => String(s?.title || '').trim())
                                    .filter(Boolean)
                            )
                        ).map((topicTitle, idx) => {
                            const current = workshopMaterial.topicPdfs?.[topicTitle]
                            return (
                                <div key={`${topicTitle}-${idx}`} className="space-y-1.5">
                                    {(current?.url || current?.file) ? (
                                        <PdfVerticalItem
                                            label={topicTitle}
                                            url={current?.url || null}
                                            fileName={current?.file?.name || null}
                                            onRemove={() => {
                                                setWorkshopMaterial(prev => {
                                                    const next = { ...(prev.topicPdfs || {}) }
                                                    delete (next as any)[topicTitle]
                                                    return { ...prev, topicPdfs: next }
                                                })
                                            }}
                                            onReplace={() => openPdfLibrary({ scope: 'topic', topicTitle })}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => openPdfGallery && openPdfGallery({ scope: 'topic', topicTitle })}
                                            className="w-full group flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-[#FF7939]/30 hover:bg-[#FF7939]/5 transition-all text-left"
                                        >
                                            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-[#FF7939]/10 group-hover:border-[#FF7939]/20 transition-all text-[#FF7939]">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest truncate">/ {topicTitle}</span>
                                                </div>
                                                <div className="text-[11px] font-bold text-white/40">Sin PDF asignado</div>
                                            </div>
                                            <div className="p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                                <Plus className="h-3 w-3 text-[#FF7939]" />
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* No PDF */}
            {workshopMaterial.pdfType === 'none' && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 opacity-30 grayscale grayscale-1 transition-all hover:opacity-50">
                    <Ban className="h-6 w-6 text-gray-600" />
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Sin material visual</p>
                </div>
            )}
        </div>
    )
}
