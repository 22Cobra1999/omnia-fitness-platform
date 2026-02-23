import React, { memo } from 'react'
import { ProductsSection } from '../../components/Products/ProductsSection'
import { Product } from '../../types'
import { convertProductToActivity } from '../../utils'

interface ProductsTabProps {
    products: Product[]
    loading: boolean
    typeFilter: any
    setTypeFilter: (filter: any) => void
    showTypeDropdown: boolean
    setShowTypeDropdown: (show: boolean) => void
    isCafeModalOpen: boolean
    setIsCafeModalOpen: any
    consultations: any
    consultationSales: any
    consultationError: string | null
    visibleProductsCount: number
    setVisibleProductsCount: any
    onOpenCreateModal: () => void
    onPreviewProduct: (product: Product) => void
    renderConsultationSection: (type: 'express' | 'puntual' | 'profunda') => React.ReactNode
    pendingConsultations: any[]
    // Conditioning Props
    isConditioningMode: boolean
    setIsConditioningMode: (val: boolean) => void
    selectedProductsForConditioning: number[]
    toggleProductConditioning: (id: number) => void
    resetConditioning: () => void
    handleApplyConditioning: () => void
    handleSaveConditioning: (rules: any) => void
}

export const ProductsTab: React.FC<ProductsTabProps> = memo((props) => {
    return (
        <div className="space-y-6">
            <ProductsSection
                {...props}
                convertProductToActivity={convertProductToActivity}
            />

            {/* Aquí podríamos agregar futuras divisiones sugeridas como "Estadísticas Rápidas" o "Últimas Ventas" */}
        </div>
    )
})

ProductsTab.displayName = 'ProductsTab'
