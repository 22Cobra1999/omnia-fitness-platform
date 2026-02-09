
import React, { Dispatch, SetStateAction } from 'react'
import { FileText, FileUp, Trash, Plus, Flame } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DocumentMaterialState, DocumentTopic, PdfSelectionContext } from '../product-constants'

interface DocumentMaterialStepProps {
    documentMaterial: DocumentMaterialState
    setDocumentMaterial: Dispatch<SetStateAction<DocumentMaterialState>>
    selectedTopics: Set<string>
    setSelectedTopics: Dispatch<SetStateAction<Set<string>>>
    openPdfGallery: (context: PdfSelectionContext) => void
    uploadingPdf: string | null
}

export function DocumentMaterialStep({
    documentMaterial,
    setDocumentMaterial,
    selectedTopics,
    setSelectedTopics,
    openPdfGallery,
    uploadingPdf
}: DocumentMaterialStepProps) {

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">
                ¿Cómo querés organizar los documentos?
            </h3>

            {/* Opción: Documento único o por tema */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setDocumentMaterial(prev => ({ ...prev, pdfType: 'general', topics: [] }))}
                    className={`p-4 rounded-lg border transition-all text-left ${documentMaterial.pdfType === 'general'
                        ? 'border-[#FF7939] bg-[#FF7939]/10'
                        : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                        }`}
                >
                    <FileText className="h-5 w-5 mb-2 text-[#FF7939]" />
                    <div className="text-sm font-semibold text-white">Documento único</div>
                    <div className="text-xs text-gray-400 mt-1">Un PDF para todo el producto</div>
                </button>

                <button
                    type="button"
                    onClick={() => setDocumentMaterial(prev => ({ ...prev, pdfType: 'by-topic' }))}
                    className={`p-4 rounded-lg border transition-all text-left ${documentMaterial.pdfType === 'by-topic'
                        ? 'border-[#FF7939] bg-[#FF7939]/10'
                        : 'border-white/10 bg-black hover:border-[#FF7939]/50'
                        }`}
                >
                    <FileText className="h-5 w-5 mb-2 text-[#FF7939]" />
                    <div className="text-sm font-semibold text-white">Por tema</div>
                    <div className="text-xs text-gray-400 mt-1">Un PDF por cada tema</div>
                </button>
            </div>

            {/* PDF General */}
            {documentMaterial.pdfType === 'general' && (
                <div className="rounded-lg border border-white/10 bg-black p-4">
                    <div className="text-sm font-semibold text-white mb-3">Documento del producto</div>
                    <button
                        type="button"
                        onClick={() => openPdfGallery({ scope: 'general' })}
                        disabled={uploadingPdf === 'general'}
                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center justify-center gap-2">
                            {uploadingPdf === 'general' ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-[#FF7939] border-t-transparent rounded-full" />
                                    <span>Subiendo...</span>
                                </>
                            ) : (
                                <>
                                    <FileUp className="h-4 w-4 text-[#FF7939]" />
                                    <span>{documentMaterial.pdfUrl ? 'Cambiar PDF' : 'Seleccionar PDF'}</span>
                                </>
                            )}
                        </div>
                    </button>
                    {documentMaterial.pdfFileName && (
                        <div className="text-xs text-[#FF7939] mt-2 text-center flex items-center justify-center gap-1">
                            <span>✓</span>
                            <span className="truncate max-w-[200px]">{documentMaterial.pdfFileName}</span>
                        </div>
                    )}
                </div>
            )}

            {/* PDFs por tema - SIEMPRE visible para permitir índices y edición de temas */}
            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">
                        {documentMaterial.pdfType === 'general' ? 'Índice de temas (opcional)' : 'Temas y archivos'}
                    </div>

                    {/* Botón de acción masiva para subir PDF a seleccionados */}
                    {selectedTopics.size > 0 && (
                        <button
                            type="button"
                            onClick={() => openPdfGallery({ scope: 'topic', topicTitle: 'bulk-selection' })}
                            className="px-3 py-1.5 rounded-lg bg-[#FF7939] hover:bg-[#E66829] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                        >
                            <FileUp className="h-3.5 w-3.5" />
                            <span>Asignar PDF a ({selectedTopics.size})</span>
                        </button>
                    )}
                </div>

                {/* Header de la lista de temas con "Select All" */}
                {(documentMaterial.topics.length > 0 || documentMaterial.pdfType === 'by-topic') && (
                    <div className="flex items-center gap-2 px-2 py-1 border-b border-white/10">
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedTopics.size === documentMaterial.topics.length) {
                                    setSelectedTopics(new Set())
                                } else {
                                    setSelectedTopics(new Set(documentMaterial.topics.map(t => t.id)))
                                }
                            }}
                            className="p-1 hover:bg-white/5 rounded transition-colors"
                            title={selectedTopics.size === documentMaterial.topics.length ? "Deseleccionar todos" : "Seleccionar todos"}
                        >
                            <Flame
                                className={`h-4 w-4 transition-colors ${selectedTopics.size > 0 && selectedTopics.size === documentMaterial.topics.length
                                    ? 'text-[#FF7939]'
                                    : 'text-gray-500 hover:text-white'
                                    }`}
                            />
                        </button>
                        <span className="text-xs text-gray-500">Seleccionar temas para asignar PDF</span>
                    </div>
                )}
                {/* Nuevo tema - solo mostrar si hay temas no guardados (o siempre permitir agregar) */}
                {documentMaterial.topics.filter(t => !t.saved).length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nuevo tema</div>

                        {documentMaterial.topics.filter(t => !t.saved).map((topic, idx) => {
                            const index = documentMaterial.topics.findIndex(t => t.id === topic.id)
                            return (
                                <div key={`${topic.id}-${idx}`} className={`rounded border p-2.5 space-y-2 transition-all ${selectedTopics.has(topic.id)
                                    ? 'border-[#FF7939]/30 bg-[#FF7939]/5'
                                    : 'border-white/10 bg-black'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox "Flame" de selección - SOLO si no es "general" (aunque el original lo mostraba a veces, aquí lo unificamos) */}
                                        {documentMaterial.pdfType !== 'general' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSelected = new Set(selectedTopics)
                                                    if (newSelected.has(topic.id)) {
                                                        newSelected.delete(topic.id)
                                                    } else {
                                                        newSelected.add(topic.id)
                                                    }
                                                    setSelectedTopics(newSelected)
                                                }}
                                                className="mt-1.5 p-1 hover:bg-white/5 rounded transition-colors"
                                            >
                                                <Flame
                                                    className={`h-4 w-4 transition-colors ${selectedTopics.has(topic.id) ? 'text-[#FF7939]' : 'text-gray-600 hover:text-gray-400'
                                                        }`}
                                                />
                                            </button>
                                        )}

                                        <div className="flex-1 space-y-1.5">
                                            <Input
                                                value={topic.title}
                                                onChange={(e) => {
                                                    const newTopics = [...documentMaterial.topics]
                                                    newTopics[index] = { ...topic, title: e.target.value }
                                                    setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                }}
                                                placeholder="Título"
                                                className="bg-white/5 border-white/10 text-white text-sm h-7 px-2"
                                            />
                                            <Textarea
                                                value={topic.description}
                                                onChange={(e) => {
                                                    const newTopics = [...documentMaterial.topics]
                                                    newTopics[index] = { ...topic, description: e.target.value }
                                                    setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                }}
                                                placeholder="Descripción (opcional)"
                                                className="bg-white/5 border-white/10 text-white text-xs min-h-[45px] px-2 py-1.5"
                                            />
                                        </div>

                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => topic.title && openPdfGallery({ scope: 'topic', topicTitle: topic.id })}
                                            disabled={!topic.title || uploadingPdf === topic.id}
                                            className={`flex-1 px-2 py-1 rounded border text-xs flex items-center justify-center gap-1 transition-all ${uploadingPdf === topic.id
                                                ? 'border-[#FF7939]/50 bg-[#FF7939]/10 text-white opacity-70 cursor-wait'
                                                : topic.title
                                                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                                                    : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed text-gray-500'
                                                } ${documentMaterial.pdfType === 'general' ? 'hidden' : ''}`}
                                        >
                                            {uploadingPdf === topic.id ? (
                                                <>
                                                    <div className="animate-spin h-2.5 w-2.5 border border-[#FF7939] border-t-transparent rounded-full" />
                                                    <span>Subiendo...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileUp className="h-2.5 w-2.5" />
                                                    <span>{documentMaterial.topicPdfs[topic.id]?.url ? 'Cambiar' : 'PDF'}</span>
                                                </>
                                            )}
                                        </button>

                                        {documentMaterial.topicPdfs[topic.id]?.url && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocumentMaterial(prev => {
                                                        const newPdfs = { ...prev.topicPdfs }
                                                        delete newPdfs[topic.id]
                                                        return { ...prev, topicPdfs: newPdfs }
                                                    })
                                                }}
                                                className="p-1 rounded border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                            >
                                                <Trash className="h-3.5 w-3.5 text-gray-400" />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (topic.title) {
                                                    const newTopics = [...documentMaterial.topics]
                                                    newTopics[index] = { ...topic, saved: true }
                                                    setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                }
                                            }}
                                            disabled={!topic.title}
                                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${topic.title
                                                ? 'bg-[#FF7939] text-white hover:bg-[#FF7939]/90'
                                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Guardar
                                        </button>

                                        {/* Eliminar tema */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newTopics = documentMaterial.topics.filter(t => t.id !== topic.id)
                                                const newPdfs = { ...documentMaterial.topicPdfs }
                                                delete newPdfs[topic.id]
                                                setDocumentMaterial(prev => ({ ...prev, topics: newTopics, topicPdfs: newPdfs }))
                                            }}
                                            className="p-1 rounded hover:bg-red-500/10 transition-all group/delete"
                                            title="Eliminar tema"
                                        >
                                            <Trash className="h-3.5 w-3.5 text-gray-400 group-hover/delete:text-red-400" />
                                        </button>
                                    </div>

                                    {/* Mostrar estado del PDF */}
                                    {uploadingPdf === topic.id ? (
                                        <div className="text-[10px] text-[#FF7939] truncate px-0.5 font-medium flex items-center gap-1 animate-pulse">
                                            <div className="animate-spin h-2 w-2 border border-[#FF7939] border-t-transparent rounded-full" />
                                            <span>Subiendo PDF...</span>
                                        </div>
                                    ) : documentMaterial.topicPdfs[topic.id]?.fileName && (
                                        <div className="text-[10px] text-[#FF7939] truncate px-0.5 font-medium flex items-center gap-1">
                                            <span>✓</span>
                                            <span className="truncate">{documentMaterial.topicPdfs[topic.id]?.fileName}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Botón agregar tema */}
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
                    className="w-full px-2.5 py-1.5 rounded border border-dashed border-white/20 hover:border-[#FF7939]/50 hover:bg-white/5 transition-all text-white text-xs flex items-center justify-center gap-1.5"
                >
                    <Plus className="h-3 w-3" />
                    <span>Agregar tema</span>
                </button>

                {/* Temas guardados */}
                {documentMaterial.topics.filter(t => t.saved).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                            Temas ({documentMaterial.topics.filter(t => t.saved).length})
                        </div>
                        <div className="space-y-1.5">
                            {documentMaterial.topics.filter(t => t.saved).map((topic, idx) => {
                                const index = documentMaterial.topics.findIndex(t => t.id === topic.id)
                                return (
                                    <div key={`${topic.id}-${idx}`} className={`group rounded border p-1.5 transition-all ${selectedTopics.has(topic.id)
                                        ? 'border-[#FF7939]/30 bg-[#FF7939]/5'
                                        : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            {/* Checkbox "Select" */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSelected = new Set(selectedTopics)
                                                    if (newSelected.has(topic.id)) {
                                                        newSelected.delete(topic.id)
                                                    } else {
                                                        newSelected.add(topic.id)
                                                    }
                                                    setSelectedTopics(newSelected)
                                                }}
                                                className="p-1 rounded cursor-pointer"
                                            >
                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${selectedTopics.has(topic.id)
                                                    ? 'bg-[#FF7939] border-[#FF7939]'
                                                    : 'border-white/30 bg-transparent group-hover:border-white/50'
                                                    }`}>
                                                    {selectedTopics.has(topic.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-medium text-white truncate">{topic.title}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newTopics = [...documentMaterial.topics]
                                                            newTopics[index] = { ...topic, saved: false }
                                                            setDocumentMaterial(prev => ({ ...prev, topics: newTopics }))
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                                        title="Editar"
                                                    >
                                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {topic.description && (
                                                    <div className="text-[10px] text-gray-500 truncate">{topic.description}</div>
                                                )}
                                            </div>

                                            {/* PDF status indicator */}
                                            {documentMaterial.pdfType === 'by-topic' && (
                                                <div className="flex items-center">
                                                    {documentMaterial.topicPdfs[topic.id] ? (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FF7939]/10 border border-[#FF7939]/20">
                                                            <FileText className="h-3 w-3 text-[#FF7939]" />
                                                            <span className="text-[10px] text-[#FF7939]">PDF</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => openPdfGallery({ scope: 'topic', topicTitle: topic.id })}
                                                            className="opacity-50 hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
                                                        >
                                                            <Plus className="h-3 w-3 text-gray-400" />
                                                            <span className="text-[10px] text-gray-400">PDF</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
