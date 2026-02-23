import React, { useMemo } from "react"
import { Plus, Zap, Dumbbell, UtensilsCrossed, Pencil, Trash2, AlertCircle, Settings2, User, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ConditionalRule } from "../conditional-rules-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

    // Lógica para detectar contradicciones globales en la lista
    const rulesWithConflicts = useMemo(() => {
        return rules.map(rule => {
            if (!rule.isActive) return { ...rule, globalConflicts: [] };

            const conflicts = rules.filter(other => {
                if (rule.id === other.id || !other.isActive) return false;

                // Overlap check simplified
                const catMatch = (rule.criteria?.type || productCategory) === (other.criteria?.type || productCategory);
                if (!catMatch) return false;

                // Demographic Overlap
                const genderOverlap = rule.criteria.gender === "all" || other.criteria.gender === "all" || rule.criteria.gender === other.criteria.gender;
                const [min1, max1] = rule.criteria.ageRange || [0, 100];
                const [min2, max2] = other.criteria.ageRange || [0, 100];
                const ageOverlap = min1 <= max2 && min2 <= max1;

                // Identical Profile Check (Contradiction)
                const g1 = (rule.criteria.fitnessGoals || []).sort().join(",");
                const g2 = (other.criteria.fitnessGoals || []).sort().join(",");
                const i1 = (rule.criteria.injuries || []).sort().join(",");
                const i2 = (other.criteria.injuries || []).sort().join(",");
                const profilesIdentical = g1 === g2 && i1 === i2 && genderOverlap && ageOverlap;

                return profilesIdentical;
            });

            return { ...rule, globalConflicts: conflicts };
        });
    }, [rules, productCategory]);

    const getAdjustmentsSummary = (rule: ConditionalRule) => {
        const type = rule.criteria?.type || productCategory
        const a = rule.adjustments
        if (type === "fitness") {
            const lines = []
            if (a.weight) lines.push(`Peso: ${a.weight > 0 ? "+" : ""}${a.weight}%`)
            if (a.reps) lines.push(`Reps: ${a.reps > 0 ? "+" : ""}${a.reps}%`)
            if (a.series) lines.push(`Series: ${a.series > 0 ? "+" : ""}${a.series}%`)
            if (a.rest) lines.push(`Descanso: ${a.rest > 0 ? "+" : ""}${a.rest}%`)
            return lines.length > 0 ? lines.join(" • ") : "Sin ajustes"
        } else {
            return a.portions ? `Porciones: ${a.portions > 0 ? "+" : ""}${a.portions}%` : "Sin ajustes"
        }
    }

    if (rules.length === 0) {
        return (
            <div className="text-center py-16 flex flex-col items-center">
                <div className="p-4 rounded-full bg-white/5 mb-3 ring-1 ring-white/10">
                    <Zap className="h-6 w-6 text-[#FF7939] opacity-40" />
                </div>
                <p className="text-white/40 text-sm mb-6">No hay reglas de personalización configuradas.</p>
                <Button onClick={onAddRule} className="bg-[#FF7939] hover:bg-[#E66829] text-white px-8 rounded-full h-11">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Nueva Regla
                </Button>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="w-full">
                <div className="flex justify-between items-center mb-5 px-1">
                    <div className="flex items-center gap-3">
                        <Settings2 className="h-5 w-5 text-[#FF7939]" />
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-white tracking-tight">Motores de Personalización</h3>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{rules.length} Reglas Configuradas</span>
                        </div>
                    </div>
                    <Button
                        onClick={onAddRule}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full h-8 px-4 text-[11px] font-bold"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2 text-[#FF7939]" />
                        Nueva Regla
                    </Button>
                </div>

                <div className="relative group/scroll">
                    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="min-w-[950px]">
                            <table className="w-full border-separate border-spacing-y-1.5">
                                <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20">
                                        <th className="text-left px-5 py-3">Nombre</th>
                                        <th className="text-left px-5 py-3">Perfil Demográfico</th>
                                        <th className="text-left px-5 py-3">Actividad</th>
                                        <th className="text-left px-5 py-3">Objetivos</th>
                                        <th className="text-left px-5 py-3">Lesiones</th>
                                        <th className="text-left px-5 py-3">Ajustes Finales</th>
                                        <th className="text-right px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rulesWithConflicts.map((rule) => {
                                        const c = rule.criteria
                                        const type = c?.type || productCategory
                                        const isFitness = type === "fitness"
                                        const hasConflicts = rule.globalConflicts.length > 0;

                                        return (
                                            <tr
                                                key={rule.id}
                                                className={`transition-all duration-200 ${!rule.isActive ? "opacity-30 grayscale" : "hover:bg-white/[0.01]"}`}
                                            >
                                                {/* NOMBRE */}
                                                <td className="bg-white/[0.03] first:rounded-l-xl px-5 py-3.5 border-y border-l border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isFitness ? "bg-orange-500/10 text-orange-400" : "bg-green-500/10 text-green-400"}`}>
                                                            {isFitness ? <Dumbbell className="h-3.5 w-3.5" /> : <UtensilsCrossed className="h-3.5 w-3.5" />}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[12px] font-bold text-white truncate max-w-[150px]">{rule.name}</span>
                                                                {hasConflicts && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <AlertCircle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-red-500 text-white border-none text-[10px] p-2 leading-tight max-w-[200px]">
                                                                            <p className="font-bold mb-1">Posible Contradicción</p>
                                                                            <p className="opacity-90">Esta regla tiene un perfil idéntico a:</p>
                                                                            <ul className="mt-1 list-disc list-inside">
                                                                                {rule.globalConflicts.map(conf => (
                                                                                    <li key={conf.id}>{conf.name}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* PERFIL */}
                                                <td className="bg-white/[0.03] px-5 py-3.5 border-y border-white/5">
                                                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                                                            <User className="h-2.5 w-2.5 text-gray-500" />
                                                            <span>{c.ageRange?.[0]}-{c.ageRange?.[1]} años • {c.weightRange?.[0]}-{c.weightRange?.[1]} kg</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-blue-400/80 uppercase tracking-wider">
                                                            {c.gender === "all" ? "Todos los sexos" : c.gender === "male" ? "Hombres" : "Mujeres"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* ACTIVIDAD */}
                                                <td className="bg-white/[0.03] px-5 py-3.5 border-y border-white/5">
                                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                        {c.activityLevel?.length ? c.activityLevel.map(l => (
                                                            <span key={l} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-bold uppercase border border-white/10">
                                                                {l}
                                                            </span>
                                                        )) : <span className="text-[11px] text-white/10">—</span>}
                                                    </div>
                                                </td>

                                                {/* OBJETIVOS */}
                                                <td className="bg-white/[0.03] px-5 py-3.5 border-y border-white/5">
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {c.fitnessGoals?.length ? c.fitnessGoals.map(g => (
                                                            <span key={g} className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase border border-blue-500/10 whitespace-nowrap">
                                                                {g}
                                                            </span>
                                                        )) : <span className="text-[11px] text-white/10">—</span>}
                                                    </div>
                                                </td>

                                                {/* LESIONES */}
                                                <td className="bg-white/[0.03] px-5 py-3.5 border-y border-white/5">
                                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                                        {c.injuries?.length ? c.injuries.map(i => (
                                                            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#FF7939] font-bold">
                                                                <div className="w-1 h-1 rounded-full bg-[#FF7939]" />
                                                                <span>{i}</span>
                                                            </div>
                                                        )) : <span className="text-[11px] text-white/10">—</span>}
                                                    </div>
                                                </td>

                                                {/* AJUSTES */}
                                                <td className="bg-white/[0.03] px-5 py-3.5 border-y border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3 w-3 text-[#FF7939]" />
                                                        <span className="text-[11px] font-bold text-white whitespace-nowrap">{getAdjustmentsSummary(rule)}</span>
                                                    </div>
                                                </td>

                                                {/* ACCIONES */}
                                                <td className="bg-white/[0.03] last:rounded-r-xl px-5 py-3.5 border-y border-r border-white/5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Switch
                                                            checked={rule.isActive}
                                                            onCheckedChange={() => onToggleRule(rule.id)}
                                                            className="scale-[0.7] data-[state=checked]:bg-[#FF7939]"
                                                        />
                                                        <div className="flex items-center gap-0.5">
                                                            <button
                                                                onClick={() => onEditRule(rule)}
                                                                className="p-1.5 hover:bg-white/10 rounded-md transition-all text-gray-500 hover:text-white"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDeleteRule(rule.id)}
                                                                className="p-1.5 hover:bg-red-500/10 rounded-md transition-all text-gray-500 hover:text-red-400"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
