"use client"

import React from 'react'
import { Header } from './components/Header/Header'
import { ProductsModals } from './components/Modals/ProductsModals'
import { ConsultationSection } from './components/Consultations/ConsultationSection'
import { useProductsManagementLogic } from './hooks/useProductsManagementLogic'
import * as Utils from './utils'

// Specialized Tab Components
import { ProductsTab } from './tabs/ProductsTab'
import { ContentTab } from './tabs/ContentTab'
import { StorageTab } from './tabs/StorageTab'

export default function ProductsManagement() {
    const { state, actions } = useProductsManagementLogic()

    // El objeto helpers que esperan algunos componentes antiguos
    const helpers = {
        convertProductToActivity: Utils.convertProductToActivity
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-4">
            <Header
                activeMainTab={state.activeMainTab as any}
                onTabChange={(tab) => actions.setActiveMainTab(tab as any)}
            />

            {/* Content Tabs (Modularized) */}
            <main className="mt-4">
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
                        renderConsultationSection={(type) => (
                            <ConsultationSection
                                type={type}
                                consultation={state.consultations[type]}
                                sales={state.consultationSales[type]}
                                isEditing={state.editingPrice === type}
                                isToggling={state.isTogglingConsultation === type}
                                onToggle={actions.toggleConsultation}
                                onUpdatePrice={actions.updateConsultationPrice}
                                onSetEditingPrice={actions.setEditingPrice}
                                onSetConsultationError={actions.setConsultationError}
                                onSetConsultations={actions.setConsultations}
                                onWhatsAppClick={actions.handleWhatsAppClick}
                                onMeetClick={actions.handleMeetClick}
                            />
                        )}
                    />
                )}

                {state.activeMainTab === 'exercises' && (
                    <ContentTab
                        userId={state.user?.id}
                        activeSubTab={state.activeSubTab}
                        setActiveSubTab={actions.setActiveSubTab}
                    />
                )}

                {state.activeMainTab === 'storage' && (
                    <StorageTab />
                )}
            </main>

            <ProductsModals
                state={state as any}
                actions={actions as any}
                helpers={helpers}
            />
        </div>
    )
}
