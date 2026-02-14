"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ShoppingCart, Users, Calendar, FileText, Flame, Clock, MapPin, Target, BookOpen, Zap, ChevronDown } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

interface ProductPreviewCardProps {
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
  showPurchaseButton?: boolean
  onPurchase?: () => void
  onExpand?: () => void
  isPreview?: boolean
  csvData?: string[][]
}

export function ProductPreviewCard({
  product,
  showPurchaseButton = true,
  onPurchase,
  onExpand,
  isPreview = true,
  csvData
}: ProductPreviewCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const priceRef = useRef<HTMLDivElement>(null)

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

  const getTypeColor = () => {
    switch (product.type) {
      case 'workshop':
        return 'bg-blue-500'
      case 'program':
        return 'bg-green-500'
      case 'document':
        return 'bg-purple-500'
      default:
        return 'bg-orange-500'
    }
  }

  const getProductImage = () => {
    // Priorizar imagen real del producto
    if (product.image && product.image.trim() !== '') {
      return product.image
    }

    // Si no hay imagen real, devolver null para mostrar logo de Omnia
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragOffset(0)
    setIsAnimating(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !priceRef.current) return

    e.preventDefault()
    const rect = priceRef.current.getBoundingClientRect()
    const offset = e.clientX - rect.left

    if (offset > 0) {
      const newOffset = Math.min(offset, rect.width)
      setDragOffset(newOffset)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragOffset(0)
    setIsAnimating(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !priceRef.current) return

    e.preventDefault()
    const rect = priceRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const offset = touch.clientX - rect.left

    if (offset > 0) {
      const newOffset = Math.min(offset, rect.width)
      setDragOffset(newOffset)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging && dragOffset > 80) { // Si se deslizó más de 80px (más sensible)
      // Efecto de vibración en móviles
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
      setIsAnimating(true)
      // Pequeño delay para mostrar la animación de éxito
      setTimeout(() => {
        onPurchase?.()
        setIsAnimating(false)
        setDragOffset(0)
      }, 300)
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setIsAnimating(false)
        setDragOffset(0)
      }, 200)
    }
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    if (isDragging && dragOffset > 80) { // Si se deslizó más de 80px (más sensible)
      // Efecto de vibración en móviles
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
      setIsAnimating(true)
      // Pequeño delay para mostrar la animación de éxito
      setTimeout(() => {
        onPurchase?.()
        setIsAnimating(false)
        setDragOffset(0)
      }, 300)
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setIsAnimating(false)
        setDragOffset(0)
      }, 200)
    }
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragOffset(0)
    }
  }

  const getProductDetails = () => {
    const details: any[] = []

    // Validar que product existe
    if (!product) return details

    // Para talleres, mostrar información específica
    if (product.type === 'workshop') {
      if (product.capacity && typeof product.capacity === 'number') {
        details.push({
          label: 'Capacidad',
          value: `${product.capacity} personas`,
          icon: Users,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10'
        })
      }

      if (product.sessionsPerClient && typeof product.sessionsPerClient === 'number') {
        details.push({
          label: 'Sesiones por cliente',
          value: `${product.sessionsPerClient}`,
          icon: Clock,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10'
        })
      }

      if (product.workshopType && typeof product.workshopType === 'string') {
        const typeLabel = product.workshopType === 'individual' ? 'Individual' :
          product.workshopType === 'grupal' ? 'Grupal' : product.workshopType
        details.push({
          label: 'Tipo de taller',
          value: typeLabel,
          icon: Target,
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10'
        })
      }

      if (product.modality && typeof product.modality === 'string') {
        details.push({
          label: 'Modalidad',
          value: product.modality,
          icon: MapPin,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10'
        })
      }

      if (product.blocks && product.blocks.length > 0) {
        const totalDates = product.blocks.reduce((total, block) => {
          return total + (block.selectedDates ? block.selectedDates.length : 0)
        }, 0)
        details.push({
          label: 'Sesiones totales',
          value: `${totalDates} d`,
          icon: Calendar,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10'
        })
        details.push({
          label: 'Temas únicos',
          value: `${product.blocks.length}`,
          icon: Zap,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-400/10'
        })
      } else if ((product as any).items_unicos !== undefined) {
        details.push({
          label: 'Temas',
          value: `${(product as any).items_unicos} temas`,
          icon: Zap,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-400/10'
        })
      }
    } else {
      // Para otros tipos de productos
      if (product.difficulty && typeof product.difficulty === 'string') {
        details.push({
          label: 'Nivel',
          value: product.difficulty,
          icon: Target,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10'
        })
      }

      if (product.duration && typeof product.duration === 'string') {
        details.push({
          label: 'Duración',
          value: product.duration,
          icon: Clock,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10'
        })
      }

      // Para programas y fitness, mostrar cantidad de ejercicios, días y modalidad
      if (product.type === 'program' || (product as any).type === 'fitness') {
        // ✅ Ejercicios: cantidad de filas de datos
        const exercisesCount = product.exercisesCount || (csvData && csvData.length > 1 ? csvData.length - 1 : 0)

        if (exercisesCount > 0) {
          details.push({
            label: 'Ejercicios',
            value: `${exercisesCount} ejercicios`,
            icon: Flame,
            color: 'text-red-400',
            bgColor: 'bg-red-400/10'
          })
        }

        // ✅ Sesiones: semanas únicas
        const totalSessions = product.totalSessions || (csvData && csvData.length > 1 ? new Set(csvData.slice(1).map(row => row[0])).size : 0)

        if (totalSessions > 0) {
          details.push({
            label: 'Sesiones',
            value: `${totalSessions} sesiones`,
            icon: Calendar,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10'
          })
        }



        // ✅ Modalidad: información del formulario
        if (product.modality && typeof product.modality === 'string') {
          details.push({
            label: 'Modalidad',
            value: product.modality,
            icon: MapPin,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400/10'
          })
        }
      }

      if (product.pages && typeof product.pages === 'string') {
        details.push({
          label: 'Extensión',
          value: product.pages,
          icon: BookOpen,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10'
        })
      }

      // Modalidad solo para productos que no son programas o fitness (para evitar duplicación)
      if (product.modality && product.type !== 'program' && (product as any).type !== 'fitness') {
        details.push({
          label: 'Modalidad',
          value: product.modality,
          icon: MapPin,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10'
        })
      }
    }

    return details
  }

  return (
    <motion.div
      whileHover={{ scale: isPreview ? 1 : 1.03 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-sm"
    >
      <Card className="bg-[#1E1E1E] border-none overflow-hidden shadow-lg">
        <CardContent className="p-0">
          {/* Background Image Section - Show Image or Omnia Logo */}
          <div className="relative h-48 w-full overflow-hidden">
            {getProductImage() ? (
              <>
                <Image
                  src={getProductImage()!}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Overlay for better text readability - solo si es imagen */}
                {!product.videoUrl && <div className="absolute inset-0 bg-black/40" />}
              </>
            ) : (
              // Logo de Omnia cuando no hay imagen (igual que cuando no hay video en ejercicios)
              <div className="w-full h-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
                <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                  <Flame className="w-8 h-8 text-black" />
                </div>
                <h1 className="text-gray-400 text-xl font-bold">OMNIA</h1>
              </div>
            )}

            {/* Type Badge */}
            <Badge className={`absolute top-3 left-3 ${getTypeColor()} text-white font-medium`}>
              {getTypeLabel()}
            </Badge>

            {/* Popular Badge (opcional) */}
            {isPreview && (
              <div className="absolute top-3 right-3 inline-flex items-center px-3 py-1 rounded-full bg-[#FF7939]/80 backdrop-blur-sm text-sm font-medium text-white">
                <Flame className="h-4 w-4 mr-1" />
                <span>Preview</span>
              </div>
            )}

            {/* Type Icon Overlay */}
            <div className="absolute bottom-3 right-3 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              {getTypeIcon()}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4">
            {/* Title with enhanced styling */}
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text">
              {product.title || 'Nombre del producto'}
            </h3>

            {/* Description with improved styling */}
            <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed bg-[#1A1A1A]/30 p-3 rounded-lg border border-[#2A2A2A]/30">
              {product.description || 'Descripción del producto'}
            </p>

            {/* Product Details - Enhanced with Icons and Colors */}
            {getProductDetails().length > 0 && (
              <div className="bg-gradient-to-br from-[#0F0F0F] to-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] mb-4 shadow-lg">
                <div className="grid grid-cols-2 gap-3">
                  {getProductDetails().map((detail, index) => {
                    const IconComponent = detail.icon
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1A1A1A]/30 transition-colors">
                        <IconComponent className={`h-4 w-4 ${detail.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-400 text-xs font-medium truncate">{detail.label}</div>
                          <div className="text-white font-semibold text-sm truncate">{detail.value}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price and Action Section */}
            <div className="mb-4">
              {/* Swipe Container */}
              <div
                ref={priceRef}
                className="relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer select-none shadow-lg"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Background with gradient */}
                <div className="bg-gradient-to-r from-[#FF7939] to-[#E66829] p-4 transition-all duration-500 ease-out"
                  style={{
                    transform: `translateX(${isDragging ? Math.min(dragOffset * 0.3, 0) : 0}px)`,
                    filter: isDragging ? 'brightness(1.2) saturate(1.1)' : 'brightness(1) saturate(1)',
                    boxShadow: isDragging ? '0 8px 25px rgba(255, 121, 57, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white transition-all duration-300"
                      style={{
                        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                        textShadow: isDragging ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'
                      }}>
                      ${product.price?.toFixed(2) || '0.00'}
                    </span>
                    <ShoppingCart className="h-6 w-6 text-white transition-all duration-300"
                      style={{
                        transform: isDragging ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                      }} />
                  </div>
                </div>

                {/* Progress overlay */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-out flex items-center justify-end pr-4"
                  style={{
                    width: `${Math.min((dragOffset / (priceRef.current?.offsetWidth || 1)) * 100, 100)}%`,
                    opacity: isDragging ? 1 : 0,
                    transform: isAnimating ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  <div className="flex items-center space-x-2 text-white">
                    <span className="font-bold text-lg">¡Comprar!</span>
                    <ShoppingCart className="h-5 w-5 animate-pulse" />
                  </div>
                </div>

                {/* Swipe indicator */}
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white transition-all duration-300"
                  style={{ opacity: isDragging ? 0 : 0.6 }}>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">Deslizar</span>
                    <ChevronDown className="h-4 w-4 rotate-90 animate-bounce" />
                  </div>
                </div>

                {/* Success indicator */}
                {isAnimating && dragOffset > 80 && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center transition-all duration-300">
                    <div className="flex items-center space-x-2 text-white">
                      <span className="text-lg font-bold">¡Comprado!</span>
                      <ShoppingCart className="h-6 w-6 animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center mt-2">
                <p className="text-orange-400 text-sm font-medium">Desliza el precio hacia la derecha para comprar</p>
              </div>
            </div>

            {/* Ver más Button */}
            {onExpand && (
              <Button
                variant="ghost"
                className="w-full text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 border border-orange-400/20 py-3 rounded-xl transition-all duration-300"
                onClick={onExpand}
              >
                <ChevronDown className="w-5 h-5 mr-2" />
                Ver más
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
