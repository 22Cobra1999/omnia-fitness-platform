import { motion } from "framer-motion"
import { Users, Check, ChevronDown, ListChecks, Dumbbell, UtensilsCrossed } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { ConditionalRule } from "../../conditional-rules-data"
import { FITNESS_GOALS_OPTIONS, ACTIVITY_LEVEL_OPTIONS, INJURY_OPTIONS } from "../../conditional-rules-data"

interface RuleStepCriteriaProps {
    newRule: Partial<ConditionalRule>
    searchQuery: string
    setSearchQuery: (query: string) => void
    fetchedItems: any[]
    availableItems: any[]
    updateCriteria: (criteria: Partial<ConditionalRule['criteria']>) => void
    updateRule: (rule: Partial<ConditionalRule>) => void
}

export const RuleStepCriteria = ({
    newRule,
    searchQuery,
    setSearchQuery,
    fetchedItems,
    availableItems,
    updateCriteria,
    updateRule,
}: RuleStepCriteriaProps) => {

    const itemsToDisplay = fetchedItems.length > 0 ? fetchedItems : availableItems
    const allItemIds = itemsToDisplay.map(i => String(i.id))
    const isAllSelected = newRule.affectedItems === "all"

    const toggleAffectedItem = (itemId: string) => {
        let current: string[] = []

        if (newRule.affectedItems === "all") {
            // If currently 'all', convert to a list of all items except the one being deselected
            current = allItemIds.filter((id: string) => id !== itemId)
        } else {
            const list = Array.isArray(newRule.affectedItems) ? newRule.affectedItems : []
            if (list.includes(itemId)) {
                current = list.filter((id: string) => id !== itemId)
            } else {
                current = [...list, itemId]
                // If the new list contains all items, we can set it back to "all" for simplicity
                if (current.length === allItemIds.length && allItemIds.length > 0) {
                    updateRule({ affectedItems: "all" })
                    return
                }
            }
        }

        updateRule({ affectedItems: current })
    }

    const handleToggleAll = () => {
        if (isAllSelected) {
            updateRule({ affectedItems: [] })
        } else {
            updateRule({ affectedItems: "all" })
        }
    }

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-4"
        >
            <div className="space-y-8">
                {/* --- SECCIÓN 1: DEMOGRAFÍA & META --- */}
                <div className="space-y-8">
                    {/* SEXO */}
                    <div className="space-y-4">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Perfil de Cliente</span>
                        <div className="flex gap-2">
                            {["all", "male", "female"].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => updateCriteria({ gender: g as any })}
                                    className={`py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${newRule.criteria?.gender === g
                                        ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
                                        : "bg-white/[0.03] text-white/30 hover:bg-white/[0.08]"
                                        }`}
                                >
                                    {g === "all" ? "Ambos" : g === "male" ? "Hombre" : "Mujer"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* EDAD Y PESO */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Rango de Edad</span>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={newRule.criteria?.ageRange?.[0] || ""}
                                    onChange={(e) => updateCriteria({ ageRange: [parseInt(e.target.value) || 0, newRule.criteria?.ageRange?.[1] || 100] })}
                                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 text-sm font-medium text-white placeholder:text-white/20 h-10 focus-visible:ring-0 focus-visible:border-[#FF7939] text-center"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={newRule.criteria?.ageRange?.[1] || ""}
                                    onChange={(e) => updateCriteria({ ageRange: [newRule.criteria?.ageRange?.[0] || 0, parseInt(e.target.value) || 100] })}
                                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 text-sm font-medium text-white placeholder:text-white/20 h-10 focus-visible:ring-0 focus-visible:border-[#FF7939] text-center"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Rango de Peso</span>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={newRule.criteria?.weightRange?.[0] || ""}
                                    onChange={(e) => updateCriteria({ weightRange: [parseInt(e.target.value) || 0, newRule.criteria?.weightRange?.[1] || 200] })}
                                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 text-sm font-medium text-white placeholder:text-white/20 h-10 focus-visible:ring-0 focus-visible:border-[#FF7939] text-center"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={newRule.criteria?.weightRange?.[1] || ""}
                                    onChange={(e) => updateCriteria({ weightRange: [newRule.criteria?.weightRange?.[0] || 0, parseInt(e.target.value) || 200] })}
                                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 text-sm font-medium text-white placeholder:text-white/20 h-10 focus-visible:ring-0 focus-visible:border-[#FF7939] text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* OBJETIVOS */}
                    <div className="space-y-4">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Objetivos Específicos</span>
                        <div className="flex flex-wrap gap-2">
                            {FITNESS_GOALS_OPTIONS.map((goal) => {
                                const isSelected = newRule.criteria?.fitnessGoals?.includes(goal)
                                return (
                                    <button
                                        key={goal}
                                        type="button"
                                        onClick={() => {
                                            const current = newRule.criteria?.fitnessGoals || []
                                            const next = isSelected ? current.filter((g) => g !== goal) : [...current, goal]
                                            updateCriteria({ fitnessGoals: next })
                                        }}
                                        className={`py-2 px-4 text-[10px] font-bold rounded-xl transition-all duration-300 ${isSelected
                                            ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
                                            : "bg-white/[0.03] text-white/30 hover:bg-white/[0.08]"
                                            }`}
                                    >
                                        {goal}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* NIVEL ACTIVIDAD */}
                    <div className="space-y-4">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Nivel de Actividad</span>
                        <div className="flex flex-wrap gap-2">
                            {ACTIVITY_LEVEL_OPTIONS.map((level) => {
                                const isSelected = newRule.criteria?.activityLevel?.includes(level)
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => {
                                            const current = newRule.criteria?.activityLevel || []
                                            const next = isSelected ? current.filter((l) => l !== level) : [...current, level]
                                            updateCriteria({ activityLevel: next })
                                        }}
                                        className={`py-2 px-4 text-[10px] font-bold rounded-xl transition-all duration-300 ${isSelected
                                            ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
                                            : "bg-white/[0.03] text-white/30 hover:bg-white/[0.08]"
                                            }`}
                                    >
                                        {level}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* LESIONES */}
                    <div className="space-y-4">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Lesiones / Limitaciones</span>
                        <div className="flex flex-wrap gap-2">
                            {INJURY_OPTIONS.map((injury) => {
                                const isSelected = newRule.criteria?.injuries?.includes(injury)
                                return (
                                    <button
                                        key={injury}
                                        type="button"
                                        onClick={() => {
                                            const current = newRule.criteria?.injuries || []
                                            const next = isSelected ? current.filter((i) => i !== injury) : [...current, injury]
                                            updateCriteria({ injuries: next })
                                        }}
                                        className={`py-2 px-4 text-[10px] font-bold rounded-xl transition-all duration-300 ${isSelected
                                            ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
                                            : "bg-white/[0.03] text-white/30 hover:bg-white/[0.08]"
                                            }`}
                                    >
                                        {injury}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN 2: ITEMS AFECTADOS --- */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Items del Plan</span>
                            <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                                Elegí qué elementos de {newRule.criteria?.type === "fitness" ? "entrenamiento" : "nutrición"} se verán afectados.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleAll}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${isAllSelected
                                ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                : "bg-[#FF7939]/10 border-[#FF7939]/20 text-[#FF7939] hover:bg-[#FF7939]/20"
                                }`}
                        >
                            {isAllSelected ? "Deseleccionar" : "Seleccionar"} Todos
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Input
                                placeholder={newRule.criteria?.type === "fitness" ? "Buscar ejercicio..." : "Buscar plato..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-0 border-b border-white/10 rounded-none pl-0 px-0 text-sm font-medium text-white placeholder:text-white/20 h-10 focus-visible:ring-0 focus-visible:border-[#FF7939]"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-hide space-y-1">
                            {(fetchedItems.length > 0 ? fetchedItems : availableItems)
                                .filter((item) => {
                                    const name = item.nombre || item["Nombre"] || item.title || ""
                                    return name.toLowerCase().includes(searchQuery.toLowerCase())
                                })
                                .map((item) => {
                                    const itemId = String(item.id)
                                    const isSelected = newRule.affectedItems === "all" || newRule.affectedItems?.includes(itemId)
                                    return (
                                        <div
                                            key={itemId}
                                            onClick={() => toggleAffectedItem(itemId)}
                                            className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isSelected ? "bg-white/10" : "hover:bg-white/[0.03]"
                                                }`}
                                        >
                                            <span className={`text-sm font-medium truncate pr-4 ${isSelected ? "text-white" : "text-white/40"}`}>
                                                {item.nombre || item["Nombre"] || item.title}
                                            </span>
                                            {isSelected && <Check className="h-4 w-4 text-[#FF7939]" />}
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
