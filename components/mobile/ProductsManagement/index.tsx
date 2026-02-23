"use client"

import React from 'react'
import { ProductsTab } from './tabs/ProductsTab'
import { ContentTab as ExercisesTab } from './tabs/ContentTab'
import { StorageTab } from './tabs/StorageTab'
import { Header } from './components/Header/Header'
import { useProductsManagementLogic } from './hooks/useProductsManagementLogic'
import { ProductsModals } from './components/Modals/ProductsModals'
import { ConsultationSection } from './components/Consultations/ConsultationSection'
import { convertProductToActivity } from './utils'
import { ConditionalRulesPanel } from '@/components/shared/products/conditional-rules-panel'
import { toast } from 'sonner'

export default function ProductsManagement() {
    const { state, actions } = useProductsManagementLogic()

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] pb-24 relative overflow-x-hidden w-full">
            {/* 1. Main Top Navigation (Products, Exercises, Storage) */}
            <Header
                activeMainTab={state.activeMainTab}
                onTabChange={actions.setActiveMainTab}
            />

            {/* 2. Content Sections based on Main Tab */}
            <div className="flex-1 p-4 md:p-6 space-y-8">
                {/* 2b. Products Tab Display */}
                {state.activeMainTab === 'products' && (
                    <ProductsTab
                        products={state.sortedProducts}
                        loading={state.loading}
                        typeFilter={state.typeFilter}
                        setTypeFilter={actions.setTypeFilter}
                        showTypeDropdown={state.showTypeDropdown}
                        setShowTypeDropdown={actions.setShowTypeDropdown}
                        isCafeModalOpen={state.isCafeModalOpen}
                        setIsCafeModalOpen={actions.setIsCafeModalOpen as any}
                        consultations={state.consultations}
                        consultationSales={state.consultationSales}
                        consultationError={state.consultationError}
                        visibleProductsCount={state.visibleProductsCount}
                        setVisibleProductsCount={actions.setVisibleProductsCount as any}
                        onOpenCreateModal={actions.handleOpenModal}
                        onPreviewProduct={actions.handlePreviewProduct}
                        pendingConsultations={state.pendingConsultations}
                        isConditioningMode={state.isConditioningMode}
                        selectedProductsForConditioning={state.selectedProductsForConditioning}
                        setIsConditioningMode={actions.setIsConditioningMode}
                        toggleProductConditioning={actions.toggleProductConditioning}
                        resetConditioning={actions.resetConditioning}
                        handleApplyConditioning={actions.handleApplyConditioning}
                        handleSaveConditioning={actions.handleSaveConditioning}
                        renderConsultationSection={(type) => (
                            <ConsultationSection
                                type={type}
                                consultation={state.consultations[type]}
                                sales={state.consultationSales[type]}
                                isEditing={state.editingPrice?.startsWith(type) || false}
                                isToggling={state.isTogglingConsultation === type}
                                onToggle={(t) => actions.toggleConsultation(t)}
                                onUpdatePrice={(t, p) => actions.updateConsultationPrice(t, p)}
                                onSetEditingPrice={(t) => actions.setEditingPrice(t ? `${t}-${state.consultations[t].price}` : null)}
                                onSetConsultationError={actions.setConsultationError}
                                onSetConsultations={actions.setConsultations}
                                onWhatsAppClick={(sale) => {
                                    if (state.coachPhone) {
                                        const msg = encodeURIComponent(`Hola ${sale.userName}, te contacto desde OMNIA...`)
                                        window.open(`https://wa.me/${state.coachPhone}?text=${msg}`, '_blank')
                                    } else {
                                        toast.error("Configura tu teléfono en el perfil")
                                    }
                                }}
                                onMeetClick={(sale) => {
                                    toast.info(`Abriendo meet para ${sale.userName}`)
                                }}
                            />
                        )}
                    />
                )}

                {/* 2c. Exercises Tab Display */}
                {state.activeMainTab === 'exercises' && (
                    <ExercisesTab
                        userId={state.user?.id}
                        activeSubTab={state.activeSubTab}
                        setActiveSubTab={actions.setActiveSubTab}
                    />
                )}

                {/* 2d. Storage Tab Display */}
                {state.activeMainTab === 'storage' && (
                    <StorageTab />
                )}
            </div>

            {/* 3. Global Modals (Shared state) */}
            <ProductsModals
                state={state}
                actions={actions}
                helpers={{ convertProductToActivity }}
            />

            <ConditionalRulesPanel
                isOpen={state.isConditionalRulesPanelOpen}
                onClose={() => actions.setIsConditionalRulesPanelOpen(false)}
                productCategory="fitness"
                availableItems={[]}
                onSaveRules={actions.handleSaveConditioning}
                selectedCount={state.selectedProductsForConditioning.length}
            />
        </div>
    )
}
