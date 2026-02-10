"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Loader2, Clock, Activity, FileText, MessageCircle, UtensilsCrossed, Video } from "lucide-react"

interface RecentPurchasesListProps {
    userId?: string
}

export function RecentPurchasesList({ userId }: RecentPurchasesListProps) {
    const [purchases, setPurchases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const fetchPurchases = async () => {
            try {
                const response = await fetch('/api/client/recent-purchases?limit=10')
                const data = await response.json()

                if (data.success) {
                    setPurchases(data.purchases || [])
                }
            } catch (error) {
                console.error('Error obteniendo compras:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPurchases()
    }, [userId])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
        )
    }

    if (purchases.length === 0) {
        return (
            <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No hay compras recientes</p>
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `Hace ${diffMins} min`
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays < 7) return `Hace ${diffDays}d`

        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short'
        })
    }

    const getActivityTypeLabel = (purchase: any) => {
        const type = purchase.activity?.type
        const category = purchase.activity?.category
        const title = (purchase.activity?.title || purchase.concept || '').toLowerCase()
        let label = ''

        if (type === 'workshop' || title.includes('taller') || title.includes('yoga') || title.includes('clase')) label = 'Taller'
        else if (type === 'document' || title.includes('documento') || title.includes('doc') || title.includes('guía') || title.includes('pdf')) label = 'Documento'
        else if (type === 'consultation' || title.includes('consulta') || title.includes('asesor') || title.includes('café') || title.includes('coffee')) label = 'Consulta'
        else if (category === 'nutricion' || type === 'nutrition' || title.includes('nutrición') || title.includes('dieta') || title.includes('comida') || title.includes('plan alimentario')) label = 'Plan Nutricional'
        else if (title.includes('meet') || title.includes('crédito') || title.includes('llamada') || title.includes('sesión') || title.includes('videollamada') || title.includes('turno')) label = 'Créditos Meet'
        else if (type === 'program' || type === 'fitness' || title.includes('programa') || title.includes('entrenamiento') || title.includes('rutina') || title.includes('bomb') || title.includes('pliométricos') || title.includes('fuerza') || title.includes('estética')) label = 'Programa'
        else if (category === 'fitness') label = 'Fitness'

        const categoryLabel = category === 'nutricion' || category === 'nutrition' ? 'Nutrición' :
            category === 'fitness' ? 'Fitness' : null

        if (label && categoryLabel && !label.toLowerCase().includes(categoryLabel.toLowerCase())) {
            return `${label} • ${categoryLabel}`
        }

        return label || 'Actividad'
    }

    const getActivityIcon = (purchase: any) => {
        const type = purchase.activity?.type
        const category = purchase.activity?.category
        const title = purchase.activity?.title?.toLowerCase() || ''

        if (type === 'workshop') return <Activity className="h-4 w-4 text-[#FF7939]" />
        if (type === 'document') return <FileText className="h-4 w-4 text-[#FF7939]" />
        if (type === 'consultation') return <MessageCircle className="h-4 w-4 text-[#FF7939]" />
        if (category === 'nutricion' || type === 'nutrition') return <UtensilsCrossed className="h-4 w-4 text-[#FF7939]" />
        if (title.includes('meet') || title.includes('crédito')) return <Video className="h-4 w-4 text-[#FF7939]" />

        return <ShoppingCart className="h-4 w-4 text-[#FF7939]" />
    }

    return (
        <div className="space-y-3 max-h-80 overflow-y-auto">
            {purchases.map((purchase) => {
                const typeLabel = getActivityTypeLabel(purchase)
                return (
                    <div key={purchase.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                            {getActivityIcon(purchase)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {purchase.concept || (isNaN(Number(purchase.activity?.title)) ? purchase.activity?.title : 'Compra #' + purchase.activity?.title) || 'Compra'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {typeLabel}
                            </p>
                            <p className="text-xs text-[#FF7939] font-medium mt-1">
                                ${purchase.amount?.toLocaleString('es-AR') || '0'}
                            </p>
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-end">
                            <Clock className="h-3 w-3 text-gray-500 mb-1" />
                            <p className="text-xs text-gray-500">
                                {purchase.paymentDate ? formatDate(purchase.paymentDate) : ''}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
