import { motion } from "framer-motion"
import { Users, Check, ChevronDown, ListChecks, Dumbbell, UtensilsCrossed } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { ConditionalRule } from "../../conditional-rules-data"
import { FITNESS_GOALS_OPTIONS, ACTIVITY_LEVEL_OPTIONS } from "../../conditional-rules-data"

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

    const toggleAffectedItem = (itemId: string) => {
        let current = newRule.affectedItems === "all" ? [] : newRule.affectedItems || []
        const isSelected = newRule.affectedItems === "all" || current.includes(itemId)

        if (isSelected) {
            current = current.filter((id) => id !== itemId)
        } else {
            current = [...current, itemId]
        }
        updateRule({ affectedItems: current.length === 0 ? [] : current })
    }

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-4"
        >
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                    <Users className="h-4 w-4 text-[#FF7939]" />
                    <Label className="text-white font-semibold">Criterios de Aplicación</Label>
                </div>

                {/* --- SECCIÓN 1: DEMOGRAFÍA & META --- */}
                <div className="grid grid-cols-1 gap-6">
                    {/* SEXO */}
                    <div className="space-y-3">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Sexo</span>
                        <div className="grid grid-cols-3 gap-2">
                            {["all", "male", "female"].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => updateCriteria({ gender: g as any })}
                                    className={`py-2.5 text-[10px] rounded-xl border transition-all duration-300 ${newRule.criteria?.gender === g
                                        ? "border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_15px_rgba(255,121,57,0.1)]"
                                        : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                        }`}
                                >
                                    {g === "all" ? "Ambos" : g === "male" ? "Hombre" : "Mujer"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* OBJETIVOS */}
                    <div className="space-y-3">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Objetivos</span>
                        <div className="max-h-[220px] overflow-y-auto pr-2 thin-scrollbar bg-black/20 rounded-xl p-2 border border-white/5">
                            <div className="grid grid-cols-2 gap-2">
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
                                            className={`py-2 px-3 text-[10px] rounded-lg border text-left transition-all duration-300 flex items-center gap-2 ${isSelected
                                                ? "border-[#FF7939] bg-[#FF7939]/10 text-white"
                                                : "border-white/5 bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300"
                                                }`}
                                        >
                                            <div
                                                className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? "border-[#FF7939] bg-[#FF7939]" : "border-gray-600"
                                                    }`}
                                            >
                                                {isSelected && <Check className="h-2 w-2 text-white" />}
                                            </div>
                                            <span className="truncate">{goal}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* NIVEL ACTIVIDAD */}
                    <div className="space-y-3">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                            Nivel de Actividad
                        </span>
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
                                        className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${isSelected
                                            ? "border-[#FF7939] bg-[#FF7939]/10 text-white"
                                            : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                            }`}
                                    >
                                        {level}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* EDAD Y PESO */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Edad</span>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={newRule.criteria?.ageRange?.[0] || ""}
                                    onChange={(e) => updateCriteria({ ageRange: [parseInt(e.target.value) || 0, newRule.criteria?.ageRange?.[1] || 100] })}
                                    className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={newRule.criteria?.ageRange?.[1] || ""}
                                    onChange={(e) => updateCriteria({ ageRange: [newRule.criteria?.ageRange?.[0] || 0, parseInt(e.target.value) || 100] })}
                                    className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Peso (kg)</span>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={newRule.criteria?.weightRange?.[0] || ""}
                                    onChange={(e) => updateCriteria({ weightRange: [parseInt(e.target.value) || 0, newRule.criteria?.weightRange?.[1] || 200] })}
                                    className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={newRule.criteria?.weightRange?.[1] || ""}
                                    onChange={(e) => updateCriteria({ weightRange: [newRule.criteria?.weightRange?.[0] || 0, parseInt(e.target.value) || 200] })}
                                    className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-6 text-center text-gray-500 text-xs">
                <ChevronDown className="h-4 w-4 mx-auto animate-bounce opacity-50" />
                <p>Desplázate hacia abajo para seleccionar items afectados</p>
            </div>

            {/* --- SECCIÓN 2: ITEMS AFECTADOS --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                    <ListChecks className="h-4 w-4 text-[#FF7939]" />
                    <Label className="text-white font-semibold">Items Afectados</Label>
                </div>
                <div className="space-y-3">
                    <div className="relative">
                        <Input
                            placeholder={newRule.criteria?.type === "fitness" ? "Buscar ejercicio..." : "Buscar plato..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border-white/10 pl-10 h-11 text-white placeholder:text-gray-500 focus:ring-[#FF7939]/20"
                        />
                        <div className="absolute left-3 top-3.5 text-gray-500">
                            {newRule.criteria?.type === "fitness" ? (
                                <Dumbbell className="h-4 w-4" />
                            ) : (
                                <UtensilsCrossed className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto pr-2 thin-scrollbar space-y-2">
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
                                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? "bg-[#FF7939]/10 border-[#FF7939]/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                            }`}
                                    >
                                        <span className="text-sm text-gray-300 font-medium truncate pr-4">
                                            {item.nombre || item["Nombre"] || item.title}
                                            {item.etiqueta && (
                                                <Badge variant="secondary" className="ml-2 text-[10px] h-5">
                                                    {item.etiqueta}
                                                </Badge>
                                            )}
                                        </span>
                                        <div
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-[#FF7939] bg-[#FF7939]" : "border-white/20"
                                                }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
