import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'
import { StorageFile } from '../hooks/storage/useStorageLogic'
import { useAuth } from '@/contexts/auth-context'

interface FilePreviewModalProps {
    file: StorageFile | null
    onClose: () => void
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
    const { user } = useAuth()

    if (!file) return null

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`relative w-full ${file.concept === 'image' ? 'max-w-md' : 'max-w-4xl'} bg-[#050505] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF7939]" />
                        <h4 className="text-white text-xs font-semibold truncate pr-4 opacity-90 tracking-tight">{file.fileName}</h4>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-full h-full min-h-[50vh] max-h-[85vh] overflow-y-auto bg-black flex items-center justify-center relative pt-14">
                    {file.concept === 'video' ? (
                        <div className="w-full aspect-video">
                            <UniversalVideoPlayer
                                libraryId={file.libraryId}
                                videoUrl={file.url}
                                bunnyVideoId={file.fileId}
                                controls={true}
                                autoPlay={true}
                                className="w-full h-full"
                            />
                        </div>
                    ) : file.concept === 'pdf' ? (
                        <iframe
                            src={file.url}
                            className="w-full h-[70vh] border-none"
                            title={file.fileName}
                        />
                    ) : (
                        <img
                            src={file.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/coaches/${user?.id}/images/${file.fileName}`}
                            className="w-full h-auto object-contain"
                        />
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
