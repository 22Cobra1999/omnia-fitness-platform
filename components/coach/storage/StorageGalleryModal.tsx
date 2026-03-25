import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Film, Image as ImageIcon, FileText } from 'lucide-react'
import { StorageFile } from '../hooks/storage/useStorageLogic'

interface StorageGalleryModalProps {
    show: boolean
    concept: 'video' | 'image' | 'pdf'
    files: StorageFile[]
    onClose: () => void
    onSelect: (file: StorageFile) => void
}

export function StorageGalleryModal({ show, concept, files, onClose, onSelect }: StorageGalleryModalProps) {
    const [searchTerm, setSearchTerm] = React.useState('')
    
    // Filtrar por concepto y búsqueda
    const filteredFiles = files.filter(f => 
        f.concept === concept && 
        f.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-[#0A0A0A] w-full max-w-2xl h-[80vh] rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Galería de {concept === 'video' ? 'Videos' : concept === 'image' ? 'Fotos' : 'PDFs'}</h3>
                            <p className="text-[#FF7939] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Selecciona un archivo existente</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#FF7939] transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar en el almacenamiento..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#FF7939]/50 transition-all placeholder:text-white/20"
                        />
                    </div>
                </div>

                {/* Grid de archivos */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {filteredFiles.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {filteredFiles.map(file => (
                                <motion.div
                                    key={file.fileId}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelect(file)}
                                    className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#FF7939]/5 hover:border-[#FF7939]/30 transition-all group"
                                >
                                    <div className="aspect-square w-full rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden relative border border-white/5">
                                        {file.concept === 'image' && file.url ? (
                                            <img src={file.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        ) : file.concept === 'video' ? (
                                            <Film className="w-8 h-8 text-[#FF7939]/40 group-hover:text-[#FF7939] transition-colors" />
                                        ) : (
                                            <FileText className="w-8 h-8 text-[#FF7939]/40 group-hover:text-[#FF7939] transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Seleccionar</span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full text-center px-2">
                                        <p className="text-white text-[11px] font-medium truncate mb-1">{file.fileName}</p>
                                        <p className="text-white/20 text-[9px] uppercase tracking-tighter">
                                            {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 px-12 text-center">
                            <ImageIcon className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">No se encontraron archivos</p>
                            <p className="text-xs mt-1">Intenta con otro término de búsqueda o asegúrate de que existan archivos cargados.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
