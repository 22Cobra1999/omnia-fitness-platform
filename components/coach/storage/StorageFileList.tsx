import { motion } from 'framer-motion'
import { Film, Image as ImageIcon, FileText, FileCheck, X, Eye, Edit, Trash2 } from 'lucide-react'
import { StorageFile } from '../hooks/storage/useStorageLogic'

interface StorageFileListProps {
    files: StorageFile[]
    expanded: boolean
    editingFileName: string | null
    newFileName: string
    onEditFileName: (file: StorageFile) => void
    onSaveFileName: (file: StorageFile) => void
    onCancelEdit: () => void
    setNewFileName: (name: string) => void
    onViewFile: (file: StorageFile) => void
    onDeleteFile: (file: StorageFile) => void
}

export function StorageFileList({
    files,
    expanded,
    editingFileName,
    newFileName,
    onEditFileName,
    onSaveFileName,
    onCancelEdit,
    setNewFileName,
    onViewFile,
    onDeleteFile
}: StorageFileListProps) {

    const formatMB = (gb: number) => {
        const mb = gb * 1024
        if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
        return `${mb.toFixed(1)} MB`
    }

    return (
        <>
            {files.slice(0, expanded ? undefined : 20).map(file => (
                <motion.div key={file.fileId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2.5 border-b border-white/[0.03] last:border-0 group">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-2.5 min-w-0 flex-1">
                            <div className="mt-0.5 opacity-30">
                                {file.concept === 'video' ? <Film className="w-3.5 h-3.5" /> : file.concept === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            </div>

                            <div className="min-w-0 flex-1">
                                {editingFileName === file.fileId ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            autoFocus
                                            className="bg-transparent border-b border-[#FF7939]/50 py-0 text-white text-[11px] w-full focus:outline-none"
                                            value={newFileName}
                                            onChange={e => setNewFileName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') onSaveFileName(file);
                                                if (e.key === 'Escape') onCancelEdit();
                                            }}
                                        />
                                        <button onClick={() => onSaveFileName(file)} className="text-green-500/80"><FileCheck className="w-3.5 h-3.5" /></button>
                                        <button onClick={onCancelEdit} className="text-white/20"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white/5 px-2 py-0.5 rounded-lg inline-block max-w-full">
                                            <span className="text-white/90 text-[11px] font-medium block truncate hover:text-[#FF7939] cursor-pointer transition-colors" onClick={() => (file.concept === 'video' || file.concept === 'image') && onViewFile(file)}>{file.fileName}</span>
                                        </div>
                                        <div className="flex gap-1.5 mt-1.5 overflow-x-auto hide-scrollbar">
                                            {file.activities.map((act, i) => (
                                                <span key={i} className="bg-[#FF7939]/10 text-[#FF7939]/60 text-[8px] font-bold uppercase tracking-tight whitespace-nowrap px-2 py-0.5 rounded-md border border-[#FF7939]/20">{act.name}</span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-3">
                            <span className="text-[#FF7939]/70 text-[10px] font-bold uppercase tracking-tighter bg-[#FF7939]/5 px-1.5 py-0.5 rounded-md">{formatMB(file.sizeGB).split(' ')[0]}mb</span>
                            <div className="flex gap-2">
                                <button onClick={() => onViewFile(file)} className="text-[#FF7939]/60 hover:text-[#FF7939] transition-colors bg-[#FF7939]/10 p-1.5 rounded-lg border border-[#FF7939]/20">
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onEditFileName(file)} className="text-white/40 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/10">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDeleteFile(file)} className="text-red-500/50 hover:text-red-500 transition-colors bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </>
    )
}
