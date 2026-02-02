import React, { RefObject } from 'react'
import { Loader2, ImageIcon, Video, Upload } from 'lucide-react'

interface ProductMediaUploaderProps {
    mediaType: 'image' | 'video'
    imageUrl?: string
    videoUrl?: string
    videoEmbedUrl?: string | null
    isUploading: boolean
    error?: string | null
    onMediaTypeChange: (type: 'image' | 'video') => void
    onUploadClick: () => void
    fileInputRef: RefObject<HTMLInputElement>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ProductMediaUploader({
    mediaType,
    imageUrl,
    videoUrl,
    videoEmbedUrl,
    isUploading,
    error,
    onMediaTypeChange,
    onUploadClick,
    fileInputRef,
    onFileChange
}: ProductMediaUploaderProps) {

    return (
        <div className="space-y-2">
            <div className="text-base font-bold text-white uppercase tracking-wider">Video y foto</div>
            <div className="mx-auto w-full md:w-[60%]">
                <div
                    className={`relative rounded-xl border border-white/10 bg-black overflow-hidden mx-auto ${mediaType === 'image'
                        ? 'w-[240px] max-w-full aspect-[5/6]'
                        : 'w-full aspect-video'
                        }`}
                >
                    {/* ✅ FEEDBACK DE CARGA */}
                    {isUploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 text-[#FF7939] animate-spin mb-2" />
                            <span className="text-xs text-white font-medium">Subiendo archivo...</span>
                        </div>
                    )}

                    {mediaType === 'image' && imageUrl ? (
                        <div className="relative w-full h-full">
                            <img
                                src={imageUrl}
                                alt="Portada"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : mediaType === 'video' && (videoEmbedUrl || videoUrl) ? (
                        <div className="relative w-full h-full bg-black">
                            {videoEmbedUrl ? (
                                <iframe
                                    src={videoEmbedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen={true}
                                />
                            ) : (
                                <video
                                    src={videoUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                />
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 py-12">
                            {mediaType === 'image' ? (
                                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                            ) : (
                                <Video className="h-12 w-12 mb-2 opacity-50" />
                            )}
                            <span className="text-xs">
                                {mediaType === 'image' ? 'Sin imagen seleccionada' : 'Sin video seleccionado'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onMediaTypeChange('image')}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${mediaType === 'image'
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                                }`}
                        >
                            <ImageIcon className="h-4 w-4 text-[#FF7939]" />
                            Foto
                        </button>
                        <button
                            type="button"
                            onClick={() => onMediaTypeChange('video')}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${mediaType === 'video'
                                ? 'border-[#FF7939] bg-[#FF7939]/10 text-white'
                                : 'border-white/10 bg-black text-gray-300 hover:border-[#FF7939]/50'
                                }`}
                        >
                            <Video className="h-4 w-4 text-[#FF7939]" />
                            Video
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                            className="hidden"
                            onChange={onFileChange}
                        />
                        <button
                            type="button"
                            onClick={onUploadClick}
                            className="px-3 py-2 rounded-lg border border-white/10 bg-black text-xs font-semibold text-gray-300 hover:border-[#FF7939]/50 transition-all flex items-center gap-2"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-[#FF7939]" />
                            ) : (
                                <Upload className="h-4 w-4 text-[#FF7939]" />
                            )}
                            Subir
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-xs text-red-400">{error}</div>
            )}
        </div>
    )
}
