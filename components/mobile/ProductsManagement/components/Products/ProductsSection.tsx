import React, { memo } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Coffee, ChevronDown, X, Zap, Check } from "lucide-react"
import ActivityCard from '@/components/shared/activities/ActivityCard'
import { Product } from '../../types'
import { ConsultationSection } from '../Consultations/ConsultationSection'

interface ProductsSectionProps {
    products: Product[]
    loading: boolean
    typeFilter: string
    setTypeFilter: (filter: any) => void
    showTypeDropdown: boolean
    setShowTypeDropdown: (show: boolean) => void
    isCafeModalOpen: boolean
    setIsCafeModalOpen: (open: (prev: boolean) => boolean) => void
    consultations: any
    consultationSales: any
    consultationError: string | null
    visibleProductsCount: number
    setVisibleProductsCount: (count: (prev: number) => number) => void
    onOpenCreateModal: () => void
    onPreviewProduct: (product: Product) => void
    convertProductToActivity: (product: Product) => any
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

const ProductCard = memo(({
    product,
    onPreview,
    convertProductToActivity,
    isConditioningMode,
    isSelected,
    onToggleConditioning
}: {
    product: Product
    onPreview: (product: Product) => void
    convertProductToActivity: (product: Product) => any
    isConditioningMode: boolean
    isSelected: boolean
    onToggleConditioning: (id: number) => void
}) => {
    const isProgram = product.type === 'program' || (product as any).category === 'program'

    const handleClick = () => {
        if (isConditioningMode) {
            if (isProgram) onToggleConditioning(product.id)
        } else {
            onPreview(product)
        }
    }

    return (
        <div className={`flex-shrink-0 w-48 relative transition-all ${isConditioningMode && !isProgram ? 'opacity-20 grayscale' : ''}`}>
            <ActivityCard
                activity={convertProductToActivity(product)}
                size="small"
                onClick={handleClick}
            />

            {isConditioningMode && isProgram && (
                <div
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => { e.stopPropagation(); onToggleConditioning(product.id); }}
                >
                    {isSelected ? (
                        <div className="bg-[#FF7939] rounded-full p-1 border-2 border-white shadow-lg">
                            <Check className="w-3 h-3 text-black font-black" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-white/40 bg-black/40 backdrop-blur-sm" />
                    )}
                </div>
            )}
        </div>
    )
})
ProductCard.displayName = 'ProductCard'

export const ProductsSection: React.FC<ProductsSectionProps> = ({
    products,
    loading,
    typeFilter,
    setTypeFilter,
    showTypeDropdown,
    setShowTypeDropdown,
    isCafeModalOpen,
    setIsCafeModalOpen,
    consultations,
    consultationSales,
    consultationError,
    visibleProductsCount,
    setVisibleProductsCount,
    onOpenCreateModal,
    onPreviewProduct,
    convertProductToActivity,
    renderConsultationSection,
    pendingConsultations,
    isConditioningMode,
    setIsConditioningMode,
    selectedProductsForConditioning,
    toggleProductConditioning,
    resetConditioning,
    handleApplyConditioning,
}) => {
    return (
        <div className="bg-[#0F0F0F] rounded-2xl border border-[#1A1A1A] overflow-hidden">
            {/* Header de tabla con filtros */}
            <div className="p-4 border-b border-[#1A1A1A]">
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between relative">
                        {/* Dropdown de categoría a la izquierda */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                className="border-[#1A1A1A] text-gray-400 hover:text-white rounded-full px-3 py-1 text-xs"
                            >
                                {typeFilter === 'todos' ? 'Todos' : typeFilter}
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>

                            {showTypeDropdown && (
                                <div className="absolute left-0 top-full mt-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl shadow-lg z-10 min-w-[150px]">
                                    <div className="p-2">
                                        {['todos', 'fitness', 'nutrition', 'program'].map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => { setTypeFilter(filter); setShowTypeDropdown(false); }}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition-colors text-sm capitalize"
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Icono de Café centrado */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6">
                            {/* BOTÓN CONDICIONAR */}
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => {
                                        setIsConditioningMode(!isConditioningMode)
                                        if (isConditioningMode) resetConditioning()
                                    }}
                                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${isConditioningMode ? 'bg-[#FF7939] border-[#FF7939]' : 'bg-transparent border-[#4B5563] hover:bg-white/5'}`}
                                >
                                    <Zap className={`w-5 h-5 ${isConditioningMode ? 'text-black' : 'text-[#9CA3AF]'}`} />
                                    {isConditioningMode && selectedProductsForConditioning.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-white text-[#FF7939] text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#FF7939]">
                                            {selectedProductsForConditioning.length}
                                        </span>
                                    )}
                                </button>
                                <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${isConditioningMode ? 'text-[#FF7939]' : 'text-white/20'}`}>Condicionar</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => setIsCafeModalOpen((prev: boolean) => !prev)}
                                    className="relative w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-2 border-[#4B5563] transition-all duration-200 hover:bg-[#0A0A0A]/50"
                                    style={{
                                        borderColor:
                                            consultations.express.active ||
                                                consultations.puntual.active ||
                                                consultations.profunda.active
                                                ? '#FF7939'
                                                : '#4B5563',
                                    }}
                                >
                                    <Coffee
                                        className="h-5 w-5 transition-colors duration-200"
                                        style={{
                                            color:
                                                consultations.express.active ||
                                                    consultations.puntual.active ||
                                                    consultations.profunda.active
                                                    ? '#FF7939'
                                                    : '#9CA3AF',
                                        }}
                                    />
                                    {(consultationSales.express.length +
                                        consultationSales.puntual.length +
                                        consultationSales.profunda.length) > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-[#FF7939] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                {consultationSales.express.length +
                                                    consultationSales.puntual.length +
                                                    consultationSales.profunda.length}
                                            </span>
                                        )}
                                </button>
                                <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${isCafeModalOpen ? 'text-[#FF7939]' : 'text-white/20'}`}>Meets</span>
                            </div>
                        </div>

                        {/* Botón Crear a la derecha */}
                        <div className="ml-auto">
                            {isConditioningMode ? (
                                <Button
                                    className="bg-white hover:bg-white/90 text-black px-4 py-1 rounded-lg font-black text-xs shadow-md uppercase tracking-wider"
                                    onClick={handleApplyConditioning}
                                    disabled={selectedProductsForConditioning.length === 0}
                                >
                                    Aplicar {selectedProductsForConditioning.length}
                                </Button>
                            ) : (
                                <Button
                                    className="bg-[#FF7939] hover:bg-[#E66829] text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-md"
                                    onClick={onOpenCreateModal}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Crear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Vista de Consultas Inline */}
                    {isCafeModalOpen && (
                        <div className="mt-4 rounded-2xl border border-[#1A1A1A] bg-[#050505] p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coffee className="w-5 h-5 text-[#FF7939]" />
                                    <h3 className="text-white font-semibold text-sm">Consultas / Meets con el coach</h3>
                                </div>
                                <button onClick={() => setIsCafeModalOpen(() => false)} className="text-gray-400 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {consultationError && (
                                <div className="mb-2 px-3 py-2 bg-[#FF7939]/10 border border-[#FF7939]/30 rounded-lg">
                                    <p className="text-[#FF7939] text-xs text-center font-medium">{consultationError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                {renderConsultationSection('express')}
                                {renderConsultationSection('puntual')}
                                {renderConsultationSection('profunda')}
                            </div>

                            {pendingConsultations.length > 0 && (
                                <div className="pt-4 border-t border-gray-700/30">
                                    <h4 className="text-white font-semibold text-xs mb-3">Consultas pendientes</h4>
                                    <div className="space-y-2">
                                        {pendingConsultations.map((consultation, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/20 last:border-b-0 text-xs">
                                                <div>
                                                    <p className="text-white font-medium">{consultation.clientName}</p>
                                                    <p className="text-gray-400">{new Date(consultation.date).toLocaleDateString()} - {consultation.consultationType}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de productos */}
            <div className="space-y-2 px-4 py-6">
                {loading ? (
                    <div className="text-center text-gray-400 text-sm">Cargando productos...</div>
                ) : products.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm">No hay productos creados aún</div>
                ) : (
                    <div>
                        <div className="overflow-x-auto pb-2 scrollbar-hide">
                            <div className="flex -space-x-4" style={{ minWidth: 'min-content' }}>
                                {products.slice(0, visibleProductsCount).map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onPreview={onPreviewProduct}
                                        convertProductToActivity={convertProductToActivity}
                                        isConditioningMode={isConditioningMode}
                                        isSelected={selectedProductsForConditioning.includes(product.id)}
                                        onToggleConditioning={toggleProductConditioning}
                                    />
                                ))}
                            </div>
                        </div>
                        {products.length > visibleProductsCount && (
                            <div className="flex justify-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setVisibleProductsCount((prev: number) => prev + 20)}
                                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm"
                                >
                                    Cargar más
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
