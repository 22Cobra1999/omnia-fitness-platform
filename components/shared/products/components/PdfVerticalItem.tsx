import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Trash, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface PdfVerticalItemProps {
    url: string | null
    fileName: string | null
    onRemove: () => void
    onReplace: () => void
    label?: string
}

export const PdfVerticalItem: React.FC<PdfVerticalItemProps> = ({
    url,
    fileName,
    onRemove,
    onReplace,
    label
}) => {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!url && !fileName) return null

    const displayName = fileName || (url ? url.split('/').pop()?.split('?')[0] : 'Documento PDF')

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden transition-all hover:bg-white/[0.03]">
            {/* Header / Summary */}
            <div className="flex items-center justify-between p-2 pl-3 gap-3">
                <div
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="p-1.5 rounded-lg bg-[#FF7939]/5 border border-[#FF7939]/10">
                        <FileText className="h-3.5 w-3.5 text-[#FF7939]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        {label && <span className="text-[9px] font-black text-[#FF7939]/80 uppercase tracking-widest mb-0.5">/ {label}</span>}
                        <span className="text-[13px] font-bold text-white/90 truncate">{displayName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onReplace}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                        title="Cambiar PDF"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-all"
                        title="Eliminar"
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-white/5 mx-0.5" />
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Expandable Preview */}
            <AnimatePresence>
                {isExpanded && url && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div className="px-2 pb-2">
                            <div className="relative aspect-[3/4.2] w-full bg-[#050505] rounded-lg border border-white/5 overflow-hidden shadow-2xl">
                                <iframe
                                    src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full border-none opacity-90"
                                    title="PDF Preview"
                                />
                                <div className="absolute bottom-3 right-3">
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-white hover:bg-[#FF7939] transition-all flex items-center gap-2 text-[10px] font-black"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        EXPANDIR
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
