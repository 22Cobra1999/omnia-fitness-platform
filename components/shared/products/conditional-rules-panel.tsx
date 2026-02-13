"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Settings2, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConditionalRules } from "./useConditionalRules"
import { RulesList } from "./conditional-rules/RulesList"
import { RuleEditor } from "./conditional-rules/RuleEditor"
import type { ConditionalRule } from "./conditional-rules-data"

interface ConditionalRulesPanelProps {
    isOpen: boolean
    onClose: () => void
    productCategory: "fitness" | "nutricion"
    availableItems: any[]
    onSaveRules: (rules: ConditionalRule[]) => void
    initialRules?: ConditionalRule[]
    productId?: number
    coachId?: string
}

export function ConditionalRulesPanel({
    isOpen,
    onClose,
    productCategory,
    availableItems,
    onSaveRules,
    initialRules = [],
    productId,
    coachId,
}: ConditionalRulesPanelProps) {
    const { state, actions } = useConditionalRules({
        productId,
        coachId,
        productCategory,
        onSaveRules,
        initialRules,
        isOpen,
    })

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0b0b0b] border-l border-white/10 z-[110] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#FF7939]/10">
                                    <Settings2 className="h-5 w-5 text-[#FF7939]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Reglas Condicionales</h2>
                                    <p className="text-xs text-gray-400">Ajustes automáticos por cliente</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {!state.isCreating ? (
                                <RulesList
                                    rules={state.rules}
                                    productCategory={productCategory}
                                    onAddRule={() => actions.setIsCreating(true)}
                                    onToggleRule={actions.handleToggleRule}
                                    onEditRule={actions.handleEditRule}
                                    onDeleteRule={actions.handleDeleteRule}
                                />
                            ) : (
                                <RuleEditor
                                    currentStep={state.currentStep}
                                    newRule={state.newRule}
                                    setNewRule={actions.setNewRule}
                                    fetchedProducts={state.fetchedProducts}
                                    fetchedItems={state.fetchedItems}
                                    availableItems={availableItems}
                                    searchQuery={state.searchQuery}
                                    setSearchQuery={actions.setSearchQuery}
                                    productCategory={productCategory}
                                />
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-[#0b0b0b]">
                            {!state.isCreating ? (
                                <Button onClick={onClose} variant="ghost" className="w-full text-gray-400 hover:text-white">
                                    Cerrar
                                </Button>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => {
                                            if (state.currentStep === 1) actions.setIsCreating(false)
                                            else actions.setCurrentStep(state.currentStep - 1)
                                        }}
                                        variant="ghost"
                                        className="flex-1 text-gray-400 hover:text-white"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        {state.currentStep === 1 ? "Cancelar" : "Anterior"}
                                    </Button>

                                    {state.currentStep < 4 ? (
                                        <Button
                                            onClick={() => actions.setCurrentStep(state.currentStep + 1)}
                                            disabled={state.currentStep === 1 && !state.newRule.name}
                                            className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white"
                                        >
                                            Siguiente
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={actions.handleSaveNewRule}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Guardar Regla
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
