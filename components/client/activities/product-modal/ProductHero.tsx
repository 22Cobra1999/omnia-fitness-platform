"use client"

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { X, Edit, Trash2, Clock, Flame } from 'lucide-react'
import dynamic from 'next/dynamic'

const UniversalVideoPlayer = dynamic(() => import('@/components/shared/video/universal-video-player').then(mod => mod.UniversalVideoPlayer), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-black/20 animate-pulse flex items-center justify-center text-white/20 text-xs">Cargando reproductor...</div>
})

interface ProductHeroProps {
    product: any
    logic: any
    onEdit?: (product: any) => void
    onDelete?: (product: any) => void
    showEditButton?: boolean
}

export function ProductHero({ product, logic, onEdit, onDelete, showEditButton }: ProductHeroProps) {
    const {
        isPaused,
        isTogglingPause,
        handleTogglePause,
        isVideoRevealed,
        setIsVideoRevealed,
        handleClose,
        exceedsActivities,
        exceedsWeeks
    } = logic

    const getValidImageUrl = () => {
        const imageUrl = product.activity_media?.[0]?.image_url || product.image?.url || product.image_url
        if (!imageUrl || imageUrl.trim() === '' || imageUrl.includes('via.placeholder.com') || imageUrl.includes('placeholder.svg')) {
            return null
        }
        return imageUrl
    }

    const handleVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsVideoRevealed(true)
    }

    const isWorkshopInactive = product?.type === 'workshop' && (product as any).taller_activo === false

    return (
        <div className="relative w-full h-64 rounded-none overflow-hidden mb-6">
            {/* Botón Pausar Ventas - Esquina inferior izquierda */}
            {showEditButton && (
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <span className="text-white text-sm font-medium">
                        {isPaused
                            ? (product.type === 'workshop' && isWorkshopInactive)
                                ? 'Taller finalizado'
                                : (exceedsActivities || exceedsWeeks || (product.pause_reasons && product.pause_reasons.length > 0))
                                    ? 'Ventas pausadas - Exceso de límites'
                                    : 'Ventas pausadas'
                            : 'Ventas activas'}
                    </span>
                    <Switch
                        checked={!isPaused}
                        onCheckedChange={handleTogglePause}
                        disabled={isTogglingPause || (product.type === 'workshop' && isWorkshopInactive && !isPaused)}
                        className="data-[state=checked]:bg-[#FF7939]"
                    />
                    {isTogglingPause && <Clock className="h-4 w-4 text-white animate-spin" />}
                </div>
            )}

            {/* Action Buttons Overlay */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                {showEditButton && onEdit && (
                    <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                        aria-label="Editar producto"
                        className="bg-black/50 hover:bg-black/70 text-white"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
                {showEditButton && onDelete && (
                    <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                        aria-label="Eliminar producto"
                        className="bg-black/50 hover:bg-black/70 text-red-400"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="ghost" size="sm"
                    onClick={(e) => { e.stopPropagation(); handleClose(); }}
                    aria-label="Cerrar modal"
                    className="bg-black/50 hover:bg-black/70 text-white"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {product.activity_media?.[0]?.video_url ? (
                <div className="relative w-full h-full">
                    {isVideoRevealed ? (
                        <UniversalVideoPlayer
                            videoUrl={product.activity_media[0].video_url}
                            bunnyVideoId={product.activity_media[0].bunny_video_id}
                            thumbnailUrl={getValidImageUrl()}
                            autoPlay muted={false} controls loop={false}
                            className="w-full h-full object-cover"
                        />
                    ) : getValidImageUrl() ? (
                        <>
                            <Image src={getValidImageUrl()!} alt={product.title} fill className="object-cover" priority />
                            <button
                                onClick={handleVideoClick}
                                aria-label="Reproducir video"
                                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition hover:bg-black/40"
                            >
                                <div className="flex items-center justify-center rounded-full bg-white/10 border border-white/30 backdrop-blur-md p-3">
                                    <svg className="w-8 h-8 text-[#FF7939]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full bg-white/5 flex flex-center flex-col gap-3 justify-center items-center">
                            <div className="w-20 h-20 bg-[#FF7939] rounded-xl flex items-center justify-center"><Flame className="w-10 h-10 text-black" /></div>
                            <span className="text-gray-400 text-2xl font-bold">OMNIA</span>
                        </div>
                    )}
                </div>
            ) : getValidImageUrl() ? (
                <Image src={getValidImageUrl()!} alt={product.title || 'Imagen'} fill className="object-cover" priority />
            ) : (
                <div className="w-full h-full bg-white/5 flex flex-center flex-col gap-3 justify-center items-center">
                    <div className="w-20 h-20 bg-[#FF7939] rounded-xl flex items-center justify-center"><Flame className="w-10 h-10 text-black" /></div>
                    <span className="text-gray-400 text-2xl font-bold">OMNIA</span>
                </div>
            )}
        </div>
    )
}
