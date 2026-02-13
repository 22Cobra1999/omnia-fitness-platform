import { MediaItem } from './MediaItem'
import { CoachMedia, MediaType, SourceFilter } from '../types'

interface MediaGalleryProps {
    media: CoachMedia[]
    mediaType: MediaType
    selectedMediaId: string | null
    onSelect: (id: string) => void
    setIsPreviewPlaying: (val: boolean) => void
    setPreviewImage: (item: CoachMedia) => void
    sourceFilter: SourceFilter
}

export function MediaGallery({
    media,
    mediaType,
    selectedMediaId,
    onSelect,
    setIsPreviewPlaying,
    setPreviewImage,
    sourceFilter
}: MediaGalleryProps) {
    const filteredMedia = media.filter((item) => {
        if (mediaType === 'image') return true
        if (item.id.startsWith('new-')) return true
        if (sourceFilter === 'all') return true
        const isCatalog = !!(item.nombre_ejercicio || item.nombre_plato)
        if (sourceFilter === 'catalog') return isCatalog
        return !isCatalog
    })

    return (
        <div className="overflow-x-auto overflow-y-hidden flex-shrink-0">
            <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
                {filteredMedia.map((item, index) => (
                    <MediaItem
                        key={`${item.id}-${index}`}
                        item={item}
                        index={index}
                        isSelected={selectedMediaId === item.id}
                        onSelect={() => onSelect(item.id)}
                        mediaType={mediaType}
                        setIsPreviewPlaying={setIsPreviewPlaying}
                        setPreviewImage={setPreviewImage}
                    />
                ))}
            </div>
        </div>
    )
}
