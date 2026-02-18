import React, { Dispatch, SetStateAction } from 'react'
import { FileText, FileUp, Trash, Plus, Flame, ChevronDown, LayoutGrid } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DocumentMaterialState, PdfSelectionContext } from '../product-constants'
import { PdfVerticalItem } from '../components/PdfVerticalItem'

interface DocumentMaterialStepProps {
    documentMaterial: DocumentMaterialState
    setDocumentMaterial: Dispatch<SetStateAction<DocumentMaterialState>>
    selectedTopics: Set<string>
    setSelectedTopics: Dispatch<SetStateAction<Set<string>>>
    openPdfLibrary: (context: PdfSelectionContext) => void
    uploadNewPdf: (context: PdfSelectionContext) => void
    openPdfGallery?: (context: PdfSelectionContext) => void // Deprecated
    uploadingPdf: string | null
}

export function DocumentMaterialStep({
    documentMaterial,
    setDocumentMaterial,
    selectedTopics,
    setSelectedTopics,
    openPdfLibrary,
    uploadNewPdf,
    openPdfGallery,
    uploadingPdf
}: DocumentMaterialStepProps) {

    const options = [
        { id: 'general', label: 'Único', icon: FileText },
        { id: 'by-topic', label: 'Por Temas', icon: LayoutGrid }
    ]

    return (
        <div className="space-y-5">
            <div className="space-y-1.5 px-1">
                <h3 className="text-xl font-black text-white tracking-tight">Material de Apoyo</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Define el contenido de este recurso</p>
            </div>

            {/* Selector de Tipo Compacto */}
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-1">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDocumentMaterial(prev => ({ ...prev, pdfType: opt.id as any, topics: opt.id === 'general' ? [] : prev.topics }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${documentMaterial.pdfType === opt.id
                            ? 'bg-[#FF7939] text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <opt.icon className="h-3.5 w-3.5" />
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>

            {/* PDF General Flow */}
            {documentMaterial.pdfType === 'general' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] pl-1">Archivo Maestro</div>
                    {(documentMaterial.pdfUrl || documentMaterial.pdfFileName) ? (
                        <PdfVerticalItem
                            url={documentMaterial.pdfUrl}
                            fileName={documentMaterial.pdfFileName}
                            onRemove={() => setDocumentMaterial(prev => ({ ...prev, pdfUrl: null, pdfFileName: null }))}
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

            {/* By Topics Flow */}
            {documentMaterial.pdfType === 'by-topic' && (
                <div className="space-y-4 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between px-1">
                        <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Temarios y archivos</div>
                        <div className="flex items-center gap-2">
                            {selectedTopics.size > 0 && (
                                <button
                                    type="button"
                                    onClick={() => openPdfLibrary({ scope: 'topic', topicTitle: 'bulk-selection' })}
                                    className="px-3 py-1.5 rounded-lg bg-[#FF7939] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-xl shadow-orange-500/20"
                                >
                                    <FileUp className="h-3 w-3" />
                                    <span>Vincular ({selectedTopics.size})</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    const newTopic = {
                                        id: `topic-${Date.now()}`,
                                        title: '',
                                        description: '',
                                        saved: false
                                    }
                                    setDocumentMaterial(prev => ({ ...prev, topics: [...prev.topics, newTopic] }))
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-black text-[9px] text-white hover:bg-[#FF7939] transition-all uppercase tracking-widest"
                            >
                                <Plus className="h-3 w-3" />
                                <span>Nuevo Tema</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {documentMaterial.topics.map((topic, index) => {
                            const isSaved = topic.saved
                            const currentPdf = documentMaterial.topicPdfs[topic.id]

                            return (
                                <div key={topic.id} className="space-y-1.5">
                                    {!isSaved ? (
                                        <div className="p-3 rounded-xl border border-[#FF7939]/30 bg-[#FF7939]/5 space-y-2.5">
                                            <Input
                                                value={topic.title}
                                                onChange={(e) => {
                                                    const newTopics = [...documentMaterial.topics]
                                                    newTopics[index] = { ...topic, title: e.target.value }
                                                    setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                }}
                                                placeholder="Título del tema..."
                                                className="bg-black/20 border-white/5 text-white text-[13px] font-bold h-8 px-2 rounded-lg focus:border-[#FF7939]/30 transition-all placeholder:text-gray-700"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (topic.title) {
                                                            const newTopics = [...documentMaterial.topics]
                                                            newTopics[index] = { ...topic, saved: true }
                                                            setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                        }
                                                    }}
                                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${topic.title ? 'bg-[#FF7939] text-white' : 'bg-white/5 text-gray-600'}`}
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newTopics = documentMaterial.topics.filter(t => t.id !== topic.id)
                                                        setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                    }}
                                                    className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 transition-all"
                                                >
                                                    <Trash className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`rounded-xl border p-2 transition-all ${selectedTopics.has(topic.id) ? 'border-[#FF7939]/40 bg-[#FF7939]/5' : 'border-white/5 bg-white/[0.01]'}`}>
                                            <div className="flex items-center gap-2 mb-2 pr-1">
                                                <button
                                                    onClick={() => {
                                                        const newSelected = new Set(selectedTopics)
                                                        newSelected.has(topic.id) ? newSelected.delete(topic.id) : newSelected.add(topic.id)
                                                        setSelectedTopics(newSelected)
                                                    }}
                                                    className={`p-1.5 rounded-lg border transition-all ${selectedTopics.has(topic.id) ? 'bg-[#FF7939]/20 border-[#FF7939]/30' : 'bg-white/5 border-white/5'}`}
                                                >
                                                    <Flame className={`h-3 w-3 ${selectedTopics.has(topic.id) ? 'text-[#FF7939]' : 'text-gray-700'}`} />
                                                </button>
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => {
                                                        const newTopics = [...documentMaterial.topics]
                                                        newTopics[index] = { ...topic, saved: false }
                                                        setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                    }}
                                                >
                                                    <div className="text-[12px] font-bold text-white/90 truncate">{topic.title}</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newTopics = documentMaterial.topics.filter(t => t.id !== topic.id)
                                                        setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 transition-all"
                                                >
                                                    <Trash className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {currentPdf ? (
                                                <PdfVerticalItem
                                                    url={currentPdf.url}
                                                    fileName={currentPdf.fileName}
                                                    onRemove={() => {
                                                        setDocumentMaterial(prev => {
                                                            const newPdfs = { ...prev.topicPdfs }
                                                            delete newPdfs[topic.id]
                                                            return { ...prev, topicPdfs: newPdfs }
                                                        })
                                                    }}
                                                    onReplace={() => openPdfLibrary({ scope: 'topic', topicTitle: topic.id })}
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => openPdfGallery && openPdfGallery({ scope: 'topic', topicTitle: topic.id })}
                                                    className="w-full group flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-[#FF7939]/30 hover:bg-[#FF7939]/5 transition-all text-left"
                                                >
                                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-[#FF7939]/10 group-hover:border-[#FF7939]/20 transition-all text-[#FF7939]">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 px-1">
                                                        <div className="text-[11px] font-bold text-white/40">Sin documento asignado</div>
                                                        <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Click para agregar</div>
                                                    </div>
                                                    <div className="p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Plus className="h-3 w-3 text-[#FF7939]" />
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {documentMaterial.topics.length === 0 && (
                            <div className="py-10 flex flex-col items-center justify-center text-center opacity-20 grayscale transition-all hover:opacity-40">
                                <LayoutGrid className="h-6 w-6 text-gray-500 mb-2" />
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Sin temas definidos</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
