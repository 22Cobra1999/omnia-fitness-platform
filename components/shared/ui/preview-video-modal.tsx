"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from 'lucide-react'

interface PreviewVideoModalProps {
    isOpen: boolean
    onClose: () => void
    videoUrl: string
    title: string
    libraryId?: string | number
}

export function PreviewVideoModal({ isOpen, onClose, videoUrl, title, libraryId }: PreviewVideoModalProps) {
    if (!isOpen) return null

    // Determine if it's a Bunny ID or a direct URL
    const isBunnyId = videoUrl && !videoUrl.includes('://') && !videoUrl.includes('/')
    const libId = libraryId || '236113'
    const finalSrc = isBunnyId
        ? `https://iframe.mediadelivery.net/embed/${libId}/${videoUrl}?autoplay=true`
        : videoUrl

    console.log('--- PreviewVideoModal Debug ---', {
        title,
        videoUrl,
        libraryId,
        libId,
        isBunnyId,
        finalSrc
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-zinc-800 rounded-[32px] sm:rounded-[32px] [&>button]:hidden">
                <DialogHeader className="p-6 pb-0 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-white text-lg font-bold truncate pr-14">{title}</DialogTitle>
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('--- PreviewVideoModal Close Clicked ---')
                                onClose()
                            }}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white pointer-events-auto z-30"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="aspect-video w-full bg-zinc-950 flex items-center justify-center">
                    {videoUrl ? (
                        isBunnyId || videoUrl.includes('mediadelivery.net') ? (
                            <iframe
                                src={finalSrc}
                                loading="lazy"
                                className="w-full h-full border-none"
                                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                                allowFullScreen
                            />
                        ) : (
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                className="w-full h-full"
                            />
                        )
                    ) : (
                        <div className="text-zinc-500 text-sm">No hay video disponible</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
