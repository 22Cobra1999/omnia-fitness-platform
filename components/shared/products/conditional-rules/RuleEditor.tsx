import React, { useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import type { ConditionalRule } from "../conditional-rules-data"
import { useRuleEditorLogic } from "./hooks/useRuleEditorLogic"
import { RuleProgress } from "./RuleEditorBase/RuleProgress"
import { RuleStepNameType } from "./RuleEditorBase/RuleStepNameType"
import { RuleStepScope } from "./RuleEditorBase/RuleStepScope"
import { RuleStepCriteria } from "./RuleEditorBase/RuleStepCriteria"
import { RuleStepAdjustments } from "./RuleEditorBase/RuleStepAdjustments"

interface RuleEditorProps {
    currentStep: number // Controlled by parent
    newRule: Partial<ConditionalRule> // Controlled by parent
    setNewRule: (rule: Partial<ConditionalRule>) => void // Controlled by parent
    fetchedProducts: any[]
    fetchedItems: any[]
    availableItems: any[]
    searchQuery: string // Controlled by parent
    setSearchQuery: (query: string) => void // Controlled by parent
    productCategory: "fitness" | "nutricion"
}

export const RuleEditor = ({
    currentStep,
    newRule,
    setNewRule,
    fetchedProducts,
    fetchedItems,
    availableItems,
    searchQuery,
    setSearchQuery,
    productCategory,
}: RuleEditorProps) => {
    // We are receiving state from props because the parent (Wizard) controls it.
    // However, we can use our hook for internal logic if we refactor the parent later.
    // For now, we will use the props directly to maintain compatibility with the current parent implementation,
    // but we use the extracted sub-components to clean up this file.

    // Small helper wrappers to match sub-component props
    const updateRule = (updates: Partial<ConditionalRule>) => setNewRule({ ...newRule, ...updates })

    const updateCriteria = (criteria: Partial<ConditionalRule['criteria']>) =>
        setNewRule({ ...newRule, criteria: { ...(newRule.criteria || {}), ...criteria } as any })

    const updateAdjustments = (adjustments: any) =>
        setNewRule({ ...newRule, adjustments: { ...(newRule.adjustments || {}), ...adjustments } })

    return (
        <div className="space-y-6">
            <RuleProgress currentStep={currentStep} />

            <AnimatePresence mode="wait">
                {currentStep === 1 && (
                    <RuleStepNameType
                        newRule={newRule}
                        onChangeName={(name) => updateRule({ name })}
                        onChangeType={(type) => updateCriteria({ type })}
                    />
                )}

                {currentStep === 2 && (
                    <RuleStepScope
                        newRule={newRule}
                        fetchedProducts={fetchedProducts}
                        onChangeTargetProducts={(ids) => updateRule({ targetProductIds: ids })}
                    />
                )}

                {currentStep === 3 && (
                    <RuleStepCriteria
                        newRule={newRule}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        fetchedItems={fetchedItems}
                        availableItems={availableItems}
                        updateCriteria={updateCriteria}
                        updateRule={updateRule}
                    />
                )}

                {currentStep === 4 && (
                    <RuleStepAdjustments
                        newRule={newRule}
                        productCategory={productCategory}
                        updateAdjustments={updateAdjustments}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
