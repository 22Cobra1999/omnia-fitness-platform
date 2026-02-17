import { motion } from "framer-motion"
import { Zap, Dumbbell, ListChecks, UtensilsCrossed, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { ConditionalRule } from "../../conditional-rules-data"

interface RuleStepAdjustmentsProps {
    newRule: Partial<ConditionalRule>
    productCategory: "fitness" | "nutricion"
    updateAdjustments: (adjustments: any) => void
}

export const RuleStepAdjustments = ({ newRule, productCategory, updateAdjustments }: RuleStepAdjustmentsProps) => {
    const isFitness = (newRule.criteria?.type || productCategory) === "fitness"

    return (
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
                        Ajustes Automáticos ({isFitness ? "Fitness" : "Nutrición"})
                    </Label>
                </div>

                {isFitness ? (
                    <div className="grid grid-cols-1 gap-8">
                        {[
                            { key: "weight", label: "Peso", icon: Dumbbell },
                            { key: "reps", label: "Repeticiones", icon: ListChecks },
                            { key: "series", label: "Series", icon: Zap },
                        ].map((adj) => {
                            const value = (newRule.adjustments as any)?.[adj.key] || 0
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
                                        onChange={(e) => updateAdjustments({ [adj.key]: parseInt(e.target.value) })}
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
                            onChange={(e) => updateAdjustments({ portions: parseInt(e.target.value) })}
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
    )
}
