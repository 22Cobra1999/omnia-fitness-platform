import { MediaItem } from './MediaItem'
import { PdfSelectionItem } from './PdfSelectionItem'
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

    if (mediaType === 'pdf') {
        return (
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 custom-scrollbar">
                {filteredMedia.map((item, index) => (
                    <PdfSelectionItem
                        key={`${item.id}-${index}`}
                        item={item}
                        isSelected={selectedMediaId === item.id}
                        onSelect={() => onSelect(item.id)}
                        onPreview={() => setPreviewImage(item)}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar pb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-1">
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
