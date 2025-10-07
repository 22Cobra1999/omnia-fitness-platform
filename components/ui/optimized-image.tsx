import Image from "next/image"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  isLCP?: boolean // Largest Contentful Paint
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 600,
  className = "",
  priority = false,
  isLCP = false,
  fallbackSrc = "/placeholder.svg"
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
  }

  // Determinar si debe tener priority basado en LCP o prop explícita
  const shouldHavePriority = priority || isLCP

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={shouldHavePriority}
      onError={handleError}
      loading={shouldHavePriority ? "eager" : "lazy"}
      quality={85} // Optimizar calidad vs tamaño
    />
  )
}

// Componente específico para imágenes LCP
export function LCPImage(props: Omit<OptimizedImageProps, "isLCP">) {
  return <OptimizedImage {...props} isLCP={true} />
}

// Componente para imágenes de fondo optimizadas
export function BackgroundImage({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg"
}: {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
  }

  return (
    <div 
      className={`bg-cover bg-center bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${imageSrc})`,
      }}
      role="img"
      aria-label={alt}
      onError={handleError}
    />
  )
}

