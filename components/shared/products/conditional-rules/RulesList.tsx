import React from "react"
import { Plus, Zap, Dumbbell, UtensilsCrossed, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ConditionalRule } from "../conditional-rules-data"

interface RulesListProps {
    rules: ConditionalRule[]
    productCategory: "fitness" | "nutricion"
    onAddRule: () => void
    onToggleRule: (id: string) => void
    onEditRule: (rule: ConditionalRule) => void
    onDeleteRule: (id: string) => void
}

export const RulesList = ({
    rules,
    productCategory,
    onAddRule,
    onToggleRule,
    onEditRule,
    onDeleteRule,
}: RulesListProps) => {
    const getAdjustmentsSummary = (rule: ConditionalRule) => {
        const type = rule.criteria?.type || productCategory
        if (type === "fitness") {
            const parts = []
            if ((rule.adjustments.weight || 0) !== 0) parts.push(`Peso ${(rule.adjustments.weight || 0) > 0 ? "+" : ""}${rule.adjustments.weight}%`)
            if ((rule.adjustments.reps || 0) !== 0) parts.push(`Reps ${(rule.adjustments.reps || 0) > 0 ? "+" : ""}${rule.adjustments.reps}%`)
            if ((rule.adjustments.series || 0) !== 0) parts.push(`Series ${(rule.adjustments.series || 0) > 0 ? "+" : ""}${rule.adjustments.series}%`)
            if (parts.length === 0) return "Sin ajustes de entrenamiento"
            return parts.join(" • ")
        } else {
            const portions = rule.adjustments.portions || 0
            return `Porciones ${portions > 0 ? "+" : ""}${portions}%`
        }
    }

    if (rules.length === 0) {
        return (
            <div className="text-center py-12 flex flex-col items-center">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                    <Zap className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm mb-6">No hay reglas configuradas aún.</p>
                <Button onClick={onAddRule} className="bg-[#FF7939] hover:bg-[#E66829] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Regla
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-400">
                    {rules.length} {rules.length === 1 ? "regla activa" : "reglas activas"}
                </span>
                <Button
                    onClick={onAddRule}
                    variant="ghost"
                    size="sm"
                    className="text-[#FF7939] hover:text-[#FF7939] hover:bg-[#FF7939]/10"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                </Button>
            </div>
            <div className="space-y-4">
                {rules.map((rule) => {
                    const summary = getAdjustmentsSummary(rule)
                    const type = rule.criteria?.type || productCategory
                    const isFitness = type === "fitness"

                    return (
                        <div
                            key={rule.id}
                            className={`group relative p-4 rounded-xl border transition-all duration-300 ${rule.isActive
                                    ? "border-white/10 bg-gradient-to-r from-white/5 to-transparent"
                                    : "border-white/5 bg-transparent opacity-60"
                                } hover:border-white/20`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${isFitness
                                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                                    : "bg-green-500/10 text-green-400 border-green-500/20"
                                                }`}
                                        >
                                            {isFitness ? <Dumbbell className="h-3 w-3" /> : <UtensilsCrossed className="h-3 w-3" />}
                                            {isFitness ? "Fitness" : "Nutrición"}
                                        </div>
                                        {rule.criteria.gender !== "all" && (
                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md font-medium">
                                                {rule.criteria.gender === "male" ? "H" : "M"}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-white text-sm truncate mb-1.5">{rule.name}</h3>
                                    <div className="text-xs text-gray-400 flex items-center gap-2 truncate">
                                        <Zap className="h-3 w-3 text-[#FF7939]" />
                                        <span>{summary}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={rule.isActive} onCheckedChange={() => onToggleRule(rule.id)} className="scale-75" />
                                    <div className="h-4 w-px bg-white/10 mx-1" />
                                    <button
                                        onClick={() => onEditRule(rule)}
                                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteRule(rule.id)}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
