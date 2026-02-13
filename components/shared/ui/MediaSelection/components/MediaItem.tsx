import { motion } from 'framer-motion'
import Image from 'next/image'
import { Play, Check } from 'lucide-react'
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player'
import { CoachMedia, MediaType } from '../types'

interface MediaItemProps {
    item: CoachMedia
    index: number
    isSelected: boolean
    onSelect: () => void
    mediaType: MediaType
    setIsPreviewPlaying: (val: boolean) => void
    setPreviewImage: (item: CoachMedia) => void
}

export function MediaItem({
    item,
    index,
    isSelected,
    onSelect,
    mediaType,
    setIsPreviewPlaying,
    setPreviewImage
}: MediaItemProps) {
    const isCatalog = !!(item.nombre_ejercicio || item.nombre_plato)
    const usageLabelRaw = mediaType === 'image'
        ? item.activity_title || 'Portada'
        : isCatalog
            ? item.nombre_ejercicio || item.nombre_plato || 'Sin uso'
            : item.activity_title || 'Sin uso'

    const truncate = (str: string, len: number) => str.length > len ? str.slice(0, len - 3) + '...' : str
    const usageLabel = truncate(usageLabelRaw, 15)
    const fileName = truncate(item.filename, 15)

    const coverSrc = mediaType === 'image' ? item.image_url || null : item.video_thumbnail_url || null
    const widthClass = mediaType === 'image' ? 'w-40' : 'w-56'
    const heightClass = mediaType === 'image' ? 'h-48' : 'h-32'

    return (
        <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            type="button"
            onClick={(e) => {
                e.stopPropagation()
                onSelect()
                setPreviewImage(item)
            }}
            className={`flex-shrink-0 text-left rounded-xl border overflow-hidden bg-black ${isSelected ? 'border-[#FF7939]' : 'border-white/10 hover:border-[#FF7939]/50'}`}
        >
            <div className={`relative ${widthClass} ${heightClass} bg-[#111111]`}>
                {coverSrc ? (
                    <Image src={coverSrc} alt={item.filename} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        {mediaType === 'video' && item.video_url ? (
                            <video src={item.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        ) : 'Sin preview'}
                    </div>
                )}

                {mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewImage(item); setIsPreviewPlaying(true); }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-[#FF7939]' : 'bg-black/60'}`}
                        >
                            <Play className="h-4 w-4 ml-0.5 text-white" />
                        </div>
                    </div>
                )}

                {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#FF7939] rounded-full p-1 shadow-lg z-10">
                        <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                )}
            </div>

            <div className="px-2.5 py-2">
                <div className="text-[11px] text-white font-semibold truncate">{fileName}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#FF7939] border border-[#FF7939]/30 bg-[#FF7939]/10 px-2 py-0.5 rounded-full">
                        {usageLabel}
                    </span>
                </div>
            </div>
        </motion.button>
    )
}
