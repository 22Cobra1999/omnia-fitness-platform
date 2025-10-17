"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Users, Calendar, FileText, Flame, Clock, MapPin, Target, BookOpen, Zap, ChevronDown, ChevronUp, MessageCircle } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface ExpandedProductCardProps {
  product: {
    id?: number
    title: string
    description: string
    price: number
    type: 'workshop' | 'program' | 'document'
    image?: string | null
    video?: string | null
    videoUrl?: string | null
    difficulty?: string
    duration?: string
    capacity?: number
    sessionsPerClient?: number
    workshopType?: string
    pages?: string
    level?: string
    materials?: string
    modality?: string
    exercisesCount?: number
    totalSessions?: number
    program_rating?: number
    total_program_reviews?: number
    blocks?: Array<{
      id: string
      name: string
      startTime: string
      endTime: string
      color: string
      selectedDates: Date[]
      repeatType: 'days' | 'weeks' | 'months'
      repeatValues: number[] | string[]
    }>
  }
  onPurchase?: () => void
  onClose?: () => void
  csvData?: string[][]
}

export function ExpandedProductCard({ 
  product, 
  onPurchase,
  onClose,
  csvData
}: ExpandedProductCardProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  
  // Funciones para manejar URLs de video
  const extractVimeoId = (url: string): string | null => {
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const match = url.match(vimeoRegex);
    return match ? match[1] : null;
  }

  const extractYouTubeId = (url: string): string | null => {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  }

  const getEmbedUrl = (url: string): string | null => {
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`;
    }
    
    return null;
  }
  
  const getTypeIcon = () => {
    switch (product.type) {
      case 'workshop':
        return <Users className="text-white text-2xl" />
      case 'program':
        return <Calendar className="text-white text-2xl" />
      case 'document':
        return <FileText className="text-white text-2xl" />
      default:
        return <FileText className="text-white text-2xl" />
    }
  }

  const getTypeLabel = () => {
    switch (product.type) {
      case 'workshop':
        return 'Taller'
      case 'program':
        return 'Programa'
      case 'document':
        return 'Documento'
      default:
        return 'Producto'
    }
  }

  const getProductImage = () => {
    if (product.image) {
      return product.image
    }
    return '/placeholder.svg?height=400&width=600'
  }

  const getProductVideo = () => {
    if (product.videoUrl) {
      return product.videoUrl
    }
    if (product.video) {
      return product.video
    }
    return null
  }

  const isExternalVideo = (url: string): boolean => {
    return url.includes('vimeo.com') || url.includes('youtube.com') || url.includes('youtu.be')
  }

  const getProductDetails = () => {
    const details: Array<{
      label: string
      value: string
      icon: any
      color: string
      bgColor: string
    }> = []

    if (product.level) {
      details.push({
        label: 'Nivel',
        value: product.level,
        icon: Target,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10'
      })
    }

    if (product.modality) {
      details.push({
        label: 'Modalidad',
        value: product.modality,
        icon: MapPin,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10'
      })
    }

    // Para programas y fitness, mostrar cantidad de ejercicios y sesiones
    if (product.type === 'program' || product.type === 'fitness') {
      const exercisesCount = product.exercisesCount || (csvData && csvData.length > 1 ? csvData.length - 1 : 0)
      if (exercisesCount > 0) {
        // Determinar si es nutrición o fitness basado en la categoría
        const isNutrition = product.categoria === 'nutricion' || product.type === 'nutrition'
        const label = isNutrition ? 'Platos' : 'Ejercicios'
        const value = isNutrition ? `${exercisesCount} platos` : `${exercisesCount} ejercicios`
        
        details.push({
          label: label,
          value: value,
          icon: Flame,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10'
        })
      }

      const totalSessions = product.totalSessions || (csvData && csvData.length > 1 ? new Set(csvData.slice(1).map(row => row[0])).size : 0)
      if (totalSessions > 0) {
        details.push({
          label: 'Sesiones',
          value: `${totalSessions} sesiones`,
          icon: Calendar,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10'
        })
      }
    }

    return details
  }

  const videoUrl = getProductVideo()
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null
  
    videoUrl,
    embedUrl,
    isExternal: videoUrl ? isExternalVideo(videoUrl) : false,
    productVideoUrl: product.videoUrl,
    productVideo: product.video
  })

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl"
    >
      <Card className="bg-[#1E1E1E] border-none overflow-hidden shadow-lg">
        <CardContent className="p-0">
          {/* Video Section */}
          <div className="relative h-64 w-full overflow-hidden">
            {videoUrl ? (
              isExternalVideo(videoUrl) && embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              )
            ) : (
              <Image
                src={getProductImage()}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
            
            {/* Type Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-orange-500 text-white border-none">
                {getTypeLabel()}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">
              {product.title}
            </h2>

            {/* Description - Full version */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Product Details */}
            <div className="flex flex-wrap gap-3 mb-6">
              {getProductDetails().map((detail, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${detail.bgColor}`}
                >
                  <detail.icon className={`h-4 w-4 ${detail.color}`} />
                  <span className={`text-sm font-medium ${detail.color}`}>
                    {detail.label}: {detail.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Rating Section */}
            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Star className="h-5 w-5 text-yellow-400 mr-2" />
                Calificaciones y Comentarios
              </h3>
              
              {product.program_rating && product.total_program_reviews ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-white mr-2">
                        {product.program_rating.toFixed(1)}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(product.program_rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-400">
                      ({product.total_program_reviews} opiniones)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No hay calificaciones aún</p>
                  <p className="text-gray-500 text-sm">Sé el primero en calificar este producto</p>
                </div>
              )}
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <div className="text-3xl font-bold text-white">
                ${product.price.toFixed(2)}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Ver menos
                </Button>
                
                <Button
                  onClick={onPurchase}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3"
                >
                  Comprar Ahora
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}




