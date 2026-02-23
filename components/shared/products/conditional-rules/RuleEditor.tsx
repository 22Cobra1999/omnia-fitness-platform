import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Sparkles, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ConditionalRule } from "../conditional-rules-data"
import { useRuleEditorLogic } from "./hooks/useRuleEditorLogic"
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
    conflictingRules?: any[]
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
    conflictingRules = [],
}: RuleEditorProps) => {
    const hasCriticalConflict = conflictingRules.some((c) => c.type === "CRITICAL")
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
        <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AnimatePresence>
                {currentStep === 4 && conflictingRules.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 space-y-4 overflow-hidden"
                    >
                        {/* MAIN HEADER BASED ON HIGHEST SEVERITY */}
                        {hasCriticalConflict ? (
                            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex gap-3">
                                <div className="p-2 rounded-xl bg-red-500/10 self-start">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                                <div className="space-y-1 py-0.5">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Bloqueo de Motor</p>
                                    <p className="text-[11px] text-white/40 leading-tight font-medium">
                                        Perfil idéntico detectado. No se puede guardar.
                                    </p>
                                </div>
                            </div>
                        ) : conflictingRules.some(c => c.type === "SPECIFIC") ? (
                            <div className="p-4 rounded-2xl bg-[#FF7939]/5 border border-[#FF7939]/10 flex gap-3">
                                <div className="p-2 rounded-xl bg-[#FF7939]/10 self-start">
                                    <AlertCircle className="h-4 w-4 text-[#FF7939]" />
                                </div>
                                <div className="space-y-1 py-0.5">
                                    <p className="text-[10px] font-black text-[#FF7939] uppercase tracking-widest">Prioridad por Especificidad</p>
                                    <p className="text-[11px] text-white/40 leading-tight font-medium">
                                        Se detectó una relación de jerarquía. La regla más específica anulará a la general.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 self-start">
                                    <Sparkles className="h-4 w-4 text-blue-400" />
                                </div>
                                <div className="space-y-1 py-0.5">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ajustes Sumatorios</p>
                                    <p className="text-[11px] text-white/40 leading-tight font-medium">
                                        Esta regla complementa a otras existentes.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* LIST OF OVERLAPPING RULES */}
                        <div className="space-y-2">
                            {conflictingRules.map((conf, idx) => (
                                <div
                                    key={idx}
                                    className={`px-4 py-3 rounded-xl border-l-2 bg-white/[0.02] border-y border-r border-y-white/5 border-r-white/5 ${conf.type === "CRITICAL"
                                        ? "border-l-red-500/50"
                                        : conf.type === "SPECIFIC"
                                            ? "border-l-[#FF7939]/50"
                                            : "border-l-blue-500/50"
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-[10px] font-bold text-white/80 tracking-tight">
                                            {conf.rule.name}
                                        </p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${conf.type === "CRITICAL"
                                            ? "bg-red-500/10 text-red-400"
                                            : conf.type === "SPECIFIC"
                                                ? "bg-[#FF7939]/10 text-[#FF7939]"
                                                : "bg-blue-500/10 text-blue-400"
                                            }`}>
                                            {conf.type === "CRITICAL" ? "Conflicto" : conf.type === "SPECIFIC" ? "Jerarquía" : "Sumatoria"}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-white/30 truncate">
                                        {conf.reasons.join(" • ")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
