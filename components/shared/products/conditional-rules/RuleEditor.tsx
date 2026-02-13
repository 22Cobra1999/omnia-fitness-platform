import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Dumbbell,
    UtensilsCrossed,
    Target,
    Users,
    Check,
    ChevronDown,
    ListChecks,
    Zap,
    AlertCircle,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { ConditionalRule } from "../conditional-rules-data"
import { FITNESS_GOALS_OPTIONS, ACTIVITY_LEVEL_OPTIONS } from "../conditional-rules-data"

interface RuleEditorProps {
    currentStep: number
    newRule: Partial<ConditionalRule>
    setNewRule: (rule: Partial<ConditionalRule>) => void
    fetchedProducts: any[]
    fetchedItems: any[]
    availableItems: any[]
    searchQuery: string
    setSearchQuery: (query: string) => void
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
    return (
        <div className="space-y-6">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map((step) => (
                    <React.Fragment key={step}>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step
                                    ? "bg-[#FF7939] text-white shadow-[0_0_15px_rgba(255,121,57,0.4)]"
                                    : "bg-white/10 text-gray-500"
                                }`}
                        >
                            {step}
                        </div>
                        {step < 4 && (
                            <div className={`flex-1 h-px transition-all ${currentStep > step ? "bg-[#FF7939]" : "bg-white/10"}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 pb-4"
                    >
                        <div className="space-y-4">
                            <Label className="text-white text-xs font-semibold uppercase tracking-wider opacity-60">
                                Nombre de la regla
                            </Label>
                            <Input
                                value={newRule.name}
                                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                placeholder="Ej: Aumento por nivel avanzado"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 focus:ring-[#FF7939]/20"
                            />
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Tipo de Regla</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setNewRule({
                                            ...newRule,
                                            criteria: { ...newRule.criteria, type: "fitness" },
                                        })
                                    }
                                    className={`p-3 rounded-xl border text-center transition-all duration-300 ${newRule.criteria?.type === "fitness"
                                            ? "border-[#FF7939] bg-[#FF7939]/10 text-white"
                                            : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                        }`}
                                >
                                    <Dumbbell
                                        className={`h-4 w-4 mx-auto mb-2 ${newRule.criteria?.type === "fitness" ? "text-[#FF7939]" : "text-gray-500"
                                            }`}
                                    />
                                    <div className="text-xs font-semibold">Entremiento</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setNewRule({
                                            ...newRule,
                                            criteria: { ...newRule.criteria, type: "nutricion" },
                                        })
                                    }
                                    className={`p-3 rounded-xl border text-center transition-all duration-300 ${newRule.criteria?.type === "nutricion"
                                            ? "border-[#FF7939] bg-[#FF7939]/10 text-white"
                                            : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                        }`}
                                >
                                    <UtensilsCrossed
                                        className={`h-4 w-4 mx-auto mb-2 ${newRule.criteria?.type === "nutricion" ? "text-[#FF7939]" : "text-gray-500"
                                            }`}
                                    />
                                    <div className="text-xs font-semibold">Nutrición</div>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                                <Target className="h-4 w-4 text-[#FF7939]" />
                                <Label className="text-white font-semibold">Alcance de la Regla</Label>
                            </div>
                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                Define a qué productos o talleres se aplicará esta regla. Puedes hacerla global o específica para ciertos
                                programas.
                            </p>
                            <div className="space-y-3">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                    Aplica a (Productos)
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewRule({ ...newRule, targetProductIds: [] })}
                                        className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${!newRule.targetProductIds || newRule.targetProductIds.length === 0
                                                ? "border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]"
                                                : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                            }`}
                                    >
                                        Todos (Global)
                                    </button>
                                    {fetchedProducts.map((prod) => {
                                        const isSelected = newRule.targetProductIds?.some((id) => String(id) === String(prod.id))
                                        return (
                                            <button
                                                key={prod.id}
                                                type="button"
                                                onClick={() => {
                                                    const current = newRule.targetProductIds || []
                                                    const prodIdStr = String(prod.id)
                                                    const next = isSelected
                                                        ? current.filter((id) => String(id) !== prodIdStr)
                                                        : [...current, prod.id]
                                                    setNewRule({ ...newRule, targetProductIds: next })
                                                }}
                                                className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${isSelected
                                                        ? "border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]"
                                                        : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                                    }`}
                                            >
                                                {prod.title}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 3 && (
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
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Sexo</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["all", "male", "female"].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() =>
                                                    setNewRule({
                                                        ...newRule,
                                                        criteria: { ...newRule.criteria, gender: g as any },
                                                    })
                                                }
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
                                                            setNewRule({
                                                                ...newRule,
                                                                criteria: { ...newRule.criteria, fitnessGoals: next },
                                                            })
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
                                                        setNewRule({
                                                            ...newRule,
                                                            criteria: { ...newRule.criteria, activityLevel: next },
                                                        })
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Edad</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                value={newRule.criteria?.ageRange?.[0]}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    setNewRule({
                                                        ...newRule,
                                                        criteria: {
                                                            ...newRule.criteria,
                                                            ageRange: [val, newRule.criteria?.ageRange?.[1] || 100],
                                                        },
                                                    })
                                                }}
                                                className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                value={newRule.criteria?.ageRange?.[1]}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 100
                                                    setNewRule({
                                                        ...newRule,
                                                        criteria: {
                                                            ...newRule.criteria,
                                                            ageRange: [newRule.criteria?.ageRange?.[0] || 0, val],
                                                        },
                                                    })
                                                }}
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
                                                value={newRule.criteria?.weightRange?.[0]}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    setNewRule({
                                                        ...newRule,
                                                        criteria: {
                                                            ...newRule.criteria,
                                                            weightRange: [val, newRule.criteria?.weightRange?.[1] || 200],
                                                        },
                                                    })
                                                }}
                                                className="bg-black/40 border-white/10 text-white text-xs h-9 text-center"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                value={newRule.criteria?.weightRange?.[1]}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 200
                                                    setNewRule({
                                                        ...newRule,
                                                        criteria: {
                                                            ...newRule.criteria,
                                                            weightRange: [newRule.criteria?.weightRange?.[0] || 0, val],
                                                        },
                                                    })
                                                }}
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
                                                    onClick={() => {
                                                        let current = newRule.affectedItems === "all" ? [] : newRule.affectedItems || []
                                                        if (isSelected) {
                                                            current = current.filter((id) => id !== itemId)
                                                        } else {
                                                            current = [...current, itemId]
                                                        }
                                                        setNewRule({ ...newRule, affectedItems: current.length === 0 ? [] : current })
                                                    }}
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
                )}

                {currentStep === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-8">
                            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                                <Zap className="h-4 w-4 text-[#FF7939]" />
                                <Label className="text-white font-semibold">
                                    Ajustes Automáticos ({(newRule.criteria?.type || productCategory) === "fitness" ? "Fitness" : "Nutrición"})
                                </Label>
                            </div>
                            {(newRule.criteria?.type || productCategory) === "fitness" ? (
                                <div className="grid grid-cols-1 gap-8">
                                    {[
                                        { key: "weight", label: "Peso", icon: Dumbbell },
                                        { key: "reps", label: "Repeticiones", icon: ListChecks },
                                        { key: "series", label: "Series", icon: Zap },
                                    ].map((adj) => {
                                        const value = (newRule.adjustments as any)[adj.key]
                                        return (
                                            <div key={adj.key} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-white/5">
                                                            <adj.icon className="h-3.5 w-3.5 text-gray-400" />
                                                        </div>
                                                        <Label className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                                                            {adj.label}
                                                        </Label>
                                                    </div>
                                                    <span className="text-xs font-bold text-[#FF7939] bg-[#FF7939]/10 px-2 py-1 rounded-md">
                                                        {value > 0 ? `+${value}%` : `${value}%`}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-200"
                                                    max="200"
                                                    step="5"
                                                    value={value}
                                                    onChange={(e) =>
                                                        setNewRule({
                                                            ...newRule,
                                                            adjustments: {
                                                                ...newRule.adjustments,
                                                                [adj.key]: parseInt(e.target.value),
                                                            },
                                                        })
                                                    }
                                                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#FF7939]"
                                                />
                                                <div className="flex justify-between text-[10px] text-gray-600 font-bold px-1">
                                                    <span>-200%</span>
                                                    <span>0%</span>
                                                    <span>+200%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-white/5">
                                                <UtensilsCrossed className="h-3.5 w-3.5 text-gray-400" />
                                            </div>
                                            <Label className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                                                Porciones / Ingredientes
                                            </Label>
                                        </div>
                                        <span className="text-xs font-bold text-[#FF7939] bg-[#FF7939]/10 px-2 py-1 rounded-md">
                                            {(newRule.adjustments?.portions || 0) > 0
                                                ? `+${newRule.adjustments?.portions || 0}%`
                                                : `${newRule.adjustments?.portions || 0}%`}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-200"
                                        max="200"
                                        step="5"
                                        value={newRule.adjustments?.portions || 0}
                                        onChange={(e) =>
                                            setNewRule({
                                                ...newRule,
                                                adjustments: {
                                                    ...newRule.adjustments,
                                                    portions: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#FF7939]"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-600 font-bold px-1">
                                        <span>-200%</span>
                                        <span>0%</span>
                                        <span>+200%</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-300/80 leading-relaxed font-medium">
                                        Las repeticiones y series se redondearán automáticamente hacia arriba para asegurar la progresión
                                        adecuada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
