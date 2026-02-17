import { useState, useRef, useEffect } from "react"
import { Users, Calendar, FileText, Clock, Target, MapPin, Zap, Flame, BookOpen } from "lucide-react"

export interface ProductPreviewLogicProps {
    product: any
    onPurchase?: () => void
    csvData?: string[][]
}

export const useProductPreviewLogic = ({ product, onPurchase, csvData }: ProductPreviewLogicProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const priceRef = useRef<HTMLDivElement>(null)

    // --- Helpers de Tipo ---
    const getTypeIcon = () => {
        switch (product.type) {
            case 'workshop': return Users
            case 'program': return Calendar
            case 'document': return FileText
            default: return FileText
        }
    }

    const getTypeLabel = () => {
        switch (product.type) {
            case 'workshop': return 'Taller'
            case 'program': return 'Programa'
            case 'document': return 'Documento'
            default: return 'Producto'
        }
    }

    const getTypeColor = () => {
        switch (product.type) {
            case 'workshop': return 'bg-blue-500'
            case 'program': return 'bg-green-500'
            case 'document': return 'bg-purple-500'
            default: return 'bg-orange-500'
        }
    }

    // --- Helpers de Contenido ---
    const getProductImage = () => {
        if (product.image && product.image.trim() !== '') {
            return product.image
        }
        return null
    }

    // --- Lógica de Detalles ---
    const getProductDetails = () => {
        const details: any[] = []
        if (!product) return details

        // TALLERES
        if (product.type === 'workshop') {
            if (product.capacity) details.push({ label: 'Capacidad', value: `${product.capacity} personas`, icon: Users, color: 'text-blue-400' })
            if (product.sessionsPerClient) details.push({ label: 'Sesiones/cliente', value: `${product.sessionsPerClient}`, icon: Clock, color: 'text-green-400' })
            if (product.workshopType) details.push({ label: 'Tipo', value: product.workshopType, icon: Target, color: 'text-purple-400' })
            if (product.modality) details.push({ label: 'Modalidad', value: product.modality, icon: MapPin, color: 'text-orange-400' })

            if (product.items_unicos !== undefined) {
                details.push({ label: 'Temas', value: `${product.items_unicos} temas`, icon: Zap, color: 'text-cyan-400' })
            } else if (product.blocks?.length) {
                details.push({ label: 'Temas', value: `${product.blocks.length}`, icon: Zap, color: 'text-cyan-400' })
            }
        }
        // INSTANT & DOCUMENTOS
        else {
            if (product.difficulty) details.push({ label: 'Nivel', value: product.difficulty, icon: Target, color: 'text-blue-400' })
            if (product.duration) details.push({ label: 'Duración', value: product.duration, icon: Clock, color: 'text-green-400' })

            // Programas / Fitness
            if (product.type === 'program' || product.type === 'fitness') {
                const exercisesCount = product.exercisesCount || (csvData && csvData.length > 1 ? csvData.length - 1 : 0)
                if (exercisesCount > 0) details.push({ label: 'Ejercicios', value: `${exercisesCount}`, icon: Flame, color: 'text-red-400' })

                const totalSessions = product.totalSessions || (csvData && csvData.length > 1 ? new Set(csvData.slice(1).map(row => row[0])).size : 0)
                if (totalSessions > 0) details.push({ label: 'Sesiones', value: `${totalSessions}`, icon: Calendar, color: 'text-blue-400' })
            }

            if (product.pages) details.push({ label: 'Extensión', value: product.pages, icon: BookOpen, color: 'text-orange-400' })
            if (product.modality && product.type !== 'program') details.push({ label: 'Modalidad', value: product.modality, icon: MapPin, color: 'text-yellow-400' })
        }

        return details
    }

    // --- Lógica de Drag-to-Buy ---
    const handleDragStart = (clientX: number) => {
        setIsDragging(true)
        setDragOffset(0)
        setIsAnimating(false)
    }

    const handleDragMove = (clientX: number) => {
        if (!isDragging || !priceRef.current) return
        const rect = priceRef.current.getBoundingClientRect()
        const offset = clientX - rect.left
        if (offset > 0) setDragOffset(Math.min(offset, rect.width))
    }

    const handleDragEnd = () => {
        if (isDragging && dragOffset > 80) {
            if (navigator.vibrate) navigator.vibrate(100)
            setIsAnimating(true)
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

    return {
        isDragging,
        dragOffset,
        isAnimating,
        priceRef,
        getTypeIcon,
        getTypeLabel,
        getTypeColor,
        getProductImage,
        getProductDetails,
        handleDragStart,
        handleDragMove,
        handleDragEnd
    }
}
