import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { CoachMedia } from '../types'

interface PdfSelectionItemProps {
    item: CoachMedia
    isSelected: boolean
    onSelect: () => void
    onPreview?: () => void // Kept for compatibility but now it expands
}

export function PdfSelectionItem({
    item,
    isSelected,
    onSelect
}: PdfSelectionItemProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const fileName = item.filename || 'Documento PDF'
    const usageLabel = item.activity_title || 'Sin asignar'
    const url = item.pdf_url

    return (
        <motion.div
            whileHover={{ scale: 0.995 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-xl border transition-all overflow-hidden ${isSelected
                    ? 'bg-[#FF7939]/10 border-[#FF7939]/40'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                }`}
        >
            <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={onSelect}
            >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#FF7939]/20' : 'bg-white/5'}`}>
                    <FileText className={`h-5 w-5 ${isSelected ? 'text-[#FF7939]' : 'text-gray-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{fileName}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{usageLabel}</div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsExpanded(!isExpanded)
                        }}
                        className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-[#FF7939]/20 text-[#FF7939]' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        title="Previsualizar"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                        ? 'bg-[#FF7939] border-[#FF7939]'
                        : 'border-white/10'
                        }`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && url && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-3 pb-3">
                            <div className="relative aspect-[3/4] w-full bg-[#050505] rounded-lg border border-white/5 overflow-hidden">
                                <iframe
                                    src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full border-none opacity-90"
                                    title="PDF Preview"
                                />
                                <div className="absolute bottom-2 right-2">
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1.5 rounded-lg bg-black/80 backdrop-blur-xl border border-white/10 text-white hover:bg-[#FF7939] transition-all flex items-center gap-1.5 text-[9px] font-black"
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
        </motion.div>
    )
}
